import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { listArticles, getArticleById, createArticle, updateArticle, deleteArticle, getArticleByPairIdAndLanguage, listDiaryEntries, getDiaryEntryById, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry, saveDraft, getDraft, deleteDraft, listDrafts, getSitePage, upsertSitePage } from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { z } from "zod";

// Swedish → English category mapping
const categoryToEnglish: Record<string, string> = {
  "Behandling": "Treatment",
  "Forskning": "Research",
  "Vardagsliv": "Daily Life",
  "Läkemedel": "Medication",
  "Åsikt": "Opinion",
};

const categoryToSwedish: Record<string, string> = {
  "Treatment": "Behandling",
  "Research": "Forskning",
  "Daily Life": "Vardagsliv",
  "Medication": "Läkemedel",
  "Opinion": "Åsikt",
};

async function translateToEnglish(swedishText: string): Promise<string> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a translator. Translate the following Swedish text to English. Keep the same tone and style — it's a casual, personal diary entry. Return ONLY the translated text, nothing else.",
        },
        {
          role: "user",
          content: swedishText,
        },
      ],
    });
    const content = result.choices?.[0]?.message?.content;
    if (typeof content === "string") return content.trim();
    return "";
  } catch (error) {
    console.error("[Translation] Failed to translate:", error);
    return "";
  }
}

async function translateArticleFields(title: string, excerpt: string, content: string, direction: "sv-en" | "en-sv" = "sv-en"): Promise<{ title: string; excerpt: string; content: string }> {
  const fromLang = direction === "sv-en" ? "Swedish" : "English";
  const toLang = direction === "sv-en" ? "English" : "Swedish";
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following ${fromLang} article to ${toLang}. Keep the same tone, style, and markdown formatting. The article is a personal blog post about living with Alzheimer's disease.

Return a JSON object with exactly three fields: "title", "excerpt", and "content". Return ONLY the JSON, nothing else.`,
        },
        {
          role: "user",
          content: JSON.stringify({ title, excerpt, content }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "article_translation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "Translated title" },
              excerpt: { type: "string", description: "Translated excerpt" },
              content: { type: "string", description: "Translated content with markdown preserved" },
            },
            required: ["title", "excerpt", "content"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = result.choices?.[0]?.message?.content;
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      return {
        title: parsed.title || "",
        excerpt: parsed.excerpt || "",
        content: parsed.content || "",
      };
    }
    return { title: "", excerpt: "", content: "" };
  } catch (error) {
    console.error("[Translation] Failed to translate article:", error);
    return { title: "", excerpt: "", content: "" };
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  articles: router({
    list: publicProcedure
      .input(z.object({
        language: z.string().optional(),
        published: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listArticles({
          language: input?.language,
          published: input?.published ?? true,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getArticleById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        excerpt: z.string().min(1),
        content: z.string().min(1),
        category: z.string().min(1),
        language: z.string().default("sv"),
        pairId: z.number().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        publishedAt: z.date().optional(),
        published: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const publishedAt = input.publishedAt ?? new Date();
        const svResult = await createArticle({
          ...input,
          publishedAt,
          imageUrl: input.imageUrl ?? null,
          pairId: input.pairId ?? null,
        });

        // Auto-translate articles to the other language (in background)
        if (!input.pairId) {
          (async () => {
            try {
              const direction = input.language === "sv" ? "sv-en" : "en-sv";
              const targetLang = input.language === "sv" ? "en" : "sv";
              const translated = await translateArticleFields(input.title, input.excerpt, input.content, direction);
              if (translated.title && translated.content) {
                const targetCategory = input.language === "sv"
                  ? (categoryToEnglish[input.category] || input.category)
                  : (categoryToSwedish[input.category] || input.category);
                const pairResult = await createArticle({
                  title: translated.title,
                  excerpt: translated.excerpt,
                  content: translated.content,
                  category: targetCategory,
                  language: targetLang,
                  pairId: svResult.id,
                  imageUrl: input.imageUrl ?? null,
                  publishedAt,
                  published: input.published,
                });
                // Update the original article to link back
                await updateArticle(svResult.id, { pairId: svResult.id });
                console.log(`[Translation] Created ${targetLang.toUpperCase()} translation (id: ${pairResult.id}) for ${input.language.toUpperCase()} article (id: ${svResult.id})`);
              }
            } catch (error) {
              console.error("[Translation] Failed to create translation:", error);
            }
          })();
        }

        return svResult;
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        excerpt: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        language: z.string().optional(),
        pairId: z.number().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        publishedAt: z.date().optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateArticle(id, data);

        // Auto-update the paired translation
        const article = await getArticleById(id);
        if (article && article.pairId) {
          const targetLang = article.language === "sv" ? "en" : "sv";
          const pairedArticle = await getArticleByPairIdAndLanguage(article.pairId, targetLang);

          // Immediately sync category and image (no LLM needed)
          if (pairedArticle) {
            const immediateUpdates: Record<string, any> = {};
            if (data.category) {
              const targetCategory = article.language === "sv"
                ? (categoryToEnglish[data.category] || data.category)
                : (categoryToSwedish[data.category] || data.category);
              immediateUpdates.category = targetCategory;
            }
            if (data.imageUrl !== undefined) {
              immediateUpdates.imageUrl = data.imageUrl;
            }
            if (data.published !== undefined) {
              immediateUpdates.published = data.published;
            }
            if (Object.keys(immediateUpdates).length > 0) {
              await updateArticle(pairedArticle.id, immediateUpdates);
              console.log(`[Translation] Immediately synced category/image/published to ${targetLang.toUpperCase()} pair (id: ${pairedArticle.id})`);
            }
          }

          if (pairedArticle && (data.title || data.content || data.excerpt)) {
            // Re-translate text fields in background (takes time due to LLM)
            (async () => {
              try {
                const currentArticle = await getArticleById(id);
                if (!currentArticle) return;
                const direction = currentArticle.language === "sv" ? "sv-en" : "en-sv";
                const translated = await translateArticleFields(
                  currentArticle.title,
                  currentArticle.excerpt,
                  currentArticle.content,
                  direction
                );
                if (translated.title && translated.content) {
                  const targetCategory = currentArticle.language === "sv"
                    ? (categoryToEnglish[currentArticle.category] || currentArticle.category)
                    : (categoryToSwedish[currentArticle.category] || currentArticle.category);
                  await updateArticle(pairedArticle.id, {
                    title: translated.title,
                    excerpt: translated.excerpt,
                    content: translated.content,
                    category: targetCategory,
                    imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
                    published: data.published !== undefined ? data.published : undefined,
                  });
                  console.log(`[Translation] Updated ${targetLang.toUpperCase()} translation (id: ${pairedArticle.id}) for ${currentArticle.language.toUpperCase()} article (id: ${id})`);
                }
              } catch (error) {
                console.error("[Translation] Failed to update translation:", error);
              }
            })();
          }
        }

        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Also delete the paired translation if it exists
        const article = await getArticleById(input.id);
        if (article?.pairId) {
          const pair = await getArticleByPairIdAndLanguage(article.pairId, article.language === "sv" ? "en" : "sv");
          if (pair) {
            await deleteArticle(pair.id);
            console.log(`[Translation] Deleted paired article (id: ${pair.id}) when deleting article (id: ${input.id})`);
          }
        }
        await deleteArticle(input.id);
        return { success: true };
      }),

    // Admin: list all articles including unpublished
    listAll: adminProcedure
      .input(z.object({
        language: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listArticles({ language: input?.language });
      }),
  }),

  drafts: router({
    save: adminProcedure
      .input(z.object({
        articleId: z.number().nullable().optional(),
        title: z.string().default(""),
        excerpt: z.string().default(""),
        content: z.string().nullable().optional(),
        category: z.string().default("Behandling"),
        language: z.string().default("sv"),
        imageUrl: z.string().nullable().optional(),
        publishedAt: z.string().nullable().optional(),
        published: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        return saveDraft({
          articleId: input.articleId ?? null,
          userId: ctx.user.id,
          title: input.title,
          excerpt: input.excerpt,
          content: input.content ?? null,
          category: input.category,
          language: input.language,
          imageUrl: input.imageUrl ?? null,
          publishedAt: input.publishedAt ?? null,
          published: input.published,
        });
      }),

    get: adminProcedure
      .input(z.object({
        articleId: z.number().nullable().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return getDraft(ctx.user.id, input.articleId);
      }),

    delete: adminProcedure
      .input(z.object({
        articleId: z.number().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await deleteDraft(ctx.user.id, input.articleId);
        return { success: true };
      }),

    list: adminProcedure
      .query(async ({ ctx }) => {
        return listDrafts(ctx.user.id);
      }),
  }),

  upload: router({
    image: adminProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const randomSuffix = Math.random().toString(36).substring(2, 10);
        const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const fileKey = `article-images/${randomSuffix}-${sanitizedName}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);
        return { url };
      }),
  }),

  diary: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        return listDiaryEntries({
          published: true,
          limit: input?.limit ?? 10,
          offset: input?.offset ?? 0,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDiaryEntryById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        content: z.string().min(1),
        entryDate: z.date().optional(),
        published: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        // Auto-translate to English
        const contentEn = await translateToEnglish(input.content);
        return createDiaryEntry({
          content: input.content,
          contentEn: contentEn || null,
          entryDate: input.entryDate ?? new Date(),
          published: input.published,
        });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        content: z.string().min(1).optional(),
        entryDate: z.date().optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Re-translate if content changed
        if (data.content) {
          const contentEn = await translateToEnglish(data.content);
          (data as any).contentEn = contentEn || null;
        }
        await updateDiaryEntry(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteDiaryEntry(input.id);
        return { success: true };
      }),

    // Admin: list all diary entries including unpublished
    listAll: adminProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }).optional())
      .query(async ({ input }) => {
        return listDiaryEntries({
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
      }),
  }),

  pages: router({
    get: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getSitePage(input.slug) ?? null;
      }),

    update: adminProcedure
      .input(z.object({
        slug: z.string(),
        contentSv: z.string().nullable().optional(),
        contentEn: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { slug, ...data } = input;
        await upsertSitePage(slug, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

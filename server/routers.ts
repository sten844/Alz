import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { listArticles, getArticleById, createArticle, updateArticle, deleteArticle, getArticleByPairIdAndLanguage, listDiaryEntries, getDiaryEntryById, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry, saveDraft, getDraft, deleteDraft, listDrafts } from "./db";
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

async function translateArticleFields(title: string, excerpt: string, content: string): Promise<{ title: string; excerpt: string; content: string }> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following Swedish article to English. Keep the same tone, style, and markdown formatting. The article is a personal blog post about living with Alzheimer's disease.

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

        // Auto-translate Swedish articles to English (in background)
        if (input.language === "sv" && !input.pairId) {
          // Fire and forget — don't block the response
          (async () => {
            try {
              const translated = await translateArticleFields(input.title, input.excerpt, input.content);
              if (translated.title && translated.content) {
                const enCategory = categoryToEnglish[input.category] || input.category;
                const enResult = await createArticle({
                  title: translated.title,
                  excerpt: translated.excerpt,
                  content: translated.content,
                  category: enCategory,
                  language: "en",
                  pairId: svResult.id,
                  imageUrl: input.imageUrl ?? null,
                  publishedAt,
                  published: input.published,
                });
                // Update the Swedish article to link back
                await updateArticle(svResult.id, { pairId: svResult.id });
                console.log(`[Translation] Created English translation (id: ${enResult.id}) for Swedish article (id: ${svResult.id})`);
              }
            } catch (error) {
              console.error("[Translation] Failed to create English translation:", error);
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

        // Auto-update English translation if this is a Swedish article
        const article = await getArticleById(id);
        if (article && article.language === "sv" && article.pairId) {
          // Find the English pair
          const enArticle = await getArticleByPairIdAndLanguage(article.pairId, "en");
          if (enArticle && (data.title || data.content || data.excerpt || data.category)) {
            // Re-translate in background
            (async () => {
              try {
                const currentSv = await getArticleById(id);
                if (!currentSv) return;
                const translated = await translateArticleFields(
                  currentSv.title,
                  currentSv.excerpt,
                  currentSv.content
                );
                if (translated.title && translated.content) {
                  const enCategory = categoryToEnglish[currentSv.category] || currentSv.category;
                  await updateArticle(enArticle.id, {
                    title: translated.title,
                    excerpt: translated.excerpt,
                    content: translated.content,
                    category: enCategory,
                    imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
                    published: data.published !== undefined ? data.published : undefined,
                  });
                  console.log(`[Translation] Updated English translation (id: ${enArticle.id}) for Swedish article (id: ${id})`);
                }
              } catch (error) {
                console.error("[Translation] Failed to update English translation:", error);
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
});

export type AppRouter = typeof appRouter;

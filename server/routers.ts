import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { listArticles, getArticleById, createArticle, updateArticle, deleteArticle, listDiaryEntries, getDiaryEntryById, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from "./db";
import { z } from "zod";

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
        return createArticle({
          ...input,
          publishedAt: input.publishedAt ?? new Date(),
          imageUrl: input.imageUrl ?? null,
          pairId: input.pairId ?? null,
        });
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
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
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
        return createDiaryEntry({
          content: input.content,
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

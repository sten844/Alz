import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { createHash, timingSafeEqual } from "node:crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const OWNER_ACCESS_KEY_HASH = "09fa8b2bce0d54f2c1be3a5ced4808d353ea77525fde17b914d14b750cdddd10";

export function isValidOwnerAccessKey(ownerKey: string | undefined, expectedHash = OWNER_ACCESS_KEY_HASH) {
  if (!ownerKey) return false;

  const suppliedHash = createHash("sha256").update(ownerKey).digest();
  const expectedHashBuffer = Buffer.from(expectedHash, "hex");
  return suppliedHash.length === expectedHashBuffer.length && timingSafeEqual(suppliedHash, expectedHashBuffer);
}

function hasValidOwnerAccessKey(ctx: TrpcContext) {
  const headerValue = ctx.req.headers["x-dellby-owner-key"];
  const ownerKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return isValidOwnerAccessKey(ownerKey);
}

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    const hasManusAdminAccess = ctx.user?.role === "admin";
    if (!hasManusAdminAccess && !hasValidOwnerAccessKey(ctx)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

import { describe, it, expect } from "vitest";
import { listCommentsByArticle, createComment, deleteComment } from "./db";

describe("comments", () => {
  let createdCommentId: number;

  it("creates a comment for an article", async () => {
    const result = await createComment({
      articleId: 999999, // Use a non-existent article ID for testing
      name: "Test User",
      content: "This is a test comment",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    createdCommentId = result.id;
  });

  it("lists comments for an article", async () => {
    const comments = await listCommentsByArticle(999999);
    expect(Array.isArray(comments)).toBe(true);
    const found = comments.find((c) => c.id === createdCommentId);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Test User");
    expect(found!.content).toBe("This is a test comment");
  });

  it("returns empty array for article with no comments", async () => {
    const comments = await listCommentsByArticle(888888);
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.length).toBe(0);
  });

  it("deletes a comment", async () => {
    await deleteComment(createdCommentId);
    const comments = await listCommentsByArticle(999999);
    const found = comments.find((c) => c.id === createdCommentId);
    expect(found).toBeUndefined();
  });
});

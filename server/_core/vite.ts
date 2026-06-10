import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getArticleById } from "../db";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stripMarkdown(text: string): string {
  return text.replace(/[#*_~`\[\]()]/g, "").replace(/\n+/g, " ").trim();
}

async function injectArticleMeta(html: string, url: string): Promise<string> {
  const articleMatch = url.match(/^\/article\/(\d+)/);
  if (!articleMatch) return html;
  const articleId = Number(articleMatch[1]);
  const article = await getArticleById(articleId);
  if (!article) return html;

  const title = escapeHtml(article.title);
  const description = escapeHtml(
    article.excerpt
      ? stripMarkdown(article.excerpt).slice(0, 160)
      : stripMarkdown(article.content).slice(0, 160)
  );
  const imageUrl = article.imageUrl || "";
  const siteUrl = "https://dellby.info";
  const fullUrl = `${siteUrl}/article/${article.id}`;

  const metaTags = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${fullUrl}" />`,
    imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : "",
    `<meta property="og:site_name" content="Jag och min Alzheimer" />`,
    `<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : "",
    `<meta name="description" content="${description}" />`,
  ].filter(Boolean).join("\n    ");

  // Replace the default title and inject meta tags before </head>
  html = html.replace("<title>Jag och min Alzheimer</title>", `<title>${title} – Jag och min Alzheimer</title>`);
  html = html.replace("</head>", `    ${metaTags}\n  </head>`);
  return html;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);
      page = await injectArticleMeta(page, url);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist, inject article meta tags
  app.use("*", async (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    let html = await fs.promises.readFile(indexPath, "utf-8");
    html = await injectArticleMeta(html, req.originalUrl);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });
}

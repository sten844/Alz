import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { listArticles } from "../db";

const SITE_URL = "https://dellby.info";

type SitemapUrl = {
  loc: string;
  lastmod?: Date | string | null;
  changefreq?: "daily" | "weekly" | "monthly";
  priority?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatSitemapDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function buildSitemapXml(urls: SitemapUrl[]): string {
  const entries = urls.map((url) => {
    const absoluteUrl = new URL(url.loc, SITE_URL).toString();
    const lastmod = formatSitemapDate(url.lastmod);

    return [
      "  <url>",
      `    <loc>${escapeXml(absoluteUrl)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : undefined,
      url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : undefined,
      url.priority ? `    <priority>${url.priority}</priority>` : undefined,
      "  </url>",
    ].filter(Boolean).join("\n");
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const articles = await listArticles({ published: true });
      const urls: SitemapUrl[] = [
        { loc: "/", changefreq: "daily", priority: "1.0" },
        { loc: "/about", changefreq: "monthly", priority: "0.7" },
        { loc: "/diary", changefreq: "daily", priority: "0.8" },
        { loc: "/lankar", changefreq: "monthly", priority: "0.6" },
        ...articles.map((article) => ({
          loc: `/article/${article.id}`,
          lastmod: article.updatedAt ?? article.publishedAt,
          changefreq: "weekly" as const,
          priority: "0.9",
        })),
      ];

      res.setHeader("Cache-Control", "public, max-age=3600");
      res.type("application/xml").send(buildSitemapXml(urls));
    } catch (error) {
      console.error("[Sitemap] Failed to generate sitemap:", error);
      res.status(500).type("text/plain").send("Failed to generate sitemap");
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

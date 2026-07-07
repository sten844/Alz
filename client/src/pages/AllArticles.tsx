/**
 * All Articles - Simple grid view
 * 4 columns on desktop, 2 on mobile
 * Shows 20 articles per page with pagination
 */
import { useState, useMemo } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getArticleImage, categoryColors } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

const ARTICLES_PER_PAGE = 20;

export default function AllArticles() {
  const { language, t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: dbArticles, isLoading } = trpc.articles.list.useQuery({
    language,
    published: true,
  });

  const sortedArticles = useMemo(() => {
    if (!dbArticles) return [];
    return [...dbArticles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [dbArticles]);

  const totalPages = Math.ceil(sortedArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = sortedArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container py-6">
        <h1
          className="text-3xl font-bold text-foreground mb-6"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          {t("Alla artiklar", "All articles")}
        </h1>

        {/* Grid: 2 columns mobile, 4 columns desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {paginatedArticles.map((article) => {
            const imageUrl = getArticleImage(article as any);
            const colorClass = categoryColors[article.category] || "bg-slate-100 text-slate-700";
            const date = new Date(article.publishedAt);
            const formattedDate = date.toLocaleDateString(
              language === "sv" ? "sv-SE" : "en-US",
              { day: "numeric", month: "short", year: "numeric" }
            );

            return (
              <Link key={article.id} href={`/article/${article.id}`}>
                <article className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-border/50 h-full flex flex-col">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <span className={`self-start px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${colorClass}`}>
                      {article.category}
                    </span>
                    <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-[#c05746] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-auto pt-2">
                      {formattedDate}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-card border border-border/50 text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
            >
              {t("← Nyare", "← Newer")}
            </button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-card border border-border/50 text-sm font-medium disabled:opacity-40 hover:bg-accent transition-colors"
            >
              {t("Äldre →", "Older →")}
            </button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

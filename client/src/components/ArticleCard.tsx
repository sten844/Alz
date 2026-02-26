/**
 * Nordic Warmth Design: ArticleCard
 * - Warm cream card background
 * - Soft shadows, gentle hover lift
 * - Category badge with color coding
 * - DM Serif Display for titles
 */
import { type Article, getArticleImage, categoryColors } from "@/data/articles";
import { Link } from "wouter";

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const imageUrl = getArticleImage(article);
  const date = new Date(article.publishedAt);
  const formattedDate = date.toLocaleDateString(
    article.language === "sv" ? "sv-SE" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const colorClass = categoryColors[article.category] || "bg-slate-100 text-slate-700";

  return (
    <Link href={`/article/${article.id}`}>
      <article className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-border/50">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-2/5 aspect-[16/10] sm:aspect-auto overflow-hidden">
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
                  {article.category}
                </span>
                <span className="text-sm text-muted-foreground">{formattedDate}</span>
              </div>

              <h3 className="text-xl md:text-2xl text-foreground leading-snug mb-2 group-hover:text-[#c05746] transition-colors">
                {article.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed line-clamp-2">
                {article.excerpt}
              </p>
            </div>

            <div className="mt-4">
              <span className="text-[#c05746] font-semibold text-sm group-hover:underline">
                {article.language === "sv" ? "Läs artikel →" : "Read article →"}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

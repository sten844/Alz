import { ChevronRight, FileText } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

type SecondaryArticle = {
  id: number;
  titleSv: string;
  titleEn?: string | null;
  excerptSv: string;
  excerptEn?: string | null;
  imageUrl?: string | null;
};

type SecondaryArticleGridProps = {
  articles: SecondaryArticle[];
  limit?: number;
};

export default function SecondaryArticleGrid({ articles, limit }: SecondaryArticleGridProps) {
  const { language, t } = useLanguage();
  const shownArticles = limit ? articles.slice(0, limit) : articles;

  if (shownArticles.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
      {shownArticles.map((article) => {
        const title = language === "en" && article.titleEn ? article.titleEn : article.titleSv;
        const excerpt = language === "en" && article.excerptEn ? article.excerptEn : article.excerptSv;

        return (
          <Link key={article.id} href={`/fordjupning/${article.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c05746]/50 hover:shadow-md">
            {article.imageUrl ? (
              <img src={article.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#f6e1db] to-[#ead0c8] text-[#c05746]">
                <FileText className="h-8 w-8" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#a84537]">{t("Fördjupning", "In depth")}</p>
              <h3 className="mt-2 text-lg leading-tight text-foreground sm:text-xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{title}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{excerpt}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#a84537] group-hover:underline">
                {t("Läs mer", "Read more")} <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

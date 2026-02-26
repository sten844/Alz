/**
 * Nordic Warmth Design: ArticlePage
 * - Clean reading layout with max-width for readability
 * - DM Serif Display for headings
 * - Warm, comfortable reading experience
 */
import { useParams, Link } from "wouter";
import { useMemo } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { articles, getArticleImage, categoryColors, getTranslationId } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Globe, Calendar } from "lucide-react";

function renderMarkdown(content: string): string {
  let html = content;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-6 mb-3" style="font-family: \'Source Sans 3\', system-ui, sans-serif">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl mt-8 mb-4" style="font-family: \'DM Serif Display\', Georgia, serif">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl md:text-4xl mt-4 mb-6" style="font-family: \'DM Serif Display\', Georgia, serif">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li class="ml-6 mb-1.5 list-disc text-lg leading-relaxed">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-6 mb-1.5 list-decimal text-lg leading-relaxed">$1</li>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-border" />');

  // Emoji lines (like 👉)
  html = html.replace(/^(👉.+)$/gm, '<p class="text-lg leading-relaxed mb-4 bg-accent/50 p-4 rounded-lg border-l-4 border-[#c05746]/30">$1</p>');

  // Paragraphs - wrap remaining lines
  const lines = html.split('\n');
  let result = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      continue;
    }
    if (trimmed.startsWith('<li')) {
      if (!inList) {
        result += '<ul class="mb-4">';
        inList = true;
      }
      result += trimmed;
    } else if (trimmed.startsWith('<h') || trimmed.startsWith('<hr') || trimmed.startsWith('<p class="text-lg leading-relaxed mb-4 bg-accent')) {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      result += trimmed;
    } else {
      if (inList) {
        result += '</ul>';
        inList = false;
      }
      result += `<p class="text-lg leading-relaxed mb-4">${trimmed}</p>`;
    }
  }
  if (inList) result += '</ul>';

  return result;
}

export default function ArticlePage() {
  const params = useParams<{ id: string }>();
  const { language, t } = useLanguage();

  const article = useMemo(() => {
    const id = Number(params.id);
    return articles.find((a) => a.id === id);
  }, [params.id]);

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 text-center">
          <h2 className="text-3xl text-foreground mb-4">{t("Artikeln hittades inte", "Article not found")}</h2>
          <Link href="/" className="text-[#c05746] font-semibold hover:underline">
            {t("Tillbaka till startsidan", "Back to home")}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const translationId = getTranslationId(article.id);
  const imageUrl = getArticleImage(article);
  const colorClass = categoryColors[article.category] || "bg-slate-100 text-slate-700";
  const date = new Date(article.publishedAt);
  const formattedDate = date.toLocaleDateString(
    article.language === "sv" ? "sv-SE" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const contentHtml = renderMarkdown(article.content);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Article hero */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />
        </div>

        <article className="container max-w-3xl mx-auto -mt-16 relative z-10">
          {/* Meta bar */}
          <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-border/30">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("Tillbaka", "Back")}
              </Link>
              <span className="text-border">|</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
              {translationId && (
                <>
                  <span className="text-border">|</span>
                  <Link
                    href={`/article/${translationId}`}
                    className="inline-flex items-center gap-1 text-sm text-[#c05746] hover:underline font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {article.language === "sv" ? "Read in English" : "Läs på svenska"}
                  </Link>
                </>
              )}
            </div>

            {/* Article content */}
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          {/* Back to articles */}
          <div className="text-center pb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card rounded-full text-sm font-semibold text-foreground hover:bg-accent border border-border/50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Tillbaka till alla artiklar", "Back to all articles")}
            </Link>
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}

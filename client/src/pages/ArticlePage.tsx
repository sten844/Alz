/**
 * Nordic Warmth Design: ArticlePage
 * - Fetches article from database via tRPC
 * - Clean reading layout with max-width for readability
 */
import { useParams, Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getArticleImage, categoryColors } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";

function renderMarkdown(content: string): string {
  let html = content;

  // Headers — support both standard markdown (## text) and ##text## format
  html = html.replace(/^###(.+?)###\s*$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2 text-foreground" style="font-family: \'Source Sans 3\', system-ui, sans-serif">$1</h3>');
  html = html.replace(/^##(.+?)##\s*$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-foreground pb-2 border-b-2 border-[#c05746]/20" style="font-family: \'Source Sans 3\', system-ui, sans-serif">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-5 mb-2 text-foreground" style="font-family: \'Source Sans 3\', system-ui, sans-serif">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-10 mb-4 text-foreground pb-2 border-b-2 border-[#c05746]/20" style="font-family: \'Source Sans 3\', system-ui, sans-serif">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl md:text-4xl mt-4 mb-6" style="font-family: \'DM Serif Display\', Georgia, serif">$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links: [text](url) → clickable anchor
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#c05746] underline hover:text-[#a04636] transition-colors">$1</a>');

  // Critical notes ("Kritisk synpunkt:" or "Critical note:")
  html = html.replace(/^((?:Kritisk synpunkt|Critical note|Critical view|Critical observation):.+)$/gm, '<p class="text-base leading-relaxed mb-4 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 p-3 rounded-lg border-l-4 border-amber-400 italic">⚠️ $1</p>');

  // Unordered lists (standard markdown and tab+bullet format)
  html = html.replace(/^- (.+)$/gm, '<li class="ml-6 mb-1.5 list-disc text-lg leading-relaxed">$1</li>');
  html = html.replace(/^\t[•·]\t(.+)$/gm, '<li class="ml-6 mb-1.5 list-disc text-lg leading-relaxed">$1</li>');
  html = html.replace(/^\s*[•·]\s+(.+)$/gm, '<li class="ml-6 mb-1.5 list-disc text-lg leading-relaxed">$1</li>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-6 mb-1.5 list-decimal text-lg leading-relaxed">$1</li>');

  // Horizontal rules (--- and unicode ⸻) — styled as decorative section dividers
  html = html.replace(/^---$/gm, '<div class="my-10 flex items-center gap-4"><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c05746]/30 to-transparent"></div><div class="w-2 h-2 rounded-full bg-[#c05746]/30"></div><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c05746]/30 to-transparent"></div></div>');
  html = html.replace(/^⸻\s*$/gm, '<div class="my-10 flex items-center gap-4"><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c05746]/30 to-transparent"></div><div class="w-2 h-2 rounded-full bg-[#c05746]/30"></div><div class="flex-1 h-px bg-gradient-to-r from-transparent via-[#c05746]/30 to-transparent"></div></div>');

  // Emoji lines (like 👉)
  html = html.replace(/^(👉.+)$/gm, '<p class="text-lg leading-relaxed mb-4 bg-accent/50 p-4 rounded-lg border-l-4 border-[#c05746]/30">$1</p>');

  // Paragraphs
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
    } else if (trimmed.startsWith('<h') || trimmed.startsWith('<div class="my-10') || trimmed.startsWith('<p class="text-lg leading-relaxed mb-4 bg-accent') || trimmed.startsWith('<p class="text-base leading-relaxed mb-4 bg-amber')) {
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
  const { t } = useLanguage();
  const articleId = Number(params.id);

  const { data: article, isLoading } = trpc.articles.getById.useQuery(
    { id: articleId },
    { enabled: !isNaN(articleId) }
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

  const imageUrl = getArticleImage({
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    language: article.language,
    imageUrl: article.imageUrl,
    publishedAt: new Date(article.publishedAt).toISOString(),
  });
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
            </div>

            {/* Article title */}
            <h1
              className="text-3xl md:text-4xl font-bold text-foreground mb-4"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {article.title}
            </h1>

            {/* Ingress / excerpt */}
            {article.excerpt && (
              <p className="text-lg md:text-xl leading-relaxed text-muted-foreground mb-8 border-l-4 border-[#c05746]/40 pl-4 italic">
                {article.excerpt}
              </p>
            )}

            {/* Article content */}
            <div
              className="prose-custom"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>

          {/* Bottom image (optional) */}
          {(article as any).bottomImageUrl && (
            <div className="mt-10 mb-6 rounded-xl overflow-hidden border border-border/30 shadow-sm">
              <img
                src={(article as any).bottomImageUrl}
                alt=""
                className="w-full object-contain"
              />
            </div>
          )}

          {/* References / Sources */}
          {(() => {
            let refs: { title: string; url: string }[] = [];
            try {
              if ((article as any).references) {
                refs = JSON.parse((article as any).references);
              }
            } catch {}
            if (refs.length === 0) return null;
            return (
              <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-border/30">
                <h2
                  className="text-xl font-bold text-foreground mb-4 flex items-center gap-2"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  {t("Källor", "Sources")}
                </h2>
                <ul className="space-y-2">
                  {refs.map((ref, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-base">
                      <span className="text-[#c05746] font-semibold mt-0.5">{idx + 1}.</span>
                      {ref.url ? (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#c05746] underline hover:text-[#a04636] transition-colors"
                        >
                          {ref.title || ref.url}
                        </a>
                      ) : (
                        <span className="text-foreground">{ref.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })()}

          {/* Attachment */}
          {(article as any).attachmentUrl && (
            <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-border/30">
              <h2
                className="text-xl font-bold text-foreground mb-3 flex items-center gap-2"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                {t("Bilaga", "Attachment")}
              </h2>
              <a
                href={(article as any).attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#c05746]/10 text-[#c05746] font-medium hover:bg-[#c05746]/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                {(article as any).attachmentName || t("Ladda ner bilaga", "Download attachment")}
              </a>
            </div>
          )}

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

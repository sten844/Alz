/**
 * Diary Archive Page
 * Shows all diary entries with pagination, full-length text.
 * Uses the same Nordic Warmth design as the rest of the site.
 */
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { BookOpen, ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";

const ENTRIES_PER_PAGE = 10;

export default function DiaryArchivePage() {
  const { language, t } = useLanguage();
  const [page, setPage] = useState(0);

  const { data, isLoading } = trpc.diary.list.useQuery({
    limit: ENTRIES_PER_PAGE,
    offset: page * ENTRIES_PER_PAGE,
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ENTRIES_PER_PAGE);
  const hasMore = (page + 1) * ENTRIES_PER_PAGE < total;
  const hasPrev = page > 0;

  const formatDateLong = (date: Date | string) => {
    const d = new Date(date);
    const locale = language === "en" ? "en-US" : "sv-SE";
    return d.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <section className="container py-6 sm:py-10">
          {/* Back link */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-base text-[#c05746] hover:text-[#a8483b] font-medium mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t("Tillbaka till startsidan", "Back to homepage")}
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#c05746]/20">
            <BookOpen className="w-8 h-8 text-[#c05746]" />
            <h1
              className="text-3xl sm:text-4xl text-foreground font-bold"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              {t("Min dagbok – Arkiv", "My diary – Archive")}
            </h1>
          </div>

          <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
            {t(
              "Här finns alla mina dagboksinlägg samlade. De senaste inläggen visas först.",
              "Here you can find all my diary entries collected. The most recent entries are shown first."
            )}
          </p>

          {/* Entries */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-xl">{t("Inga dagboksinlägg ännu.", "No diary entries yet.")}</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl">
              {entries.map((entry) => {
                const displayContent =
                  language === "en" && entry.contentEn ? entry.contentEn : entry.content;
                return (
                  <article
                    key={entry.id}
                    className="bg-card/50 rounded-2xl border border-border/30 p-6 sm:p-8 shadow-sm"
                  >
                    <div className="text-base font-bold text-[#c05746] uppercase tracking-wide mb-3">
                      {formatDateLong(entry.entryDate)}
                    </div>
                    <p className="text-lg text-foreground/85 leading-relaxed whitespace-pre-wrap">
                      {displayContent}
                    </p>
                  </article>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!hasPrev}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-base font-medium bg-card border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("Nyare", "Newer")}
              </button>
              <span className="text-base text-muted-foreground">
                {t("Sida", "Page")} {page + 1} {t("av", "of")} {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-base font-medium bg-card border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t("Äldre", "Older")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

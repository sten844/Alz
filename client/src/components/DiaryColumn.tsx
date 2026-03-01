/**
 * DiaryColumn: A casual daily diary/kåseri column.
 * On desktop/iPad: sticky sidebar column alongside articles.
 * On mobile: a scrollable section below the hero area.
 * Each entry shows the date and content, with pagination for older entries.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, ChevronDown, Loader2 } from "lucide-react";

const ENTRIES_PER_PAGE = 5;

export default function DiaryColumn() {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  const { data, isLoading } = trpc.diary.list.useQuery({
    limit: ENTRIES_PER_PAGE,
    offset: page * ENTRIES_PER_PAGE,
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const hasMore = (page + 1) * ENTRIES_PER_PAGE < total;
  const hasPrev = page > 0;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#c05746]" />
      </div>
    );
  }

  if (entries.length === 0 && page === 0) {
    return null; // Don't show anything if no diary entries
  }

  return (
    <div className="diary-column">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#c05746]/20">
        <BookOpen className="w-5 h-5 text-[#c05746]" />
        <h2
          className="text-xl text-foreground"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          {t("Min dagbok", "My diary")}
        </h2>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="diary-entry">
            {/* Date stamp */}
            <div className="text-xs font-semibold text-[#c05746] uppercase tracking-wide mb-1.5">
              {formatDate(entry.entryDate)}
            </div>
            {/* Content */}
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
            {/* Subtle separator */}
            <div className="mt-3 border-b border-border/30" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className="flex items-center justify-between mt-5 pt-3">
          {hasPrev ? (
            <button
              onClick={() => setPage((p) => p - 1)}
              className="text-xs font-medium text-[#c05746] hover:text-[#a8483b] transition-colors"
            >
              {t("← Nyare", "← Newer")}
            </button>
          ) : (
            <span />
          )}
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="text-xs font-medium text-[#c05746] hover:text-[#a8483b] transition-colors"
            >
              {t("Äldre →", "Older →")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

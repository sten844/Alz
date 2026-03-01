/**
 * DiaryColumn: A casual daily diary/kåseri column.
 * On desktop/iPad: sticky sidebar column alongside articles.
 * On mobile (compact mode): date + first line inline, 3-line truncation, very space-efficient.
 * Each entry shows the date and content, with pagination for older entries.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Loader2 } from "lucide-react";

const ENTRIES_PER_PAGE = 5;

function DiaryEntry({
  entry,
  compact,
}: {
  entry: { id: number; content: string; entryDate: Date | string };
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("sv-SE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatDateLong = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  if (compact) {
    // Compact mode: date and content inline, max 3 lines
    return (
      <div className="diary-entry">
        {compact && !expanded ? (
          <div className="line-clamp-3 text-base text-foreground/85 leading-snug">
            <span className="font-semibold text-[#c05746] text-sm uppercase tracking-wide">
              {formatDate(entry.entryDate)}
            </span>
            <span className="text-[#c05746] mx-1">·</span>
            <span className="whitespace-pre-wrap">{entry.content}</span>
          </div>
        ) : (
          <div className="text-base text-foreground/85 leading-snug">
            <span className="font-semibold text-[#c05746] text-sm uppercase tracking-wide">
              {formatDate(entry.entryDate)}
            </span>
            <span className="text-[#c05746] mx-1">·</span>
            <span className="whitespace-pre-wrap">{entry.content}</span>
          </div>
        )}
        {!expanded && entry.content.length > 100 && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs font-medium text-[#c05746] hover:text-[#a8483b] mt-0.5 transition-colors"
          >
            {t("mer →", "more →")}
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="text-xs font-medium text-[#c05746] hover:text-[#a8483b] mt-0.5 transition-colors"
          >
            {t("← mindre", "← less")}
          </button>
        )}
        <div className="mt-2 border-b border-border/20" />
      </div>
    );
  }

  // Full mode (desktop sidebar)
  return (
    <div className="diary-entry">
      <div className="text-xs font-semibold text-[#c05746] uppercase tracking-wide mb-1.5">
        {formatDateLong(entry.entryDate)}
      </div>
      <p className="text-base text-foreground/85 leading-relaxed whitespace-pre-wrap">
        {entry.content}
      </p>
      <div className="mt-3 border-b border-border/30" />
    </div>
  );
}

export default function DiaryColumn({ compact = false, maxEntries, hideHeader = false }: { compact?: boolean; maxEntries?: number; hideHeader?: boolean }) {
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  const limit = maxEntries ?? ENTRIES_PER_PAGE;

  const { data, isLoading } = trpc.diary.list.useQuery({
    limit,
    offset: page * limit,
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const hasMore = (page + 1) * limit < total;
  const hasPrev = page > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#c05746]" />
      </div>
    );
  }

  if (entries.length === 0 && page === 0) {
    return null;
  }

  return (
    <div className="diary-column">
      {/* Header */}
      {!hideHeader && (
        <div className={`flex items-center gap-2 ${compact ? "mb-2 pb-2" : "mb-4 pb-3"} border-b border-[#c05746]/20`}>
          <BookOpen className={compact ? "w-4 h-4 text-[#c05746]" : "w-5 h-5 text-[#c05746]"} />
          <h2
            className={`${compact ? "text-base" : "text-xl"} text-foreground`}
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            {t("Min dagbok", "My diary")}
          </h2>
        </div>
      )}

      {/* Entries */}
      <div className={compact ? "space-y-1.5" : "space-y-3"}>
        {entries.map((entry) => (
          <DiaryEntry key={entry.id} entry={entry} compact={compact} />
        ))}
      </div>

      {/* Pagination */}
      {(hasPrev || hasMore) && (
        <div className={`flex items-center justify-between ${compact ? "mt-3 pt-2" : "mt-5 pt-3"}`}>
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

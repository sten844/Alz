import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { TextSelection } from "@tiptap/pm/state";
import { useEffect, useCallback, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RichTextEditorProps {
  content: string; // HTML content
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/* ------------------------------------------------------------------ */
/*  Search-and-format helper: find text in the editor and select it    */
/* ------------------------------------------------------------------ */

function findAndSelectText(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  searchText: string,
): boolean {
  if (!searchText.trim()) return false;

  const doc = editor.state.doc;
  const needle = searchText.toLowerCase();
  let found = false;

  doc.descendants((node, pos) => {
    if (found) return false; // stop after first match
    if (!node.isText) return;

    const text = node.text || "";
    const idx = text.toLowerCase().indexOf(needle);
    if (idx !== -1) {
      const from = pos + idx;
      const to = from + searchText.length;
      // Dispatch raw transaction WITHOUT scrollIntoView to prevent page jumping
      const sel = TextSelection.create(editor.state.doc, from, to);
      const tr = editor.state.tr.setSelection(sel);
      editor.view.dispatch(tr);
      found = true;
      return false;
    }
  });

  return found;
}

/**
 * Find ALL occurrences and apply formatting to each one
 */
function findAndFormatAll(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  searchText: string,
  format: "bold" | "italic" | "underline",
): number {
  if (!searchText.trim()) return 0;

  const doc = editor.state.doc;
  const needle = searchText.toLowerCase();
  const matches: { from: number; to: number }[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = node.text || "";
    let startIdx = 0;
    while (startIdx < text.length) {
      const idx = text.toLowerCase().indexOf(needle, startIdx);
      if (idx === -1) break;
      matches.push({ from: pos + idx, to: pos + idx + searchText.length });
      startIdx = idx + 1;
    }
  });

  if (matches.length === 0) return 0;

  // Apply formatting to all matches (reverse order to preserve positions)
  // Use raw transactions to prevent page scrolling/jumping
  let { tr } = editor.view.state;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { from, to } = matches[i];
    const sel = TextSelection.create(tr.doc, from, to);
    tr = tr.setSelection(sel);
    const markType =
      format === "bold" ? editor.schema.marks.bold
      : format === "italic" ? editor.schema.marks.italic
      : editor.schema.marks.underline;
    if (markType) {
      // Check if mark is already active at this range
      const isActive = editor.state.doc.rangeHasMark(from, to, markType);
      if (isActive) {
        tr = tr.removeMark(from, to, markType);
      } else {
        tr = tr.addMark(from, to, markType.create());
      }
    }
  }
  // Dispatch without scrollIntoView
  editor.view.dispatch(tr);

  return matches.length;
}

/* ------------------------------------------------------------------ */
/*  Search & Format Panel                                              */
/* ------------------------------------------------------------------ */

function SearchFormatPanel({
  editor,
  onClose,
}: {
  editor: NonNullable<ReturnType<typeof useEditor>>;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isFound, setIsFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus the search input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSearch = () => {
    if (!searchText.trim()) return;
    const found = findAndSelectText(editor, searchText);
    if (found) {
      setIsFound(true);
      setStatus(t(`"${searchText}" markerad`, `"${searchText}" selected`));
    } else {
      setIsFound(false);
      setStatus(t(`"${searchText}" hittades inte`, `"${searchText}" not found`));
    }
  };

  const handleFormat = (format: "bold" | "italic" | "underline") => {
    if (!searchText.trim()) return;
    const count = findAndFormatAll(editor, searchText, format);
    if (count > 0) {
      const formatName =
        format === "bold"
          ? t("fetstil", "bold")
          : format === "italic"
          ? t("kursiv", "italic")
          : t("understruken", "underlined");
      setStatus(
        count === 1
          ? t(`Formaterade "${searchText}" som ${formatName}`, `Formatted "${searchText}" as ${formatName}`)
          : t(
              `Formaterade ${count} träffar av "${searchText}" som ${formatName}`,
              `Formatted ${count} occurrences of "${searchText}" as ${formatName}`
            )
      );
      setSearchText("");
      setIsFound(false);
    } else {
      setStatus(t(`"${searchText}" hittades inte`, `"${searchText}" not found`));
      setIsFound(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  const actionBtn =
    "rounded-lg px-3 py-2.5 min-w-[48px] h-[48px] flex items-center justify-center text-base font-bold transition-all touch-manipulation select-none active:scale-95";

  return (
    <div className="bg-blue-50 border-b-2 border-blue-200 px-3 py-3">
      {/* Search input row */}
      <div className="flex items-center gap-2 mb-2">
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setIsFound(false);
            setStatus("");
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-3 text-lg bg-white rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none"
          placeholder={t("Skriv ord/fras att formatera...", "Type word/phrase to format...")}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={!searchText.trim()}
          className={`${actionBtn} bg-blue-600 text-white disabled:opacity-30 whitespace-nowrap`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      {/* Format buttons row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-blue-700 mr-1">
          {t("Formatera alla träffar:", "Format all matches:")}
        </span>
        <button
          type="button"
          onClick={() => handleFormat("bold")}
          disabled={!searchText.trim()}
          className={`${actionBtn} bg-white border-2 border-blue-300 text-slate-800 disabled:opacity-30`}
          title={t("Gör alla träffar feta", "Bold all matches")}
        >
          <span className="font-black text-xl">B</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("italic")}
          disabled={!searchText.trim()}
          className={`${actionBtn} bg-white border-2 border-blue-300 text-slate-800 disabled:opacity-30`}
          title={t("Gör alla träffar kursiva", "Italicize all matches")}
        >
          <span className="italic text-xl" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("underline")}
          disabled={!searchText.trim()}
          className={`${actionBtn} bg-white border-2 border-blue-300 text-slate-800 disabled:opacity-30`}
          title={t("Stryk under alla träffar", "Underline all matches")}
        >
          <span className="underline text-xl">U</span>
        </button>

        <div className="flex-1" />

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 touch-manipulation active:scale-95"
        >
          {t("Stäng", "Close")}
        </button>
      </div>

      {/* Status message */}
      {status && (
        <div
          className={`text-sm font-medium px-2 py-1 rounded ${
            isFound ? "text-green-700 bg-green-50" : status.includes(t("hittades inte", "not found")) ? "text-red-600 bg-red-50" : "text-blue-700 bg-blue-100"
          }`}
        >
          {status}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toolbar                                                            */
/* ------------------------------------------------------------------ */

function Toolbar({
  editor,
  selectMode,
  onToggleSelectMode,
  showSearchFormat,
  onToggleSearchFormat,
}: {
  editor: ReturnType<typeof useEditor>;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  showSearchFormat: boolean;
  onToggleSearchFormat: () => void;
}) {
  const { t } = useLanguage();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const btnBase =
    "rounded-lg p-2 min-w-[44px] h-[44px] flex items-center justify-center text-base font-medium transition-all touch-manipulation select-none";
  const btnActive = "bg-[#c05746] text-white shadow-sm";
  const btnInactive =
    "bg-white border border-border/40 text-slate-700 hover:bg-slate-50 active:bg-slate-100 active:scale-95";
  const btnSearchActive =
    "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300";
  const btnSelectMode =
    "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 animate-pulse";

  const separator = <div className="w-px h-6 bg-border/40 mx-0.5" />;

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      let url = linkUrl.trim();
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      editor.chain().focus(undefined, { scrollIntoView: false }).extendMarkRange("link").setLink({ href: url }).run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  const handleLinkKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddLink();
    }
    if (e.key === "Escape") {
      setShowLinkInput(false);
      setLinkUrl("");
    }
  };

  const openLinkInput = () => {
    const existingHref = editor.getAttributes("link").href;
    setLinkUrl(existingHref || "");
    setShowLinkInput(true);
    setTimeout(() => linkInputRef.current?.focus(), 50);
  };

  return (
    <div className="bg-accent/30 border-b-2 border-border/40 rounded-t-lg">
      {/* Main toolbar */}
      <div className="flex items-center gap-1 p-2 flex-wrap">
        {/* Search & Format button — primary iPad tool */}
        <button
          type="button"
          onClick={onToggleSearchFormat}
          className={`${btnBase} ${showSearchFormat ? btnSearchActive : btnInactive}`}
          title={t("Sök och formatera", "Search and format")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <text x="8" y="14" fontSize="9" fill="currentColor" stroke="none" fontWeight="bold">B</text>
          </svg>
        </button>

        {/* Tap-to-select word button */}
        <button
          type="button"
          onClick={onToggleSelectMode}
          className={`${btnBase} ${selectMode ? btnSelectMode : btnInactive}`}
          title={t("Tryck-markera ord", "Tap to select word")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 4h10M7 8h6" />
            <rect x="3" y="3" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" fill={selectMode ? "rgba(255,255,255,0.3)" : "none"} />
            <path d="M12 14v-1a1 1 0 0 1 2 0v3.5" />
            <path d="M14 16v-1a1 1 0 0 1 2 0v1" />
            <path d="M16 16v-.5a1 1 0 0 1 2 0v2.5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-3a1 1 0 0 1 2 0v1" />
          </svg>
        </button>

        {separator}

        {/* Text formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBold().run()}
          className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnInactive}`}
          title={t("Fet", "Bold")}
        >
          <span className="font-black text-lg">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleItalic().run()}
          className={`${btnBase} ${editor.isActive("italic") ? btnActive : btnInactive}`}
          title={t("Kursiv", "Italic")}
        >
          <span className="italic text-lg" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
            I
          </span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleUnderline().run()}
          className={`${btnBase} ${editor.isActive("underline") ? btnActive : btnInactive}`}
          title={t("Understrykning", "Underline")}
        >
          <span className="underline text-lg">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleStrike().run()}
          className={`${btnBase} ${editor.isActive("strike") ? btnActive : btnInactive}`}
          title={t("Genomstruken", "Strikethrough")}
        >
          <span className="line-through text-lg">S</span>
        </button>

        {separator}

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 2 }).run()}
          className={`${btnBase} ${editor.isActive("heading", { level: 2 }) ? btnActive : btnInactive}`}
          title={t("Rubrik", "Heading")}
        >
          <span className="font-black text-base">H2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 3 }).run()}
          className={`${btnBase} ${editor.isActive("heading", { level: 3 }) ? btnActive : btnInactive}`}
          title={t("Underrubrik", "Subheading")}
        >
          <span className="font-bold text-sm">H3</span>
        </button>

        {separator}

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBulletList().run()}
          className={`${btnBase} ${editor.isActive("bulletList") ? btnActive : btnInactive}`}
          title={t("Punktlista", "Bullet list")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleOrderedList().run()}
          className={`${btnBase} ${editor.isActive("orderedList") ? btnActive : btnInactive}`}
          title={t("Numrerad lista", "Numbered list")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="20" y2="6" />
            <line x1="10" y1="12" x2="20" y2="12" />
            <line x1="10" y1="18" x2="20" y2="18" />
            <text x="2" y="8" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">
              1
            </text>
            <text x="2" y="14" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">
              2
            </text>
            <text x="2" y="20" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">
              3
            </text>
          </svg>
        </button>

        {separator}

        {/* Block elements */}
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBlockquote().run()}
          className={`${btnBase} ${editor.isActive("blockquote") ? btnActive : btnInactive}`}
          title={t("Citat", "Quote")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).setHorizontalRule().run()}
          className={`${btnBase} ${btnInactive}`}
          title={t("Horisontell linje", "Horizontal rule")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </button>

        {separator}

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus(undefined, { scrollIntoView: false }).unsetLink().run();
            } else {
              openLinkInput();
            }
          }}
          className={`${btnBase} ${editor.isActive("link") ? btnActive : btnInactive}`}
          title={t("Länk", "Link")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        {separator}

        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).undo().run()}
          disabled={!editor.can().undo()}
          className={`${btnBase} ${btnInactive} disabled:opacity-30`}
          title={t("Ångra", "Undo")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).redo().run()}
          disabled={!editor.can().redo()}
          className={`${btnBase} ${btnInactive} disabled:opacity-30`}
          title={t("Gör om", "Redo")}
        >
          <svg className="w-5 h-5 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>
      </div>

      {/* Select mode hint bar */}
      {selectMode && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              {t(
                "Tryck på ett ord för att markera det. Tryck på fler ord för att utöka markeringen.",
                "Tap a word to select it. Tap more words to extend the selection."
              )}
            </span>
          </div>
        </div>
      )}

      {/* Link input bar */}
      {showLinkInput && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-white rounded-lg border-2 border-[#c05746]/30 p-1.5">
            <span className="text-sm font-bold text-[#c05746] pl-2 whitespace-nowrap">
              {t("Länk:", "Link:")}
            </span>
            <input
              ref={linkInputRef}
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={handleLinkKeyDown}
              className="flex-1 px-3 py-2 text-base bg-transparent focus:outline-none"
              placeholder="https://..."
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
              className="px-4 py-2 text-sm font-bold rounded-lg bg-[#c05746] text-white touch-manipulation active:scale-95 disabled:opacity-30 whitespace-nowrap"
            >
              {t("Lägg till", "Add")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl("");
              }}
              className="px-2 py-2 text-base rounded-lg text-muted-foreground touch-manipulation active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bubble Menu (appears near selected text)                           */
/* ------------------------------------------------------------------ */

function SelectionBubbleMenu({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const { t } = useLanguage();

  const bubbleBtnBase =
    "rounded-md p-1.5 min-w-[36px] h-[36px] flex items-center justify-center text-sm font-medium transition-all touch-manipulation select-none";
  const bubbleBtnActive = "bg-white/30 text-white";
  const bubbleBtnInactive = "text-white/80 hover:bg-white/20 active:bg-white/30";

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
      }}
    >
      <div className="flex items-center gap-0.5 bg-slate-800 rounded-xl shadow-xl px-1.5 py-1 border border-slate-600">
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleBold().run()}
          className={`${bubbleBtnBase} ${editor.isActive("bold") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Fet", "Bold")}
        >
          <span className="font-black">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleItalic().run()}
          className={`${bubbleBtnBase} ${editor.isActive("italic") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Kursiv", "Italic")}
        >
          <span className="italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleUnderline().run()}
          className={`${bubbleBtnBase} ${editor.isActive("underline") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Understrykning", "Underline")}
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleStrike().run()}
          className={`${bubbleBtnBase} ${editor.isActive("strike") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Genomstruken", "Strikethrough")}
        >
          <span className="line-through">S</span>
        </button>
        <div className="w-px h-5 bg-white/20 mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 2 }).run()}
          className={`${bubbleBtnBase} ${editor.isActive("heading", { level: 2 }) ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Rubrik", "Heading")}
        >
          <span className="font-bold text-xs">H2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus(undefined, { scrollIntoView: false }).toggleHeading({ level: 3 }).run()}
          className={`${bubbleBtnBase} ${editor.isActive("heading", { level: 3 }) ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Underrubrik", "Subheading")}
        >
          <span className="font-bold text-xs">H3</span>
        </button>
      </div>
    </BubbleMenu>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Editor Component                                              */
/* ------------------------------------------------------------------ */

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = "300px",
}: RichTextEditorProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [showSearchFormat, setShowSearchFormat] = useState(false);
  const selectModeRef = useRef(false);
  const hasExtendedRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    selectModeRef.current = selectMode;
  }, [selectMode]);

  const handleUpdate = useCallback(
    ({ editor }: { editor: any }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#c05746] underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: placeholder || "Skriv här...",
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: content || "<p></p>",
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none px-5 py-4",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Update content when it changes externally (e.g., loading an article for editing)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const editorText = editor.getText();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const contentText = tempDiv.textContent || "";

      if (Math.abs(editorText.length - contentText.length) > 5 || !editorText) {
        editor.commands.setContent(content || "<p></p>");
      }
    }
  }, [content, editor]);

  // Handle tap-to-select in select mode
  useEffect(() => {
    if (!editor) return;

    const editorDom = editor.view.dom;

    const handleTouchEnd = (e: TouchEvent) => {
      if (!selectModeRef.current) return;

      // Only handle single-finger taps
      if (e.changedTouches.length !== 1) return;

      const touch = e.changedTouches[0];

      // Determine if we should extend or start fresh
      const hasSelection = !editor.state.selection.empty;
      const extend = hasSelection && hasExtendedRef.current;

      // Use the helper function from the old code
      const view = editor.view;
      const coords = { left: touch.clientX, top: touch.clientY };
      const pos = view.posAtCoords(coords);
      if (!pos) return;

      const $pos = view.state.doc.resolve(pos.pos);
      const parent = $pos.parent;
      if (!parent.isTextblock) return;

      const textOffset = $pos.parentOffset;
      const text = parent.textContent;

      let wordStart = textOffset;
      let wordEnd = textOffset;

      while (wordStart > 0 && /\S/.test(text[wordStart - 1])) {
        wordStart--;
      }
      while (wordEnd < text.length && /\S/.test(text[wordEnd])) {
        wordEnd++;
      }

      if (wordStart === wordEnd) return;

      const startOfParent = $pos.start();
      const from = startOfParent + wordStart;
      const to = startOfParent + wordEnd;

      if (extend) {
        const { from: oldFrom, to: oldTo } = view.state.selection;
        const newFrom = Math.min(oldFrom, from);
        const newTo = Math.max(oldTo, to);
        editor.chain().setTextSelection({ from: newFrom, to: newTo }).run();
      } else {
        editor.chain().setTextSelection({ from, to }).run();
      }

      hasExtendedRef.current = true;
      e.preventDefault();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!selectModeRef.current) return;

      const view = editor.view;
      const coords = { left: e.clientX, top: e.clientY };
      const pos = view.posAtCoords(coords);
      if (!pos) return;

      const $pos = view.state.doc.resolve(pos.pos);
      const parent = $pos.parent;
      if (!parent.isTextblock) return;

      const textOffset = $pos.parentOffset;
      const text = parent.textContent;

      let wordStart = textOffset;
      let wordEnd = textOffset;

      while (wordStart > 0 && /\S/.test(text[wordStart - 1])) {
        wordStart--;
      }
      while (wordEnd < text.length && /\S/.test(text[wordEnd])) {
        wordEnd++;
      }

      if (wordStart === wordEnd) return;

      const startOfParent = $pos.start();
      const from = startOfParent + wordStart;
      const to = startOfParent + wordEnd;

      const hasSelection = !editor.state.selection.empty;
      const extend = hasSelection && hasExtendedRef.current;

      if (extend) {
        const { from: oldFrom, to: oldTo } = view.state.selection;
        const newFrom = Math.min(oldFrom, from);
        const newTo = Math.max(oldTo, to);
        editor.chain().setTextSelection({ from: newFrom, to: newTo }).run();
      } else {
        editor.chain().setTextSelection({ from, to }).run();
      }

      hasExtendedRef.current = true;
      e.preventDefault();
    };

    editorDom.addEventListener("touchend", handleTouchEnd, { passive: false });
    editorDom.addEventListener("mousedown", handleMouseDown);

    return () => {
      editorDom.removeEventListener("touchend", handleTouchEnd);
      editorDom.removeEventListener("mousedown", handleMouseDown);
    };
  }, [editor]);

  const handleToggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      const next = !prev;
      if (next) {
        hasExtendedRef.current = false;
        setShowSearchFormat(false); // close search panel when entering select mode
      } else {
        hasExtendedRef.current = false;
      }
      return next;
    });
  }, []);

  const handleToggleSearchFormat = useCallback(() => {
    setShowSearchFormat((prev) => {
      const next = !prev;
      if (next) {
        setSelectMode(false); // close select mode when opening search
        selectModeRef.current = false;
      }
      return next;
    });
  }, []);

  if (!editor) return null;

  return (
    <div
      className={`border-2 rounded-lg overflow-hidden bg-background transition-colors ${
        selectMode
          ? "border-blue-400 ring-2 ring-blue-200"
          : showSearchFormat
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-border/50"
      }`}
    >
      <Toolbar
        editor={editor}
        selectMode={selectMode}
        onToggleSelectMode={handleToggleSelectMode}
        showSearchFormat={showSearchFormat}
        onToggleSearchFormat={handleToggleSearchFormat}
      />
      {showSearchFormat && (
        <SearchFormatPanel
          editor={editor}
          onClose={() => setShowSearchFormat(false)}
        />
      )}
      <SelectionBubbleMenu editor={editor} />
      <EditorContent
        editor={editor}
        className={`rich-text-editor ${selectMode ? "select-mode-active" : ""}`}
      />
    </div>
  );
}

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RichTextEditorProps {
  content: string; // HTML content
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

/* ------------------------------------------------------------------ */
/*  Touch-friendly word selection helper                               */
/* ------------------------------------------------------------------ */

/**
 * Given a mouse/touch event inside the ProseMirror editor,
 * resolve the position under the pointer and expand the selection
 * to cover the whole word at that position.
 *
 * If `extend` is true the existing selection is extended to include
 * the new word (shift-tap behaviour).
 */
function selectWordAtEvent(
  editor: NonNullable<ReturnType<typeof useEditor>>,
  event: MouseEvent | Touch,
  extend = false,
) {
  const view = editor.view;
  const coords = { left: event.clientX, top: event.clientY };
  const pos = view.posAtCoords(coords);
  if (!pos) return;

  const $pos = view.state.doc.resolve(pos.pos);
  const parent = $pos.parent;
  if (!parent.isTextblock) return;

  // Walk backwards/forwards to find word boundaries
  const textOffset = $pos.parentOffset;
  const text = parent.textContent;

  // Find word boundaries using a regex-friendly approach
  let wordStart = textOffset;
  let wordEnd = textOffset;

  // Walk backwards to find start of word
  while (wordStart > 0 && /\S/.test(text[wordStart - 1])) {
    wordStart--;
  }
  // Walk forwards to find end of word
  while (wordEnd < text.length && /\S/.test(text[wordEnd])) {
    wordEnd++;
  }

  if (wordStart === wordEnd) return; // clicked on whitespace

  // Convert parent-relative offsets to absolute document positions
  const startOfParent = $pos.start(); // absolute pos of first char in parent
  const from = startOfParent + wordStart;
  const to = startOfParent + wordEnd;

  if (extend) {
    // Extend existing selection to include the new word
    const { from: oldFrom, to: oldTo } = view.state.selection;
    const newFrom = Math.min(oldFrom, from);
    const newTo = Math.max(oldTo, to);
    editor.chain().setTextSelection({ from: newFrom, to: newTo }).run();
  } else {
    editor.chain().setTextSelection({ from, to }).run();
  }
}

/* ------------------------------------------------------------------ */
/*  Detect touch device                                                */
/* ------------------------------------------------------------------ */
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/* ------------------------------------------------------------------ */
/*  Toolbar                                                            */
/* ------------------------------------------------------------------ */

function Toolbar({
  editor,
  selectMode,
  onToggleSelectMode,
}: {
  editor: ReturnType<typeof useEditor>;
  selectMode: boolean;
  onToggleSelectMode: () => void;
}) {
  const { t } = useLanguage();
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const btnBase =
    "rounded-lg p-2 min-w-[40px] h-[40px] flex items-center justify-center text-base font-medium transition-all touch-manipulation select-none";
  const btnActive = "bg-[#c05746] text-white shadow-sm";
  const btnInactive =
    "bg-white border border-border/40 text-slate-700 hover:bg-slate-50 active:bg-slate-100 active:scale-95";
  const btnSelectMode =
    "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 animate-pulse";

  const separator = <div className="w-px h-6 bg-border/40 mx-0.5" />;

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      let url = linkUrl.trim();
      if (!/^https?:\/\//i.test(url)) url = "https://" + url;
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
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
        {/* Tap-to-select word button (shown on touch devices, always available) */}
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
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnInactive}`}
          title={t("Fet", "Bold")}
        >
          <span className="font-black text-lg">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} ${editor.isActive("italic") ? btnActive : btnInactive}`}
          title={t("Kursiv", "Italic")}
        >
          <span className="italic text-lg" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
            I
          </span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${btnBase} ${editor.isActive("underline") ? btnActive : btnInactive}`}
          title={t("Understrykning", "Underline")}
        >
          <span className="underline text-lg">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${btnBase} ${editor.isActive("strike") ? btnActive : btnInactive}`}
          title={t("Genomstruken", "Strikethrough")}
        >
          <span className="line-through text-lg">S</span>
        </button>

        {separator}

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btnBase} ${editor.isActive("heading", { level: 2 }) ? btnActive : btnInactive}`}
          title={t("Rubrik", "Heading")}
        >
          <span className="font-black text-base">H2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btnBase} ${editor.isActive("heading", { level: 3 }) ? btnActive : btnInactive}`}
          title={t("Underrubrik", "Subheading")}
        >
          <span className="font-bold text-sm">H3</span>
        </button>

        {separator}

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
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
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
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
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${btnBase} ${editor.isActive("blockquote") ? btnActive : btnInactive}`}
          title={t("Citat", "Quote")}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
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
              editor.chain().focus().unsetLink().run();
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
          onClick={() => editor.chain().focus().undo().run()}
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
          onClick={() => editor.chain().focus().redo().run()}
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
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${bubbleBtnBase} ${editor.isActive("bold") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Fet", "Bold")}
        >
          <span className="font-black">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${bubbleBtnBase} ${editor.isActive("italic") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Kursiv", "Italic")}
        >
          <span className="italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${bubbleBtnBase} ${editor.isActive("underline") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Understrykning", "Underline")}
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${bubbleBtnBase} ${editor.isActive("strike") ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Genomstruken", "Strikethrough")}
        >
          <span className="line-through">S</span>
        </button>
        <div className="w-px h-5 bg-white/20 mx-0.5" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${bubbleBtnBase} ${editor.isActive("heading", { level: 2 }) ? bubbleBtnActive : bubbleBtnInactive}`}
          title={t("Rubrik", "Heading")}
        >
          <span className="font-bold text-xs">H2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
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
      // First tap = fresh select, subsequent taps = extend
      const hasSelection = !editor.state.selection.empty;
      const extend = hasSelection && hasExtendedRef.current;

      selectWordAtEvent(editor, touch, extend);
      hasExtendedRef.current = true;

      // Prevent default to avoid iOS/iPad selection handles interfering
      e.preventDefault();
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!selectModeRef.current) return;

      // On desktop, also support click-to-select-word in select mode
      const hasSelection = !editor.state.selection.empty;
      const extend = hasSelection && hasExtendedRef.current;

      selectWordAtEvent(editor, e, extend);
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
        // Entering select mode: reset extension tracking
        hasExtendedRef.current = false;
      } else {
        // Leaving select mode: keep the selection so user can format it
        hasExtendedRef.current = false;
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
          : "border-border/50"
      }`}
    >
      <Toolbar
        editor={editor}
        selectMode={selectMode}
        onToggleSelectMode={handleToggleSelectMode}
      />
      <SelectionBubbleMenu editor={editor} />
      <EditorContent
        editor={editor}
        className={`rich-text-editor ${selectMode ? "select-mode-active" : ""}`}
      />
    </div>
  );
}

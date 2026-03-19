import { useEditor, EditorContent } from "@tiptap/react";
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

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
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

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  minHeight = "300px",
}: RichTextEditorProps) {
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

  if (!editor) return null;

  return (
    <div className="border-2 border-border/50 rounded-lg overflow-hidden bg-background">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} className="rich-text-editor" />
    </div>
  );
}

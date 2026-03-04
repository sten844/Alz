import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState, useRef } from "react";

interface RichTextEditorProps {
  content: string; // HTML content
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

type InsertMode = null | "bold" | "italic" | "heading";

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [insertMode, setInsertMode] = useState<InsertMode>(null);
  const [insertText, setInsertText] = useState("");
  const insertInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleInsert = () => {
    if (!insertText.trim() || !insertMode) return;

    editor.chain().focus();

    if (insertMode === "bold") {
      editor.chain().focus().insertContent(`<strong>${insertText}</strong> `).run();
    } else if (insertMode === "italic") {
      editor.chain().focus().insertContent(`<em>${insertText}</em> `).run();
    } else if (insertMode === "heading") {
      editor.chain().focus().insertContent(`<h2>${insertText}</h2>`).run();
    }

    setInsertText("");
    setInsertMode(null);
  };

  const handleInsertKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInsert();
    }
    if (e.key === "Escape") {
      setInsertMode(null);
      setInsertText("");
    }
  };

  const openInsertMode = (mode: InsertMode) => {
    if (insertMode === mode) {
      setInsertMode(null);
      setInsertText("");
    } else {
      setInsertMode(mode);
      setInsertText("");
      setTimeout(() => insertInputRef.current?.focus(), 50);
    }
  };

  const btnBase = "rounded-lg text-xl font-semibold transition-all touch-manipulation select-none min-w-[48px] min-h-[48px] flex items-center justify-center";
  const btnActive = "bg-[#c05746] text-white shadow-md";
  const btnInactive = "bg-card border-2 border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10 active:scale-95";
  const btnDisabled = "opacity-30 cursor-not-allowed";

  return (
    <div className="sticky top-0 z-10 bg-accent/95 backdrop-blur-sm border-b-2 border-border/50 rounded-t-lg">
      {/* Main formatting buttons */}
      <div className="flex items-center gap-2 p-3 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} px-5 py-3 ${editor.isActive("bold") ? btnActive : btnInactive}`}
          title="Fet (Bold)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} px-5 py-3 ${editor.isActive("italic") ? btnActive : btnInactive}`}
          title="Kursiv (Italic)"
        >
          <span className="italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span>
        </button>

        <div className="w-px h-10 bg-border/50 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${btnBase} px-4 py-3 ${editor.isActive("heading", { level: 2 }) ? btnActive : btnInactive}`}
          title="Rubrik"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${btnBase} px-4 py-3 ${editor.isActive("heading", { level: 3 }) ? btnActive : btnInactive}`}
          title="Underrubrik"
        >
          H3
        </button>

        <div className="w-px h-10 bg-border/50 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btnBase} px-4 py-3 ${editor.isActive("bulletList") ? btnActive : btnInactive}`}
          title="Punktlista"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} px-4 py-3 ${editor.isActive("orderedList") ? btnActive : btnInactive}`}
          title="Numrerad lista"
        >
          1.
        </button>

        <div className="w-px h-10 bg-border/50 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`${btnBase} px-4 py-3 ${btnInactive}`}
          title="Horisontell linje"
        >
          ―
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${btnBase} px-4 py-3 ${btnInactive} ${!editor.can().undo() ? btnDisabled : ""}`}
          title="Ångra"
        >
          ↩
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${btnBase} px-4 py-3 ${btnInactive} ${!editor.can().redo() ? btnDisabled : ""}`}
          title="Gör om"
        >
          ↪
        </button>
      </div>

      {/* Insert text buttons row - for iPad users who can't select text */}
      <div className="flex items-center gap-2 px-3 pb-3 flex-wrap border-t border-border/30 pt-2">
        <span className="text-sm text-muted-foreground mr-1">Infoga:</span>
        <button
          type="button"
          onClick={() => openInsertMode("bold")}
          className={`${btnBase} px-4 py-2 text-base ${insertMode === "bold" ? btnActive : btnInactive}`}
        >
          + <strong>Fet</strong>
        </button>
        <button
          type="button"
          onClick={() => openInsertMode("italic")}
          className={`${btnBase} px-4 py-2 text-base ${insertMode === "italic" ? btnActive : btnInactive}`}
        >
          + <em>Kursiv</em>
        </button>
        <button
          type="button"
          onClick={() => openInsertMode("heading")}
          className={`${btnBase} px-4 py-2 text-base ${insertMode === "heading" ? btnActive : btnInactive}`}
        >
          + Rubrik
        </button>
      </div>

      {/* Insert text input popup */}
      {insertMode && (
        <div className="px-3 pb-3 bg-[#c05746]/5 border-t-2 border-[#c05746]/30">
          <div className="flex items-center gap-2 pt-2">
            <label className="text-base font-semibold text-[#c05746] whitespace-nowrap">
              {insertMode === "bold" ? "Fet text:" : insertMode === "italic" ? "Kursiv text:" : "Rubriktext:"}
            </label>
            <input
              ref={insertInputRef}
              type="text"
              value={insertText}
              onChange={(e) => setInsertText(e.target.value)}
              onKeyDown={handleInsertKeyDown}
              className="flex-1 px-4 py-3 text-lg rounded-lg border-2 border-[#c05746]/30 bg-background focus:outline-none focus:ring-2 focus:ring-[#c05746]/50"
              placeholder="Skriv text här..."
              autoFocus
            />
            <button
              type="button"
              onClick={handleInsert}
              disabled={!insertText.trim()}
              className="px-5 py-3 text-lg font-semibold rounded-lg bg-[#c05746] text-white touch-manipulation active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              Infoga
            </button>
            <button
              type="button"
              onClick={() => { setInsertMode(null); setInsertText(""); }}
              className="px-4 py-3 text-lg rounded-lg bg-card border-2 border-border/50 text-foreground touch-manipulation active:scale-95"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RichTextEditor({ content, onChange, placeholder, minHeight = "300px" }: RichTextEditorProps) {
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
        heading: { levels: [1, 2, 3] },
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
    <div className="border-2 border-border/50 rounded-lg overflow-hidden bg-background relative">
      <MenuBar editor={editor} />
      <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
        <EditorContent
          editor={editor}
          className="rich-text-editor"
        />
      </div>
    </div>
  );
}

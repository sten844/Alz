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

function InsertBar({ editor, position }: { editor: ReturnType<typeof useEditor>; position: "top" | "bottom" }) {
  const [insertMode, setInsertMode] = useState<InsertMode>(null);
  const [insertText, setInsertText] = useState("");
  const insertInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleInsert = () => {
    if (!insertText.trim() || !insertMode) return;

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

  const btnBase = "rounded-xl text-lg font-semibold transition-all touch-manipulation select-none py-3 px-5 flex items-center justify-center gap-1.5";
  const btnActive = "bg-[#c05746] text-white shadow-md";
  const btnInactive = "bg-white border-2 border-[#c05746]/30 text-[#c05746] active:bg-[#c05746]/10 active:scale-95";

  const borderClass = position === "top" ? "border-b-2 border-border/40 rounded-t-lg" : "border-t-2 border-border/40 rounded-b-lg";

  return (
    <div className={`bg-accent/30 ${borderClass}`}>
      {/* Insert buttons */}
      <div className="flex items-center gap-3 p-3 flex-wrap">
        <button
          type="button"
          onClick={() => openInsertMode("bold")}
          className={`${btnBase} ${insertMode === "bold" ? btnActive : btnInactive}`}
        >
          <span className="font-black">B</span> Fet
        </button>
        <button
          type="button"
          onClick={() => openInsertMode("italic")}
          className={`${btnBase} ${insertMode === "italic" ? btnActive : btnInactive}`}
        >
          <span className="italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span> Kursiv
        </button>
        <button
          type="button"
          onClick={() => openInsertMode("heading")}
          className={`${btnBase} ${insertMode === "heading" ? btnActive : btnInactive}`}
        >
          <span className="font-black">H</span> Rubrik
        </button>

        {/* Undo/Redo - small buttons on the right */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded-lg p-2 text-lg touch-manipulation bg-white border border-border/40 text-muted-foreground disabled:opacity-20"
            title="Ångra"
          >
            ↩
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded-lg p-2 text-lg touch-manipulation bg-white border border-border/40 text-muted-foreground disabled:opacity-20"
            title="Gör om"
          >
            ↪
          </button>
        </div>
      </div>

      {/* Insert text input - expands when a mode is selected */}
      {insertMode && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-[#c05746]/30 p-1.5">
            <span className="text-base font-bold text-[#c05746] pl-2 whitespace-nowrap">
              {insertMode === "bold" ? "Fet:" : insertMode === "italic" ? "Kursiv:" : "Rubrik:"}
            </span>
            <input
              ref={insertInputRef}
              type="text"
              value={insertText}
              onChange={(e) => setInsertText(e.target.value)}
              onKeyDown={handleInsertKeyDown}
              className="flex-1 px-3 py-2.5 text-lg bg-transparent focus:outline-none"
              placeholder="Skriv text här..."
              autoFocus
            />
            <button
              type="button"
              onClick={handleInsert}
              disabled={!insertText.trim()}
              className="px-5 py-2.5 text-lg font-bold rounded-lg bg-[#c05746] text-white touch-manipulation active:scale-95 disabled:opacity-30 whitespace-nowrap"
            >
              Infoga
            </button>
            <button
              type="button"
              onClick={() => { setInsertMode(null); setInsertText(""); }}
              className="px-3 py-2.5 text-lg rounded-lg text-muted-foreground touch-manipulation active:scale-95"
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
    <div className="border-2 border-border/50 rounded-lg overflow-hidden bg-background">
      {/* Top insert bar */}
      <InsertBar editor={editor} position="top" />
      
      {/* Editor content area */}
      <EditorContent
        editor={editor}
        className="rich-text-editor"
      />
      
      {/* Bottom insert bar - same buttons repeated for long texts */}
      <InsertBar editor={editor} position="bottom" />
    </div>
  );
}

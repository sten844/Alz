import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useCallback } from "react";

interface RichTextEditorProps {
  content: string; // HTML content
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1.5 p-2 border-b border-border/50 bg-accent/30 rounded-t-lg flex-wrap">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-4 py-2.5 rounded-md text-lg font-bold transition-all touch-manipulation ${
          editor.isActive("bold")
            ? "bg-[#c05746] text-white shadow-sm"
            : "bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        }`}
        title="Fet (Bold)"
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-4 py-2.5 rounded-md text-lg transition-all touch-manipulation ${
          editor.isActive("italic")
            ? "bg-[#c05746] text-white shadow-sm"
            : "bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        }`}
        title="Kursiv (Italic)"
      >
        <span className="italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span>
      </button>
      <div className="w-px h-8 bg-border/50 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-4 py-2.5 rounded-md text-lg font-semibold transition-all touch-manipulation ${
          editor.isActive("heading", { level: 2 })
            ? "bg-[#c05746] text-white shadow-sm"
            : "bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        }`}
        title="Rubrik (Heading)"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-4 py-2.5 rounded-md text-lg font-semibold transition-all touch-manipulation ${
          editor.isActive("heading", { level: 3 })
            ? "bg-[#c05746] text-white shadow-sm"
            : "bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        }`}
        title="Underrubrik (Subheading)"
      >
        H3
      </button>
      <div className="w-px h-8 bg-border/50 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-4 py-2.5 rounded-md text-lg transition-all touch-manipulation ${
          editor.isActive("bulletList")
            ? "bg-[#c05746] text-white shadow-sm"
            : "bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        }`}
        title="Punktlista (Bullet list)"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-4 py-2.5 rounded-md text-lg transition-all touch-manipulation ${
          editor.isActive("orderedList")
            ? "bg-[#c05746] text-white shadow-sm"
            : "bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        }`}
        title="Numrerad lista (Numbered list)"
      >
        1.
      </button>
      <div className="w-px h-8 bg-border/50 mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="px-4 py-2.5 rounded-md text-lg transition-all touch-manipulation bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10"
        title="Horisontell linje (Horizontal rule)"
      >
        ―
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-4 py-2.5 rounded-md text-lg transition-all touch-manipulation bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Ångra (Undo)"
      >
        ↩
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-4 py-2.5 rounded-md text-lg transition-all touch-manipulation bg-card border border-border/50 text-foreground hover:bg-accent active:bg-[#c05746]/10 disabled:opacity-30 disabled:cursor-not-allowed"
        title="Gör om (Redo)"
      >
        ↪
      </button>
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
      // Only update if content is substantially different (not just whitespace/formatting)
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
    <div className="border border-border/50 rounded-lg overflow-hidden bg-background">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="rich-text-editor"
      />
      {!editor.getText() && placeholder && (
        <div className="absolute top-0 left-0 px-5 py-4 text-muted-foreground/50 pointer-events-none text-lg">
          {placeholder}
        </div>
      )}
    </div>
  );
}

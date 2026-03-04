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
type SearchMode = null | "bold" | "italic";

function InsertBar({ editor, position }: { editor: ReturnType<typeof useEditor>; position: "top" | "bottom" }) {
  const [insertMode, setInsertMode] = useState<InsertMode>(null);
  const [insertText, setInsertText] = useState("");
  const insertInputRef = useRef<HTMLInputElement>(null);

  // Search-and-format state
  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState<"" | "found" | "not-found">("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  // --- INSERT (new text) ---
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
    if (e.key === "Enter") { e.preventDefault(); handleInsert(); }
    if (e.key === "Escape") { setInsertMode(null); setInsertText(""); }
  };

  const openInsertMode = (mode: InsertMode) => {
    setSearchMode(null); setSearchText(""); setSearchResult("");
    if (insertMode === mode) { setInsertMode(null); setInsertText(""); }
    else { setInsertMode(mode); setInsertText(""); setTimeout(() => insertInputRef.current?.focus(), 50); }
  };

  // --- SEARCH AND FORMAT (existing text) ---
  const handleSearchAndFormat = () => {
    if (!searchText.trim() || !searchMode) return;

    // Get the full text content to search
    const fullText = editor.getText();
    const searchLower = searchText.toLowerCase();
    const fullTextLower = fullText.toLowerCase();

    if (!fullTextLower.includes(searchLower)) {
      setSearchResult("not-found");
      return;
    }

    // Use the editor's built-in search: we need to find and select the text, then apply formatting
    // Strategy: walk through the document to find the text node containing our search string
    const doc = editor.state.doc;
    let found = false;

    doc.descendants((node, pos) => {
      if (found) return false;
      if (!node.isText) return;

      const nodeText = node.text || "";
      const nodeTextLower = nodeText.toLowerCase();
      const idx = nodeTextLower.indexOf(searchLower);

      if (idx !== -1) {
        const from = pos + idx;
        const to = from + searchText.length;

        // Select the text and apply formatting
        editor.chain()
          .focus()
          .setTextSelection({ from, to })
          .run();

        if (searchMode === "bold") {
          editor.chain().toggleBold().run();
        } else if (searchMode === "italic") {
          editor.chain().toggleItalic().run();
        }

        found = true;
        setSearchResult("found");
        setSearchText("");
        return false;
      }
    });

    if (!found) {
      setSearchResult("not-found");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); handleSearchAndFormat(); }
    if (e.key === "Escape") { setSearchMode(null); setSearchText(""); setSearchResult(""); }
  };

  const openSearchMode = (mode: SearchMode) => {
    setInsertMode(null); setInsertText("");
    if (searchMode === mode) { setSearchMode(null); setSearchText(""); setSearchResult(""); }
    else { setSearchMode(mode); setSearchText(""); setSearchResult(""); setTimeout(() => searchInputRef.current?.focus(), 50); }
  };

  const btnBase = "rounded-xl text-lg font-semibold transition-all touch-manipulation select-none py-3 px-5 flex items-center justify-center gap-1.5";
  const btnActive = "bg-[#c05746] text-white shadow-md";
  const btnInactive = "bg-white border-2 border-[#c05746]/30 text-[#c05746] active:bg-[#c05746]/10 active:scale-95";

  const searchBtnBase = "rounded-xl text-base font-semibold transition-all touch-manipulation select-none py-2.5 px-4 flex items-center justify-center gap-1.5";
  const searchBtnActive = "bg-[#2d6a4f] text-white shadow-md";
  const searchBtnInactive = "bg-white border-2 border-[#2d6a4f]/30 text-[#2d6a4f] active:bg-[#2d6a4f]/10 active:scale-95";

  const borderClass = position === "top" ? "border-b-2 border-border/40 rounded-t-lg" : "border-t-2 border-border/40 rounded-b-lg";

  return (
    <div className={`bg-accent/30 ${borderClass}`}>
      {/* Row 1: Insert new formatted text */}
      <div className="flex items-center gap-3 p-3 flex-wrap">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Ny text:</span>
        <button type="button" onClick={() => openInsertMode("bold")}
          className={`${btnBase} ${insertMode === "bold" ? btnActive : btnInactive}`}>
          <span className="font-black">B</span> Fet
        </button>
        <button type="button" onClick={() => openInsertMode("italic")}
          className={`${btnBase} ${insertMode === "italic" ? btnActive : btnInactive}`}>
          <span className="italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span> Kursiv
        </button>
        <button type="button" onClick={() => openInsertMode("heading")}
          className={`${btnBase} ${insertMode === "heading" ? btnActive : btnInactive}`}>
          <span className="font-black">H</span> Rubrik
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rounded-lg p-2 text-lg touch-manipulation bg-white border border-border/40 text-muted-foreground disabled:opacity-20"
            title="Ångra">↩</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rounded-lg p-2 text-lg touch-manipulation bg-white border border-border/40 text-muted-foreground disabled:opacity-20"
            title="Gör om">↪</button>
        </div>
      </div>

      {/* Insert text input */}
      {insertMode && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-[#c05746]/30 p-1.5">
            <span className="text-base font-bold text-[#c05746] pl-2 whitespace-nowrap">
              {insertMode === "bold" ? "Fet:" : insertMode === "italic" ? "Kursiv:" : "Rubrik:"}
            </span>
            <input ref={insertInputRef} type="text" value={insertText}
              onChange={(e) => setInsertText(e.target.value)}
              onKeyDown={handleInsertKeyDown}
              className="flex-1 px-3 py-2.5 text-lg bg-transparent focus:outline-none"
              placeholder="Skriv ny text här..." autoFocus />
            <button type="button" onClick={handleInsert} disabled={!insertText.trim()}
              className="px-5 py-2.5 text-lg font-bold rounded-lg bg-[#c05746] text-white touch-manipulation active:scale-95 disabled:opacity-30 whitespace-nowrap">
              Infoga
            </button>
            <button type="button" onClick={() => { setInsertMode(null); setInsertText(""); }}
              className="px-3 py-2.5 text-lg rounded-lg text-muted-foreground touch-manipulation active:scale-95">✕</button>
          </div>
        </div>
      )}

      {/* Row 2: Search and format existing text */}
      <div className="flex items-center gap-3 px-3 pb-3 flex-wrap border-t border-border/20 pt-3">
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Sök i text:</span>
        <button type="button" onClick={() => openSearchMode("bold")}
          className={`${searchBtnBase} ${searchMode === "bold" ? searchBtnActive : searchBtnInactive}`}>
          🔍 <span className="font-black">B</span> Feta ord
        </button>
        <button type="button" onClick={() => openSearchMode("italic")}
          className={`${searchBtnBase} ${searchMode === "italic" ? searchBtnActive : searchBtnInactive}`}>
          🔍 <span className="italic">I</span> Kursivera ord
        </button>
      </div>

      {/* Search input */}
      {searchMode && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border-2 border-[#2d6a4f]/30 p-1.5">
            <span className="text-base font-bold text-[#2d6a4f] pl-2 whitespace-nowrap">
              {searchMode === "bold" ? "Feta:" : "Kursivera:"}
            </span>
            <input ref={searchInputRef} type="text" value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setSearchResult(""); }}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 px-3 py-2.5 text-lg bg-transparent focus:outline-none"
              placeholder="Skriv ord som finns i texten..." autoFocus />
            <button type="button" onClick={handleSearchAndFormat} disabled={!searchText.trim()}
              className="px-5 py-2.5 text-lg font-bold rounded-lg bg-[#2d6a4f] text-white touch-manipulation active:scale-95 disabled:opacity-30 whitespace-nowrap">
              Formatera
            </button>
            <button type="button" onClick={() => { setSearchMode(null); setSearchText(""); setSearchResult(""); }}
              className="px-3 py-2.5 text-lg rounded-lg text-muted-foreground touch-manipulation active:scale-95">✕</button>
          </div>
          {searchResult === "found" && (
            <p className="text-sm text-green-700 font-semibold mt-2 pl-2">Klart! Texten har formaterats.</p>
          )}
          {searchResult === "not-found" && (
            <p className="text-sm text-red-600 font-semibold mt-2 pl-2">Hittade inte "{searchText}" i texten. Kontrollera stavningen.</p>
          )}
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

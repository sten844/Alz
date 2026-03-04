import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Loader2,
  LogIn,
  ShieldAlert,
  BookOpen,
  FileText,
  Clock,
  Check,
  Upload,
  ImageIcon,
} from "lucide-react";
import { Link } from "wouter";

// ---- Article form types ----
type ArticleForm = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  language: string;
  imageUrl: string;
  published: boolean;
  publishedAt: string;
};

const emptyArticleForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "Vardagsliv",
  language: "sv",
  imageUrl: "",
  published: true,
  publishedAt: new Date().toISOString().slice(0, 16),
};

// ---- Diary form types ----
type DiaryForm = {
  content: string;
  published: boolean;
  entryDate: string;
};

const emptyDiaryForm: DiaryForm = {
  content: "",
  published: true,
  entryDate: new Date().toISOString().slice(0, 16),
};

const CATEGORIES = ["Behandling", "Forskning", "Vardagsliv", "Läkemedel", "Åsikt"];

// Auto-save interval in milliseconds (30 seconds)
const AUTO_SAVE_INTERVAL = 30000;

export default function AdminPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"articles" | "diary">("articles");

  // ---- Article state ----
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleForm>(emptyArticleForm);
  const [deleteArticleConfirm, setDeleteArticleConfirm] = useState<number | null>(null);

  // ---- Auto-save state ----
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasDraftToRecover, setHasDraftToRecover] = useState(false);
  const [recoveredDraft, setRecoveredDraft] = useState<ArticleForm | null>(null);
  const [recoveredArticleId, setRecoveredArticleId] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedFormRef = useRef<string>("");

  // ---- Image upload state ----
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Textarea refs for keyboard shortcuts ----
  const articleContentRef = useRef<HTMLTextAreaElement>(null);
  const articleExcerptRef = useRef<HTMLTextAreaElement>(null);
  const diaryContentRef = useRef<HTMLTextAreaElement>(null);

  // ---- Toggle formatting state (for iPad touch mode) ----
  const [activeBold, setActiveBold] = useState<string | null>(null); // which formField has bold active
  const [activeItalic, setActiveItalic] = useState<string | null>(null); // which formField has italic active

  // ---- Diary state ----
  const [editingDiaryId, setEditingDiaryId] = useState<number | null>(null);
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [diaryForm, setDiaryForm] = useState<DiaryForm>(emptyDiaryForm);
  const [deleteDiaryConfirm, setDeleteDiaryConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // ---- Article queries/mutations ----
  const { data: allArticles, isLoading: articlesLoading } = trpc.articles.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const createArticleMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      // Delete draft after successful save
      deleteDraftMutation.mutate({ articleId: editingArticleId });
      setShowArticleForm(false);
      setArticleForm(emptyArticleForm);
      clearAutoSave();
      toast.success("Artikel skapad!");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      // Delete draft after successful save
      deleteDraftMutation.mutate({ articleId: editingArticleId });
      setEditingArticleId(null);
      setShowArticleForm(false);
      setArticleForm(emptyArticleForm);
      clearAutoSave();
      toast.success("Artikel uppdaterad!");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteArticleMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setDeleteArticleConfirm(null);
      toast.success("Artikel borttagen!");
    },
    onError: (err) => toast.error(err.message),
  });

  // ---- Draft mutations ----
  const saveDraftMutation = trpc.drafts.save.useMutation({
    onSuccess: () => {
      setAutoSaveStatus("saved");
      setLastSavedAt(new Date());
      setTimeout(() => setAutoSaveStatus("idle"), 3000);
    },
    onError: () => {
      setAutoSaveStatus("error");
      setTimeout(() => setAutoSaveStatus("idle"), 5000);
    },
  });

  const deleteDraftMutation = trpc.drafts.delete.useMutation({
    onSuccess: () => {
      setHasDraftToRecover(false);
      setRecoveredDraft(null);
      setRecoveredArticleId(null);
      utils.drafts.list.invalidate();
    },
  });

  // Check for any drafts on page load (for recovery)
  const { data: allDrafts } = trpc.drafts.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin" && !showArticleForm,
  });

  // Show draft recovery prompt when drafts exist
  useEffect(() => {
    if (allDrafts && allDrafts.length > 0 && !showArticleForm) {
      const draft = allDrafts[0]; // Most recent draft
      if (draft.title || draft.content || draft.excerpt) {
        setHasDraftToRecover(true);
        setRecoveredDraft({
          title: draft.title || "",
          excerpt: draft.excerpt || "",
          content: draft.content || "",
          category: draft.category || "Vardagsliv",
          language: draft.language || "sv",
          imageUrl: draft.imageUrl || "",
          published: draft.published ?? true,
          publishedAt: draft.publishedAt || new Date().toISOString().slice(0, 16),
        });
        setRecoveredArticleId(draft.articleId);
      }
    }
  }, [allDrafts, showArticleForm]);

  // Auto-save function
  const performAutoSave = useCallback(() => {
    if (!showArticleForm) return;

    const currentFormJson = JSON.stringify(articleForm);
    // Only save if form has changed since last save
    if (currentFormJson === lastSavedFormRef.current) return;
    // Only save if there's some content worth saving
    if (!articleForm.title && !articleForm.content && !articleForm.excerpt) return;

    lastSavedFormRef.current = currentFormJson;
    setAutoSaveStatus("saving");

    saveDraftMutation.mutate({
      articleId: editingArticleId,
      title: articleForm.title,
      excerpt: articleForm.excerpt,
      content: articleForm.content || null,
      category: articleForm.category,
      language: articleForm.language,
      imageUrl: articleForm.imageUrl || null,
      publishedAt: articleForm.publishedAt || null,
      published: articleForm.published,
    });
  }, [showArticleForm, articleForm, editingArticleId, saveDraftMutation]);

  // Start/stop auto-save timer when form is shown/hidden
  useEffect(() => {
    if (showArticleForm) {
      autoSaveTimerRef.current = setInterval(() => {
        performAutoSave();
      }, AUTO_SAVE_INTERVAL);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }
      };
    } else {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    }
  }, [showArticleForm, performAutoSave]);

  // Save draft when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (showArticleForm && (articleForm.title || articleForm.content || articleForm.excerpt)) {
        performAutoSave();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showArticleForm, articleForm, performAutoSave]);

  // ---- Keyboard shortcut handler for text formatting ----
  const handleTextareaKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>,
    formField: "articleContent" | "articleExcerpt" | "diaryContent"
  ) => {
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (!isCtrlOrCmd) return;

    let wrapper = "";
    let prefix = "";
    if (e.key === "b" || e.key === "B") {
      e.preventDefault();
      wrapper = "**";
    } else if (e.key === "i" || e.key === "I") {
      e.preventDefault();
      wrapper = "*";
    } else if (e.key === "h" || e.key === "H") {
      e.preventDefault();
      prefix = "## ";
    } else {
      return;
    }

    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (prefix) {
      // Heading: add prefix at start of line
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineText = text.substring(lineStart, end || start);
      // Check if already a heading
      if (lineText.startsWith("## ")) {
        // Remove heading prefix
        newText = text.substring(0, lineStart) + lineText.substring(3) + text.substring(end || start);
        newCursorStart = Math.max(lineStart, start - 3);
        newCursorEnd = Math.max(lineStart, end - 3);
      } else {
        newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
        newCursorStart = start + prefix.length;
        newCursorEnd = end + prefix.length;
      }
    } else if (selectedText) {
      // Check if already wrapped
      const beforeWrapper = text.substring(start - wrapper.length, start);
      const afterWrapper = text.substring(end, end + wrapper.length);
      if (beforeWrapper === wrapper && afterWrapper === wrapper) {
        // Remove wrapping
        newText = text.substring(0, start - wrapper.length) + selectedText + text.substring(end + wrapper.length);
        newCursorStart = start - wrapper.length;
        newCursorEnd = end - wrapper.length;
      } else {
        // Add wrapping
        newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
        newCursorStart = start + wrapper.length;
        newCursorEnd = end + wrapper.length;
      }
    } else {
      // No selection: insert wrapper pair and place cursor in middle
      newText = text.substring(0, start) + wrapper + wrapper + text.substring(end);
      newCursorStart = start + wrapper.length;
      newCursorEnd = start + wrapper.length;
    }

    // Update the form state
    if (formField === "articleContent") {
      setArticleForm((prev) => ({ ...prev, content: newText }));
    } else if (formField === "articleExcerpt") {
      setArticleForm((prev) => ({ ...prev, excerpt: newText }));
    } else if (formField === "diaryContent") {
      setDiaryForm((prev) => ({ ...prev, content: newText }));
    }

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.selectionStart = newCursorStart;
      textarea.selectionEnd = newCursorEnd;
    });
  };

  // ---- Toolbar button handler (works via ref for iPad/touch) ----
  const applyFormatting = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    formField: "articleContent" | "articleExcerpt" | "diaryContent",
    type: "bold" | "italic" | "heading"
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let wrapper = "";
    let prefix = "";
    if (type === "bold") wrapper = "**";
    else if (type === "italic") wrapper = "*";
    else if (type === "heading") prefix = "## ";

    let newText: string;
    let newCursorStart: number;
    let newCursorEnd: number;

    if (prefix) {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineText = text.substring(lineStart, end || start);
      if (lineText.startsWith("## ")) {
        newText = text.substring(0, lineStart) + lineText.substring(3) + text.substring(end || start);
        newCursorStart = Math.max(lineStart, start - 3);
        newCursorEnd = Math.max(lineStart, end - 3);
      } else {
        newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
        newCursorStart = start + prefix.length;
        newCursorEnd = end + prefix.length;
      }
    } else if (selectedText) {
      // Has selection: wrap/unwrap the selected text
      const beforeWrapper = text.substring(start - wrapper.length, start);
      const afterWrapper = text.substring(end, end + wrapper.length);
      if (beforeWrapper === wrapper && afterWrapper === wrapper) {
        newText = text.substring(0, start - wrapper.length) + selectedText + text.substring(end + wrapper.length);
        newCursorStart = start - wrapper.length;
        newCursorEnd = end - wrapper.length;
      } else {
        newText = text.substring(0, start) + wrapper + selectedText + wrapper + text.substring(end);
        newCursorStart = start + wrapper.length;
        newCursorEnd = end + wrapper.length;
      }
    } else {
      // No selection: toggle mode — insert opening or closing markers
      if (type === "bold") {
        if (activeBold === formField) {
          // Close bold: insert closing **
          newText = text.substring(0, start) + "**" + text.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 2;
          setActiveBold(null);
        } else {
          // Open bold: insert opening **
          newText = text.substring(0, start) + "**" + text.substring(end);
          newCursorStart = start + 2;
          newCursorEnd = start + 2;
          setActiveBold(formField);
        }
      } else if (type === "italic") {
        if (activeItalic === formField) {
          // Close italic: insert closing *
          newText = text.substring(0, start) + "*" + text.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = start + 1;
          setActiveItalic(null);
        } else {
          // Open italic: insert opening *
          newText = text.substring(0, start) + "*" + text.substring(end);
          newCursorStart = start + 1;
          newCursorEnd = start + 1;
          setActiveItalic(formField);
        }
      } else {
        newText = text;
        newCursorStart = start;
        newCursorEnd = end;
      }
    }

    if (formField === "articleContent") {
      setArticleForm((prev) => ({ ...prev, content: newText }));
    } else if (formField === "articleExcerpt") {
      setArticleForm((prev) => ({ ...prev, excerpt: newText }));
    } else if (formField === "diaryContent") {
      setDiaryForm((prev) => ({ ...prev, content: newText }));
    }

    // Restore focus and cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = newCursorStart;
      textarea.selectionEnd = newCursorEnd;
    });
  };

  // Force keyboard open on iPad by focusing textarea
  const forceKeyboardOpen = (textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // On iOS, focus() must happen in a user-gesture handler to trigger the keyboard
    textarea.focus();
    // Move cursor to end of content
    const len = textarea.value.length;
    textarea.selectionStart = len;
    textarea.selectionEnd = len;
    // Scroll textarea into view
    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Reusable formatting toolbar component with toggle state indicators
  const FormattingToolbar = ({
    textareaRef,
    formField,
  }: {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    formField: "articleContent" | "articleExcerpt" | "diaryContent";
  }) => {
    const isBoldActive = activeBold === formField;
    const isItalicActive = activeItalic === formField;

    return (
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <button
          type="button"
          onClick={() => forceKeyboardOpen(textareaRef)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-50 border-2 border-blue-300 text-blue-700 text-lg font-semibold hover:bg-blue-100 active:bg-blue-200 transition-all touch-manipulation"
          title={t("Visa tangentbord", "Show keyboard")}
        >
          <span className="text-xl">⌨️</span>
          <span className="text-base">{t("Skriv", "Type")}</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormatting(textareaRef, formField, "bold")}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-lg font-bold transition-all touch-manipulation ${
            isBoldActive
              ? "bg-[#c05746] text-white border-2 border-[#c05746] shadow-md"
              : "bg-card border border-border/50 text-foreground hover:bg-accent hover:border-[#c05746]/30 active:bg-[#c05746]/10"
          }`}
          title={t("Fet text", "Bold")}
        >
          <span className="text-xl font-bold">B</span>
          <span className="text-base font-normal">{isBoldActive ? t("P\u00c5", "ON") : t("Fet", "Bold")}</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormatting(textareaRef, formField, "italic")}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-lg transition-all touch-manipulation ${
            isItalicActive
              ? "bg-[#c05746] text-white border-2 border-[#c05746] shadow-md"
              : "bg-card border border-border/50 text-foreground hover:bg-accent hover:border-[#c05746]/30 active:bg-[#c05746]/10"
          }`}
          title={t("Kursiv text", "Italic")}
        >
          <span className="text-xl italic" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>I</span>
          <span className="text-base font-normal">{isItalicActive ? t("P\u00c5", "ON") : t("Kursiv", "Italic")}</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyFormatting(textareaRef, formField, "heading")}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-card border border-border/50 text-lg font-semibold text-foreground hover:bg-accent hover:border-[#c05746]/30 active:bg-[#c05746]/10 transition-all touch-manipulation"
          title={t("Rubrik", "Heading")}
        >
          <span className="text-xl font-bold">H</span>
          <span className="text-base font-normal">{t("Rubrik", "Heading")}</span>
        </button>
        {(isBoldActive || isItalicActive) && (
          <span className="text-base text-[#c05746] font-semibold ml-2 animate-pulse">
            {t(
              `Skriv din text, tryck sedan ${isBoldActive ? "B" : ""}${isBoldActive && isItalicActive ? " och " : ""}${isItalicActive ? "I" : ""} igen f\u00f6r att avsluta`,
              `Type your text, then press ${isBoldActive ? "B" : ""}${isBoldActive && isItalicActive ? " and " : ""}${isItalicActive ? "I" : ""} again to finish`
            )}
          </span>
        )}
        {!isBoldActive && !isItalicActive && (
          <span className="text-sm text-muted-foreground/60 ml-2">
            {t("Tryck knapp \u2192 skriv \u2192 tryck igen", "Press button \u2192 type \u2192 press again")}
          </span>
        )}
      </div>
    );
  };

  const clearAutoSave = () => {
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
    lastSavedFormRef.current = "";
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  // ---- Image upload mutation ----
  const uploadImageMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      setArticleForm((prev) => ({ ...prev, imageUrl: data.url }));
      setIsUploading(false);
      toast.success(t("Bild uppladdad!", "Image uploaded!"));
    },
    onError: (err) => {
      setIsUploading(false);
      toast.error(t("Kunde inte ladda upp bild: ", "Failed to upload image: ") + err.message);
    },
  });

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("Välj en bildfil (JPG, PNG, etc.)", "Please select an image file (JPG, PNG, etc.)"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("Bilden är för stor (max 10 MB)", "Image is too large (max 10 MB)"));
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadImageMutation.mutate({
        fileName: file.name,
        fileData: base64,
        contentType: file.type,
      });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error(t("Kunde inte läsa filen", "Could not read file"));
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // ---- Diary queries/mutations ----
  const { data: diaryData, isLoading: diaryLoading } = trpc.diary.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const createDiaryMutation = trpc.diary.create.useMutation({
    onSuccess: () => {
      utils.diary.listAll.invalidate();
      utils.diary.list.invalidate();
      setShowDiaryForm(false);
      setDiaryForm(emptyDiaryForm);
      toast.success("Dagboksinlägg skapat!");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateDiaryMutation = trpc.diary.update.useMutation({
    onSuccess: () => {
      utils.diary.listAll.invalidate();
      utils.diary.list.invalidate();
      setEditingDiaryId(null);
      setShowDiaryForm(false);
      setDiaryForm(emptyDiaryForm);
      toast.success("Dagboksinlägg uppdaterat!");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteDiaryMutation = trpc.diary.delete.useMutation({
    onSuccess: () => {
      utils.diary.listAll.invalidate();
      utils.diary.list.invalidate();
      setDeleteDiaryConfirm(null);
      toast.success("Dagboksinlägg borttaget!");
    },
    onError: (err) => toast.error(err.message),
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader showLanguage={false} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader showLanguage={false} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <LogIn className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
            <h1 className="text-4xl mb-4 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {t("Logga in", "Log in")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("Du måste logga in för att komma åt admin-panelen.", "You must log in to access the admin panel.")}
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              {t("Logga in med Manus", "Log in with Manus")}
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader showLanguage={false} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <ShieldAlert className="w-20 h-20 mx-auto mb-6 text-red-400" />
            <h1 className="text-4xl mb-4 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {t("Åtkomst nekad", "Access denied")}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("Bara administratörer kan komma åt denna sida.", "Only administrators can access this page.")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-4 bg-card border border-border/50 rounded-full text-lg font-medium hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t("Tillbaka till startsidan", "Back to home")}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ---- Article handlers ----
  const handleEditArticle = (article: NonNullable<typeof allArticles>[0]) => {
    setEditingArticleId(article.id);
    setShowArticleForm(true);
    setArticleForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      language: article.language,
      imageUrl: article.imageUrl || "",
      published: article.published,
      publishedAt: new Date(article.publishedAt).toISOString().slice(0, 16),
    });
    lastSavedFormRef.current = "";
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
  };

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setShowArticleForm(true);
    setArticleForm(emptyArticleForm);
    lastSavedFormRef.current = "";
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
  };

  const handleRecoverDraft = () => {
    if (recoveredDraft) {
      setEditingArticleId(recoveredArticleId);
      setShowArticleForm(true);
      setArticleForm(recoveredDraft);
      setHasDraftToRecover(false);
      lastSavedFormRef.current = JSON.stringify(recoveredDraft);
      setAutoSaveStatus("idle");
      toast.success(t("Utkast återställt!", "Draft recovered!"));
    }
  };

  const handleDiscardDraft = () => {
    if (recoveredArticleId !== undefined) {
      deleteDraftMutation.mutate({ articleId: recoveredArticleId });
    }
    setHasDraftToRecover(false);
    setRecoveredDraft(null);
    setRecoveredArticleId(null);
    toast.success(t("Utkast kasserat", "Draft discarded"));
  };

  const handleCloseArticleForm = () => {
    // Save one last time before closing if there's content
    if (articleForm.title || articleForm.content || articleForm.excerpt) {
      performAutoSave();
    }
    setShowArticleForm(false);
    setEditingArticleId(null);
    setArticleForm(emptyArticleForm);
    clearAutoSave();
  };

  const handleSaveArticle = () => {
    if (!articleForm.title || !articleForm.excerpt || !articleForm.content) {
      toast.error("Titel, sammanfattning och innehåll krävs");
      return;
    }
    const data = {
      title: articleForm.title,
      excerpt: articleForm.excerpt,
      content: articleForm.content,
      category: articleForm.category,
      language: articleForm.language,
      imageUrl: articleForm.imageUrl || null,
      published: articleForm.published,
      publishedAt: new Date(articleForm.publishedAt),
    };
    if (editingArticleId) {
      updateArticleMutation.mutate({ id: editingArticleId, ...data });
    } else {
      createArticleMutation.mutate(data);
    }
  };

  // ---- Diary handlers ----
  const handleEditDiary = (entry: NonNullable<typeof diaryData>["entries"][0]) => {
    setEditingDiaryId(entry.id);
    setShowDiaryForm(true);
    setDiaryForm({
      content: entry.content,
      published: entry.published,
      entryDate: new Date(entry.entryDate).toISOString().slice(0, 16),
    });
  };

  const handleNewDiary = () => {
    setEditingDiaryId(null);
    setShowDiaryForm(true);
    setDiaryForm(emptyDiaryForm);
  };

  const handleSaveDiary = () => {
    if (!diaryForm.content) {
      toast.error("Innehåll krävs");
      return;
    }
    const data = {
      content: diaryForm.content,
      published: diaryForm.published,
      entryDate: new Date(diaryForm.entryDate),
    };
    if (editingDiaryId) {
      updateDiaryMutation.mutate({ id: editingDiaryId, ...data });
    } else {
      createDiaryMutation.mutate(data);
    }
  };

  const isArticleSaving = createArticleMutation.isPending || updateArticleMutation.isPending;
  const isDiarySaving = createDiaryMutation.isPending || updateDiaryMutation.isPending;

  // Auto-save status indicator component
  const AutoSaveIndicator = () => {
    if (!showArticleForm) return null;

    return (
      <div className="flex items-center gap-2 text-base">
        {autoSaveStatus === "saving" && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">{t("Sparar utkast...", "Saving draft...")}</span>
          </>
        )}
        {autoSaveStatus === "saved" && (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">
              {t("Utkast sparat", "Draft saved")}
              {lastSavedAt && (
                <span className="ml-1 text-muted-foreground">
                  ({lastSavedAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })})
                </span>
              )}
            </span>
          </>
        )}
        {autoSaveStatus === "error" && (
          <>
            <X className="w-4 h-4 text-red-500" />
            <span className="text-red-500">{t("Kunde inte spara utkast", "Could not save draft")}</span>
          </>
        )}
        {autoSaveStatus === "idle" && lastSavedAt && (
          <>
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {t("Senast sparat", "Last saved")}{" "}
              {lastSavedAt.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader showLanguage={false} />

      <main className="flex-1">
        <div className="container py-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-1 text-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                {t("Tillbaka", "Back")}
              </Link>
              <h1 className="text-4xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {t("Admin", "Admin")}
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-8 border-b border-border/50 pb-4">
            <button
              onClick={() => setActiveTab("articles")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "articles"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <FileText className="w-5 h-5" />
              {t("Artiklar", "Articles")}
            </button>
            <button
              onClick={() => setActiveTab("diary")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "diary"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <BookOpen className="w-5 h-5" />
              {t("Dagbok", "Diary")}
            </button>
          </div>

          {/* ============ ARTICLES TAB ============ */}
          {activeTab === "articles" && (
            <>
              {/* Draft recovery banner */}
              {hasDraftToRecover && !showArticleForm && recoveredDraft && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <FileText className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-amber-800 mb-2">
                        {t("Osparat utkast hittat!", "Unsaved draft found!")}
                      </h3>
                      <p className="text-lg text-amber-700 mb-1">
                        {recoveredDraft.title
                          ? `"${recoveredDraft.title}"`
                          : t("(Utan titel)", "(Untitled)")}
                      </p>
                      <p className="text-base text-amber-600 mb-4">
                        {recoveredDraft.content
                          ? recoveredDraft.content.slice(0, 100) + (recoveredDraft.content.length > 100 ? "..." : "")
                          : t("(Tomt innehåll)", "(Empty content)")}
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        <button
                          onClick={handleRecoverDraft}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-full text-lg font-semibold hover:bg-amber-700 transition-colors shadow-md"
                        >
                          <Save className="w-5 h-5" />
                          {t("Återställ utkast", "Recover draft")}
                        </button>
                        <button
                          onClick={handleDiscardDraft}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-amber-300 text-amber-700 rounded-full text-lg font-medium hover:bg-amber-50 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                          {t("Kassera", "Discard")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("Artikelhantering", "Article Management")}
                </h2>
                <button
                  onClick={handleNewArticle}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  {t("Ny artikel", "New article")}
                </button>
              </div>

              {/* Article form */}
              {showArticleForm && (
                <div className="bg-card rounded-2xl border border-border/50 p-8 mb-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h2 className="text-2xl font-semibold text-foreground">
                        {editingArticleId ? t("Redigera artikel", "Edit article") : t("Ny artikel", "New article")}
                      </h2>
                      <AutoSaveIndicator />
                    </div>
                    <button
                      onClick={handleCloseArticleForm}
                      className="p-3 rounded-full hover:bg-accent transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Titel", "Title")}</label>
                      <input type="text" value={articleForm.title} onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                        className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                        placeholder={t("Artikelns titel...", "Article title...")} />
                    </div>
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Sammanfattning", "Excerpt")}</label>
                      <textarea ref={articleExcerptRef} value={articleForm.excerpt} onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                        onKeyDown={(e) => handleTextareaKeyDown(e, "articleExcerpt")}
                        rows={2} className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-none"
                        placeholder={t("Kort sammanfattning...", "Short excerpt...")} />
                    </div>
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Innehåll (Markdown)", "Content (Markdown)")}</label>
                      <FormattingToolbar textareaRef={articleContentRef} formField="articleContent" />
                      <textarea ref={articleContentRef} value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                        onKeyDown={(e) => handleTextareaKeyDown(e, "articleContent")}
                        rows={12} className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 font-mono resize-y"
                        placeholder={t("Skriv artikelns innehåll i Markdown...", "Write article content in Markdown...")} />
                      <div className="mt-3 p-4 bg-accent/50 rounded-lg border border-border/30">
                        <p className="text-lg font-semibold text-foreground mb-3">{t("Formateringsguide:", "Formatting guide:")}</p>
                        {/* iPad / touch mode guide */}
                        <div className="mb-4 p-3 bg-[#c05746]/5 rounded-lg border-2 border-[#c05746]/30">
                          <p className="text-base font-semibold text-[#c05746] mb-2">{t("📱 Så här gör du (iPad / pekskärm):", "📱 How to format (iPad / touch):")}</p>
                          <div className="space-y-2 text-base text-foreground">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#c05746] shrink-0">1.</span>
                              <span>{t("Tryck i textfältet för att börja skriva", "Tap the text field to start writing")}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#c05746] shrink-0">2.</span>
                              <span>{t('Tryck på B-knappen → den blir röd och visar "PÅ"', 'Press the B button → it turns red and shows "ON"')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#c05746] shrink-0">3.</span>
                              <span>{t("Skriv ditt feta ord", "Type your bold word")}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-[#c05746] shrink-0">4.</span>
                              <span>{t("Tryck på B igen → formateringen stängs", "Press B again → formatting closes")}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{t("Samma sak för I (kursiv). H lägger till en rubrik.", "Same for I (italic). H adds a heading.")}</p>
                        </div>
                        {/* Keyboard shortcuts for physical keyboard */}
                        <div className="mb-4 p-3 bg-background rounded-lg border border-border/30">
                          <p className="text-base font-semibold text-muted-foreground mb-2">{t("⌨️ Med tangentbord:", "⌨️ With keyboard:")}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-base text-muted-foreground">
                            <div><kbd className="px-2 py-0.5 bg-card border border-border rounded text-sm font-mono">Ctrl+B</kbd> → <strong>{t("Fet", "Bold")}</strong></div>
                            <div><kbd className="px-2 py-0.5 bg-card border border-border rounded text-sm font-mono">Ctrl+I</kbd> → <em>{t("Kursiv", "Italic")}</em></div>
                            <div><kbd className="px-2 py-0.5 bg-card border border-border rounded text-sm font-mono">Ctrl+H</kbd> → {t("Rubrik", "Heading")}</div>
                          </div>
                        </div>
                        {/* Markdown syntax reference */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-base text-muted-foreground">
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">## Rubrik</span> → <span className="font-semibold">{t("Stor mellanrubrik", "Large subheading")}</span></div>
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">### Rubrik</span> → <span className="font-semibold">{t("Liten mellanrubrik", "Small subheading")}</span></div>
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">**fet text**</span> → <strong>{t("Fet text", "Bold text")}</strong></div>
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">*kursiv text*</span> → <em>{t("Kursiv text", "Italic text")}</em></div>
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">- Punkt</span> → {t("Punktlista", "Bullet list")}</div>
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">1. Punkt</span> → {t("Numrerad lista", "Numbered list")}</div>
                          <div><span className="font-mono bg-background px-2 py-1 rounded text-foreground">---</span> → {t("Horisontell linje", "Horizontal line")}</div>
                          <div className="text-base">{t("Tom rad = nytt stycke", "Empty line = new paragraph")}</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-lg font-medium text-foreground mb-2">{t("Kategori", "Category")}</label>
                        <select value={articleForm.category} onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                          className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30">
                          {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-foreground mb-2">{t("Språk", "Language")}</label>
                        <select value={articleForm.language} onChange={(e) => setArticleForm({ ...articleForm, language: e.target.value })}
                          className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30">
                          <option value="sv">Svenska</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-lg font-medium text-foreground mb-2">{t("Publiceringsdatum", "Publish date")}</label>
                        <input type="datetime-local" value={articleForm.publishedAt} onChange={(e) => setArticleForm({ ...articleForm, publishedAt: e.target.value })}
                          className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Artikelbild (valfritt)", "Article image (optional)")}</label>
                      {articleForm.imageUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-border/50 bg-background">
                          <img src={articleForm.imageUrl} alt="" className="w-full max-h-64 object-cover" />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                              title={t("Byt bild", "Change image")}
                            >
                              <Upload className="w-5 h-5 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setArticleForm({ ...articleForm, imageUrl: "" })}
                              className="p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                              title={t("Ta bort bild", "Remove image")}
                            >
                              <X className="w-5 h-5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onClick={() => !isUploading && fileInputRef.current?.click()}
                          className={`w-full p-8 rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-3 ${
                            dragOver
                              ? "border-[#c05746] bg-[#c05746]/5"
                              : "border-border/50 bg-background hover:border-[#c05746]/50 hover:bg-accent/30"
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
                              <span className="text-lg text-muted-foreground">{t("Laddar upp...", "Uploading...")}</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-10 h-10 text-muted-foreground" />
                              <span className="text-lg text-muted-foreground text-center">
                                {t("Klicka h\u00e4r eller dra en bild hit", "Click here or drag an image here")}
                              </span>
                              <span className="text-base text-muted-foreground/70">
                                {t("JPG, PNG, WebP (max 10 MB)", "JPG, PNG, WebP (max 10 MB)")}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFile(file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={articleForm.published} onChange={(e) => setArticleForm({ ...articleForm, published: e.target.checked })}
                          className="w-5 h-5 rounded accent-[#c05746]" />
                        <span className="text-lg text-foreground">{t("Publicerad", "Published")}</span>
                      </label>
                      <div className="flex items-center gap-4">
                        <AutoSaveIndicator />
                        <button onClick={handleSaveArticle} disabled={isArticleSaving}
                          className="inline-flex items-center gap-2 px-10 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50">
                          {isArticleSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          {t("Spara", "Save")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Articles list */}
              {articlesLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-[#c05746]" /></div>
              ) : (
                <div className="space-y-4">
                  {allArticles && allArticles.length > 0 ? (
                    allArticles.map((article) => (
                      <div key={article.id} className="bg-card rounded-xl border border-border/50 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
                        {article.imageUrl && <img src={article.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base px-3 py-1 rounded-full bg-accent text-muted-foreground">{article.category}</span>
                            <span className="text-base text-muted-foreground">{article.language.toUpperCase()}</span>
                            {!article.published && <span className="text-base px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">{t("Utkast", "Draft")}</span>}
                          </div>
                          <h3 className="font-semibold text-xl text-foreground truncate">{article.title}</h3>
                          <p className="text-base text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString("sv-SE")}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleEditArticle(article)} className="p-3 rounded-full hover:bg-accent transition-colors" title={t("Redigera", "Edit")}>
                            <Pencil className="w-5 h-5 text-muted-foreground" />
                          </button>
                          {deleteArticleConfirm === article.id ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => deleteArticleMutation.mutate({ id: article.id })} className="px-4 py-2 bg-red-500 text-white rounded-full text-base font-medium hover:bg-red-600 transition-colors">
                                {t("Bekräfta", "Confirm")}
                              </button>
                              <button onClick={() => setDeleteArticleConfirm(null)} className="p-2 rounded-full hover:bg-accent transition-colors"><X className="w-5 h-5" /></button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteArticleConfirm(article.id)} className="p-3 rounded-full hover:bg-red-50 transition-colors" title={t("Ta bort", "Delete")}>
                              <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <p className="text-xl mb-4">{t("Inga artiklar ännu.", "No articles yet.")}</p>
                      <button onClick={handleNewArticle} className="inline-flex items-center gap-2 px-7 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors">
                        <Plus className="w-5 h-5" />{t("Skapa din första artikel", "Create your first article")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ============ DIARY TAB ============ */}
          {activeTab === "diary" && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-foreground">
                  {t("Dagbok", "Diary")}
                </h2>
                <button
                  onClick={handleNewDiary}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  {t("Nytt inlägg", "New entry")}
                </button>
              </div>

              {/* Diary form */}
              {showDiaryForm && (
                <div className="bg-card rounded-2xl border border-border/50 p-8 mb-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {editingDiaryId ? t("Redigera inlägg", "Edit entry") : t("Nytt dagboksinlägg", "New diary entry")}
                    </h2>
                    <button
                      onClick={() => { setShowDiaryForm(false); setEditingDiaryId(null); setDiaryForm(emptyDiaryForm); }}
                      className="p-3 rounded-full hover:bg-accent transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">
                        {t("Datum", "Date")}
                      </label>
                      <input
                        type="datetime-local"
                        value={diaryForm.entryDate}
                        onChange={(e) => setDiaryForm({ ...diaryForm, entryDate: e.target.value })}
                        className="w-full sm:w-72 px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">
                        {t("Innehåll", "Content")}
                      </label>
                      <FormattingToolbar textareaRef={diaryContentRef} formField="diaryContent" />
                      <textarea
                        ref={diaryContentRef}
                        value={diaryForm.content}
                        onChange={(e) => setDiaryForm({ ...diaryForm, content: e.target.value })}
                        onKeyDown={(e) => handleTextareaKeyDown(e, "diaryContent")}
                        rows={8}
                        className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-y leading-relaxed"
                        placeholder={t("Skriv ditt dagboksinlägg...", "Write your diary entry...")}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={diaryForm.published}
                          onChange={(e) => setDiaryForm({ ...diaryForm, published: e.target.checked })}
                          className="w-5 h-5 rounded accent-[#c05746]"
                        />
                        <span className="text-lg text-foreground">{t("Publicerad", "Published")}</span>
                      </label>
                      <button
                        onClick={handleSaveDiary}
                        disabled={isDiarySaving}
                        className="inline-flex items-center gap-2 px-10 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50"
                      >
                        {isDiarySaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {t("Spara", "Save")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Diary entries list */}
              {diaryLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-[#c05746]" /></div>
              ) : (
                <div className="space-y-4">
                  {diaryData && diaryData.entries.length > 0 ? (
                    diaryData.entries.map((entry) => (
                      <div key={entry.id} className="bg-card rounded-xl border border-border/50 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg font-semibold text-[#c05746]">
                                {new Date(entry.entryDate).toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                              </span>
                              {!entry.published && (
                                <span className="text-base px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                  {t("Utkast", "Draft")}
                                </span>
                              )}
                            </div>
                            <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap">
                              {entry.content.length > 200 ? entry.content.slice(0, 200) + "..." : entry.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleEditDiary(entry)} className="p-3 rounded-full hover:bg-accent transition-colors" title={t("Redigera", "Edit")}>
                              <Pencil className="w-5 h-5 text-muted-foreground" />
                            </button>
                            {deleteDiaryConfirm === entry.id ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => deleteDiaryMutation.mutate({ id: entry.id })} className="px-4 py-2 bg-red-500 text-white rounded-full text-base font-medium hover:bg-red-600 transition-colors">
                                  {t("Bekräfta", "Confirm")}
                                </button>
                                <button onClick={() => setDeleteDiaryConfirm(null)} className="p-2 rounded-full hover:bg-accent transition-colors"><X className="w-5 h-5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteDiaryConfirm(entry.id)} className="p-3 rounded-full hover:bg-red-50 transition-colors" title={t("Ta bort", "Delete")}>
                                <Trash2 className="w-5 h-5 text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <p className="text-xl mb-4">{t("Inga dagboksinlägg ännu.", "No diary entries yet.")}</p>
                      <button onClick={handleNewDiary} className="inline-flex items-center gap-2 px-7 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors">
                        <Plus className="w-5 h-5" />{t("Skriv ditt första inlägg", "Write your first entry")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

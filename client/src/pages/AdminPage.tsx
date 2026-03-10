import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Mail,
} from "lucide-react";
import { Link } from "wouter";
import RichTextEditor from "@/components/RichTextEditor";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdownUtils";
import AIPageEditor from "@/components/AIPageEditor";

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
  const [activeTab, setActiveTab] = useState<"articles" | "diary" | "about" | "ai" | "subscribers">("articles");

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

  // ---- Rich text editor HTML state ----
  const [articleContentHtml, setArticleContentHtml] = useState("");
  const [diaryContentHtml, setDiaryContentHtml] = useState("");
  const [articleContentInitialized, setArticleContentInitialized] = useState(false);
  const [diaryContentInitialized, setDiaryContentInitialized] = useState(false);

  // ---- Textarea ref for excerpt keyboard shortcuts ----
  const articleExcerptRef = useRef<HTMLTextAreaElement>(null);

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

  // ---- Handle rich text editor content changes ----
  const handleArticleContentChange = useCallback((html: string) => {
    setArticleContentHtml(html);
    // Convert HTML to markdown for storage
    const md = htmlToMarkdown(html);
    setArticleForm((prev) => ({ ...prev, content: md }));
  }, []);

  const handleDiaryContentChange = useCallback((html: string) => {
    setDiaryContentHtml(html);
    const md = htmlToMarkdown(html);
    setDiaryForm((prev) => ({ ...prev, content: md }));
  }, []);







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
    // Convert markdown to HTML for the rich text editor
    setArticleContentHtml(markdownToHtml(article.content));
    lastSavedFormRef.current = "";
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
  };

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setShowArticleForm(true);
    setArticleForm(emptyArticleForm);
    setArticleContentHtml("");
    lastSavedFormRef.current = "";
    setAutoSaveStatus("idle");
    setLastSavedAt(null);
  };

  const handleRecoverDraft = () => {
    if (recoveredDraft) {
      setEditingArticleId(recoveredArticleId);
      setShowArticleForm(true);
      setArticleForm(recoveredDraft);
      setArticleContentHtml(markdownToHtml(recoveredDraft.content));
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
    setArticleContentHtml("");
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
    // Convert markdown to HTML for the rich text editor
    setDiaryContentHtml(markdownToHtml(entry.content));
  };

  const handleNewDiary = () => {
    setEditingDiaryId(null);
    setShowDiaryForm(true);
    setDiaryForm(emptyDiaryForm);
    setDiaryContentHtml("");
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
            <button
              onClick={() => setActiveTab("about")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "about"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <FileText className="w-5 h-5" />
              {t("Om mig", "About")}
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "ai"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <FileText className="w-5 h-5" />
              {t("AI-sida", "AI page")}
            </button>
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "subscribers"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <Mail className="w-5 h-5" />
              {t("Prenumeranter", "Subscribers")}
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
                        rows={2} className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-none"
                        placeholder={t("Kort sammanfattning...", "Short excerpt...")} />
                    </div>
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Innehåll", "Content")}</label>
                      <RichTextEditor
                        content={articleContentHtml}
                        onChange={handleArticleContentChange}
                        placeholder={t("Skriv artikelns innehåll...", "Write article content...")}
                      />
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
                      <RichTextEditor
                        content={diaryContentHtml}
                        onChange={handleDiaryContentChange}
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

          {/* ============ ABOUT TAB ============ */}
          {activeTab === "about" && (
            <AboutPageEditor />
          )}

          {/* ============ AI PAGE TAB ============ */}
          {activeTab === "ai" && (
            <AIPageEditor />
          )}

          {/* ============ SUBSCRIBERS TAB ============ */}
          {activeTab === "subscribers" && (
            <SubscribersEditor />
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// ---- About Page Editor (simple textarea) ----
function AboutPageEditor() {
  const { t } = useLanguage();
  const [contentSv, setContentSv] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const { data: pageData, isLoading } = trpc.pages.get.useQuery({ slug: "about" });
  const updatePageMutation = trpc.pages.update.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (pageData && !loaded) {
      setContentSv(pageData.contentSv || "");
      setContentEn(pageData.contentEn || "");
      setLoaded(true);
    }
  }, [pageData, loaded]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePageMutation.mutateAsync({
        slug: "about",
        contentSv,
        contentEn,
      });
      utils.pages.get.invalidate();
      toast.success(t("Om mig-sidan sparad!", "About page saved!"));
    } catch (error) {
      toast.error(t("Kunde inte spara", "Failed to save"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-[#c05746]" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("Redigera Om mig-sidan", "Edit About page")}
        </h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-10 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {t("Spara", "Save")}
        </button>
      </div>

      <p className="text-lg text-muted-foreground">
        {t(
          "Redigera texten nedan. Du kan klippa ut, klistra in och redigera fritt. Texten visas på Om mig-sidan.",
          "Edit the text below. You can cut, paste and edit freely. The text is shown on the About page."
        )}
      </p>

      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
        <label className="block text-xl font-semibold text-foreground mb-3">
          {t("Svenska", "Swedish")}
        </label>
        <textarea
          value={contentSv}
          onChange={(e) => setContentSv(e.target.value)}
          placeholder={t("Skriv din Om mig-text på svenska...", "Write your About text in Swedish...")}
          className="w-full min-h-[400px] px-5 py-4 rounded-lg bg-background border border-border/50 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-y"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
        <label className="block text-xl font-semibold text-foreground mb-3">
          {t("Engelska", "English")}
        </label>
        <textarea
          value={contentEn}
          onChange={(e) => setContentEn(e.target.value)}
          placeholder={t("Skriv din Om mig-text på engelska...", "Write your About text in English...")}
          className="w-full min-h-[400px] px-5 py-4 rounded-lg bg-background border border-border/50 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-y"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-10 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {t("Spara", "Save")}
        </button>
      </div>
    </div>
  );
}

// ---- Subscribers Editor ----
function SubscribersEditor() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();

  const { data: subscribersList, isLoading } = trpc.subscribers.list.useQuery();
  const { data: activeCount } = trpc.subscribers.count.useQuery();

  const deleteMutation = trpc.subscribers.delete.useMutation({
    onSuccess: () => {
      utils.subscribers.list.invalidate();
      utils.subscribers.count.invalidate();
      toast.success(t("Prenumerant borttagen", "Subscriber removed"));
    },
    onError: () => {
      toast.error(t("Kunde inte ta bort prenumerant", "Could not remove subscriber"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("Prenumeranter", "Subscribers")}
        </h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border/50">
          <Mail className="w-5 h-5 text-[#c05746]" />
          <span className="text-lg font-medium text-foreground">
            {activeCount ?? 0} {t("aktiva", "active")}
          </span>
        </div>
      </div>

      <p className="text-lg text-muted-foreground">
        {t(
          "Här ser du alla som prenumererar på nya artiklar. Du får en notis med prenumerantlistan när du publicerar en ny artikel.",
          "Here you can see everyone who subscribes to new articles. You will receive a notification with the subscriber list when you publish a new article."
        )}
      </p>

      {(!subscribersList || subscribersList.length === 0) ? (
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-sm">
          <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            {t("Inga prenumeranter ännu.", "No subscribers yet.")}
          </p>
          <p className="text-base text-muted-foreground/60 mt-2">
            {t(
              "När besökare prenumererar via formuläret på startsidan visas de här.",
              "When visitors subscribe via the form on the homepage they will appear here."
            )}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-accent/30">
                <th className="text-left px-6 py-4 text-base font-semibold text-foreground">
                  {t("Email", "Email")}
                </th>
                <th className="text-left px-6 py-4 text-base font-semibold text-foreground">
                  {t("Status", "Status")}
                </th>
                <th className="text-left px-6 py-4 text-base font-semibold text-foreground">
                  {t("Datum", "Date")}
                </th>
                <th className="text-right px-6 py-4 text-base font-semibold text-foreground">
                  {t("Åtgärd", "Action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {subscribersList.map((sub) => (
                <tr key={sub.id} className="border-b border-border/30 hover:bg-accent/10 transition-colors">
                  <td className="px-6 py-4 text-base text-foreground">{sub.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      sub.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${sub.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {sub.active ? t("Aktiv", "Active") : t("Avslutad", "Unsubscribed")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-base text-muted-foreground">
                    {new Date(sub.createdAt).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(t("Vill du ta bort denna prenumerant?", "Do you want to remove this subscriber?"))) {
                          deleteMutation.mutate({ id: sub.id });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("Ta bort", "Remove")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

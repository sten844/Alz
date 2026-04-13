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
  FileEdit,
  Upload,
  ImageIcon,
  Mail,
  Settings2,
  Download,
  UploadCloud,
  Database,
  ExternalLink,
  Send,
  EyeOff,
  MailCheck,
  Paperclip,
} from "lucide-react";
import { Link } from "wouter";
import RichTextEditor from "@/components/RichTextEditor";
import { markdownToHtml, htmlToMarkdown } from "@/lib/markdownUtils";
import AIPageEditor from "@/components/AIPageEditor";
import LinksEditor from "@/components/LinksEditor";

// ---- Article form types ----
type Reference = {
  title: string;
  url: string;
};

type ArticleForm = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  language: string;
  imageUrl: string;
  bottomImageUrl: string;
  published: boolean;
  publishedAt: string;
  references: Reference[];
  attachmentUrl: string;
  attachmentName: string;
};

const emptyArticleForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "Vardagsliv",
  language: "sv",
  imageUrl: "",
  bottomImageUrl: "",
  published: false,
  publishedAt: new Date().toISOString().slice(0, 16),
  references: [],
  attachmentUrl: "",
  attachmentName: "",
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


export default function AdminPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"articles" | "diary" | "about" | "ai" | "links" | "subscribers" | "settings" | "backup">("articles");

  // ---- Article state ----
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleForm>(emptyArticleForm);
  const [deleteArticleConfirm, setDeleteArticleConfirm] = useState<number | null>(null);
  const initialArticleFormRef = useRef<ArticleForm>(emptyArticleForm);
  const initialArticleContentHtmlRef = useRef<string>("");



  // ---- Image upload state ----
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBottom, setIsUploadingBottom] = useState(false);
  const [dragOverBottom, setDragOverBottom] = useState(false);
  const bottomFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const attachmentFileInputRef = useRef<HTMLInputElement>(null);

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
  const { data: allArticles, isLoading: articlesLoading } = trpc.articles.listAll.useQuery({ language: "sv" }, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const createArticleMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setShowArticleForm(false);
      setArticleForm(emptyArticleForm);
      toast.success("Artikel skapad!");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: (_data, variables) => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      if (variables.published) {
        // Close editor when publishing
        setEditingArticleId(null);
        setShowArticleForm(false);
        setArticleForm(emptyArticleForm);
        toast.success("Artikel publicerad! Engelsk version uppdateras automatiskt...");
      } else {
        // Keep editor open when saving as draft
        toast.success("Utkast sparat! Du kan fortsätta redigera.");
      }
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

  const notifySubscribersMutation = trpc.subscribers.notifyNewArticle.useMutation({
    onSuccess: (data) => {
      if (data.notified > 0) {
        toast.success(t(`Notifikation skickad till ${data.notified} prenumeranter!`, `Notification sent to ${data.notified} subscribers!`));
      } else {
        toast.info(t("Inga aktiva prenumeranter att notifiera.", "No active subscribers to notify."));
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const [notifyConfirmArticleId, setNotifyConfirmArticleId] = useState<number | null>(null);
  const [unpublishConfirmArticleId, setUnpublishConfirmArticleId] = useState<number | null>(null);

  // Unpublish mutation - reuses the update mutation to set published=false
  const unpublishArticleMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setUnpublishConfirmArticleId(null);
      toast.success(t("Artikeln har avpublicerats och är nu ett utkast.", "Article unpublished and reverted to draft."));
      // If we're in the editor, update the form state
      if (showArticleForm) {
        setArticleForm(prev => ({ ...prev, published: false }));
      }
    },
    onError: (err) => toast.error(err.message),
  });



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

  // ---- Bottom image upload mutation ----
  const uploadBottomImageMutation = trpc.upload.image.useMutation({
    onSuccess: (data) => {
      setArticleForm((prev) => ({ ...prev, bottomImageUrl: data.url }));
      setIsUploadingBottom(false);
      toast.success(t("Bild uppladdad!", "Image uploaded!"));
    },
    onError: (err) => {
      setIsUploadingBottom(false);
      toast.error(t("Kunde inte ladda upp bild: ", "Failed to upload image: ") + err.message);
    },
  });

  const handleBottomImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("Välj en bildfil (JPG, PNG, etc.)", "Please select an image file (JPG, PNG, etc.)"));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("Bilden är för stor (max 10 MB)", "Image is too large (max 10 MB)"));
      return;
    }
    setIsUploadingBottom(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadBottomImageMutation.mutate({
        fileName: file.name,
        fileData: base64,
        contentType: file.type,
      });
    };
    reader.onerror = () => {
      setIsUploadingBottom(false);
      toast.error(t("Kunde inte läsa filen", "Could not read file"));
    };
    reader.readAsDataURL(file);
  };

  const handleDropBottom = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBottom(false);
    const file = e.dataTransfer.files[0];
    if (file) handleBottomImageFile(file);
  };

  const handleDragOverBottom = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverBottom(true);
  };

  const handleDragLeaveBottom = () => {
    setDragOverBottom(false);
  };

  // ---- Attachment upload mutation ----
  const uploadAttachmentMutation = trpc.upload.file.useMutation({
    onSuccess: (data) => {
      setArticleForm((prev) => ({ ...prev, attachmentUrl: data.url }));
      setIsUploadingAttachment(false);
      toast.success(t("Bilaga uppladdad!", "Attachment uploaded!"));
    },
    onError: (err) => {
      setIsUploadingAttachment(false);
      toast.error(t("Kunde inte ladda upp bilaga: ", "Failed to upload attachment: ") + err.message);
    },
  });

  const handleAttachmentFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("Filen är för stor (max 10 MB)", "File is too large (max 10 MB)"));
      return;
    }
    setIsUploadingAttachment(true);
    setArticleForm((prev) => ({ ...prev, attachmentName: file.name }));
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAttachmentMutation.mutate({
        fileName: file.name,
        fileData: base64,
        contentType: file.type,
      });
    };
    reader.onerror = () => {
      setIsUploadingAttachment(false);
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
    let refs: Reference[] = [];
    try {
      if ((article as any).references) {
        refs = JSON.parse((article as any).references);
      }
    } catch {}
    const formData: ArticleForm = {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      language: article.language,
      imageUrl: article.imageUrl || "",
      bottomImageUrl: (article as any).bottomImageUrl || "",
      published: article.published,
      publishedAt: new Date(article.publishedAt).toISOString().slice(0, 16),
      references: refs,
      attachmentUrl: (article as any).attachmentUrl || "",
      attachmentName: (article as any).attachmentName || "",
    };
    setEditingArticleId(article.id);
    setShowArticleForm(true);
    setArticleForm(formData);
    initialArticleFormRef.current = { ...formData };
    // Convert markdown to HTML for the rich text editor
    const html = markdownToHtml(article.content);
    setArticleContentHtml(html);
    initialArticleContentHtmlRef.current = html;
  };

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setShowArticleForm(true);
    setArticleForm(emptyArticleForm);
    initialArticleFormRef.current = { ...emptyArticleForm };
    setArticleContentHtml("");
    initialArticleContentHtmlRef.current = "";
  };

  const hasUnsavedArticleChanges = () => {
    const initial = initialArticleFormRef.current;
    return (
      articleForm.title !== initial.title ||
      articleForm.excerpt !== initial.excerpt ||
      articleForm.category !== initial.category ||
      articleForm.imageUrl !== initial.imageUrl ||
      articleForm.bottomImageUrl !== initial.bottomImageUrl ||
      articleContentHtml !== initialArticleContentHtmlRef.current
    );
  };

  const handleCloseArticleForm = () => {
    if (hasUnsavedArticleChanges()) {
      if (!window.confirm("Du har osparade ändringar. Vill du verkligen stänga utan att spara?")) {
        return;
      }
    }
    setShowArticleForm(false);
    setEditingArticleId(null);
    setArticleForm(emptyArticleForm);
    setArticleContentHtml("");
  };

  const handleSaveArticle = (forcePublished?: boolean) => {
    if (!articleForm.title || !articleForm.excerpt || !articleForm.content) {
      toast.error("Titel, sammanfattning och innehåll krävs");
      return;
    }
    const published = forcePublished !== undefined ? forcePublished : articleForm.published;
    const refsJson = articleForm.references.length > 0 ? JSON.stringify(articleForm.references) : null;
    const data = {
      title: articleForm.title,
      excerpt: articleForm.excerpt,
      content: articleForm.content,
      category: articleForm.category,
      language: articleForm.language,
      imageUrl: articleForm.imageUrl || null,
      bottomImageUrl: articleForm.bottomImageUrl || null,
      published,
      publishedAt: new Date(articleForm.publishedAt),
      references: refsJson,
      attachmentUrl: articleForm.attachmentUrl || null,
      attachmentName: articleForm.attachmentName || null,
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
              onClick={() => setActiveTab("links")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "links"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <ExternalLink className="w-5 h-5" />
              {t("Länkar", "Links")}
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
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <Settings2 className="w-5 h-5" />
              {t("Inställningar", "Settings")}
            </button>
            <button
              onClick={() => setActiveTab("backup")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-medium transition-all ${
                activeTab === "backup"
                  ? "bg-[#c05746] text-white shadow-md"
                  : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
              }`}
            >
              <Database className="w-5 h-5" />
              {t("Backup", "Backup")}
            </button>
          </div>

          {/* ============ ARTICLES TAB ============ */}
          {activeTab === "articles" && (
            <>

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
                    <h2 className="text-2xl font-semibold text-foreground">
                      {editingArticleId ? t("Redigera artikel", "Edit article") : t("Ny artikel", "New article")}
                    </h2>
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
                    {/* Bottom image (optional) */}
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Bild l\u00e4ngst ned i artikeln (valfritt)", "Bottom image (optional)")}</label>
                      {articleForm.bottomImageUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-border/50 bg-background">
                          <img src={articleForm.bottomImageUrl} alt="" className="w-full object-contain" />
                          <div className="absolute top-3 right-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => bottomFileInputRef.current?.click()}
                              className="p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                              title={t("Byt bild", "Change image")}
                            >
                              <Upload className="w-5 h-5 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setArticleForm({ ...articleForm, bottomImageUrl: "" })}
                              className="p-2 bg-white/90 rounded-full shadow hover:bg-white transition-colors"
                              title={t("Ta bort bild", "Remove image")}
                            >
                              <X className="w-5 h-5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDrop={handleDropBottom}
                          onDragOver={handleDragOverBottom}
                          onDragLeave={handleDragLeaveBottom}
                          onClick={() => !isUploadingBottom && bottomFileInputRef.current?.click()}
                          className={`w-full p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center gap-2 ${
                            dragOverBottom
                              ? "border-[#c05746] bg-[#c05746]/5"
                              : "border-border/50 bg-background hover:border-[#c05746]/50 hover:bg-accent/30"
                          }`}
                        >
                          {isUploadingBottom ? (
                            <>
                              <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
                              <span className="text-base text-muted-foreground">{t("Laddar upp...", "Uploading...")}</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              <span className="text-base text-muted-foreground text-center">
                                {t("Klicka eller dra en bild hit", "Click or drag an image here")}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={bottomFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBottomImageFile(file);
                          e.target.value = "";
                        }}
                      />
                    </div>

                    {/* References / Sources section */}
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Källor / Referenser", "Sources / References")}</label>
                      <div className="space-y-2">
                        {articleForm.references.map((ref, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={t("Titel", "Title")}
                              value={ref.title}
                              onChange={(e) => {
                                const updated = [...articleForm.references];
                                updated[idx] = { ...updated[idx], title: e.target.value };
                                setArticleForm({ ...articleForm, references: updated });
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                            />
                            <input
                              type="url"
                              placeholder="https://..."
                              value={ref.url}
                              onChange={(e) => {
                                const updated = [...articleForm.references];
                                updated[idx] = { ...updated[idx], url: e.target.value };
                                setArticleForm({ ...articleForm, references: updated });
                              }}
                              className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background text-base focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = articleForm.references.filter((_, i) => i !== idx);
                                setArticleForm({ ...articleForm, references: updated });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={t("Ta bort", "Remove")}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setArticleForm({
                              ...articleForm,
                              references: [...articleForm.references, { title: "", url: "" }],
                            });
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-base text-[#c05746] border border-[#c05746]/30 rounded-lg hover:bg-[#c05746]/5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          {t("Lägg till källa", "Add source")}
                        </button>
                      </div>
                    </div>

                    {/* Attachment section */}
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Bilaga (valfritt)", "Attachment (optional)")}</label>
                      {articleForm.attachmentUrl ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                          <Paperclip className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <a href={articleForm.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[#c05746] hover:underline truncate flex-1">
                            {articleForm.attachmentName || t("Bilaga", "Attachment")}
                          </a>
                          <button
                            type="button"
                            onClick={() => setArticleForm({ ...articleForm, attachmentUrl: "", attachmentName: "" })}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t("Ta bort bilaga", "Remove attachment")}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            type="button"
                            onClick={() => attachmentFileInputRef.current?.click()}
                            disabled={isUploadingAttachment}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-background text-base hover:bg-muted/50 transition-colors disabled:opacity-50"
                          >
                            {isUploadingAttachment ? (
                              <><Loader2 className="w-4 h-4 animate-spin" />{t("Laddar upp...", "Uploading...")}</>
                            ) : (
                              <><Paperclip className="w-4 h-4" />{t("Välj fil", "Choose file")}</>
                            )}
                          </button>
                          <input
                            ref={attachmentFileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleAttachmentFile(file);
                              e.target.value = "";
                            }}
                          />
                          <p className="text-sm text-muted-foreground mt-1">{t("PDF, Word, Excel, text (max 10 MB)", "PDF, Word, Excel, text (max 10 MB)")}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-3">
                      {/* Status indicator */}
                      <div className="flex items-center gap-2 text-base">
                        {articleForm.published ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            <Check className="w-4 h-4" />{t("Publicerad", "Published")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                            <FileEdit className="w-4 h-4" />{t("Utkast", "Draft")}
                          </span>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Save as Draft button */}
                        <button
                          onClick={() => handleSaveArticle(false)}
                          disabled={isArticleSaving}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-full text-lg font-semibold hover:bg-amber-600 transition-colors shadow-md disabled:opacity-50"
                        >
                          {isArticleSaving && !articleForm.published ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileEdit className="w-5 h-5" />}
                          {t("Spara som utkast", "Save as draft")}
                        </button>
                        {/* Publish / Save Published button */}
                        <button
                          onClick={() => handleSaveArticle(true)}
                          disabled={isArticleSaving}
                          className="inline-flex items-center gap-2 px-8 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50"
                        >
                          {isArticleSaving && articleForm.published ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          {editingArticleId && articleForm.published
                            ? t("Spara & publicera", "Save & publish")
                            : t("Publicera", "Publish")}
                        </button>
                        {/* Send to subscribers button - only for published articles */}
                        {editingArticleId && articleForm.published && (
                          <button
                            onClick={() => setNotifyConfirmArticleId(editingArticleId)}
                            disabled={notifySubscribersMutation.isPending}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-full text-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
                          >
                            {notifySubscribersMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {t("Skicka till prenumeranter", "Send to subscribers")}
                          </button>
                        )}
                        {/* Unpublish button - only for published articles being edited */}
                        {editingArticleId && articleForm.published && (
                          <button
                            onClick={() => setUnpublishConfirmArticleId(editingArticleId)}
                            disabled={unpublishArticleMutation.isPending}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-slate-500 text-white rounded-full text-lg font-semibold hover:bg-slate-600 transition-colors shadow-md disabled:opacity-50"
                          >
                            {unpublishArticleMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <EyeOff className="w-5 h-5" />}
                            {t("Avpublicera", "Unpublish")}
                          </button>
                        )}
                      </div>
                      {/* Confirm dialog for sending to subscribers */}
                      {notifyConfirmArticleId && (
                        <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                          <p className="text-base text-emerald-800 mb-3">
                            {t(
                              "Vill du skicka en notifikation till alla prenumeranter om denna artikel?",
                              "Do you want to send a notification to all subscribers about this article?"
                            )}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                notifySubscribersMutation.mutate({
                                  articleId: notifyConfirmArticleId,
                                  articleTitle: articleForm.title,
                                  articleExcerpt: articleForm.excerpt || undefined,
                                  siteUrl: window.location.origin,
                                });
                                setNotifyConfirmArticleId(null);
                              }}
                              className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors"
                            >
                              {t("Ja, skicka", "Yes, send")}
                            </button>
                            <button
                              onClick={() => setNotifyConfirmArticleId(null)}
                              className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-full font-semibold hover:bg-slate-50 transition-colors"
                            >
                              {t("Avbryt", "Cancel")}
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Confirm dialog for unpublishing */}
                      {unpublishConfirmArticleId && (
                        <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-base text-slate-800 mb-3">
                            {t(
                              "Vill du avpublicera denna artikel? Den kommer att bli ett utkast och inte längre vara synlig för besökare.",
                              "Do you want to unpublish this article? It will become a draft and no longer be visible to visitors."
                            )}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                unpublishArticleMutation.mutate({
                                  id: unpublishConfirmArticleId,
                                  published: false,
                                });
                              }}
                              className="px-6 py-2 bg-slate-600 text-white rounded-full font-semibold hover:bg-slate-700 transition-colors"
                            >
                              {t("Ja, avpublicera", "Yes, unpublish")}
                            </button>
                            <button
                              onClick={() => setUnpublishConfirmArticleId(null)}
                              className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-full font-semibold hover:bg-slate-50 transition-colors"
                            >
                              {t("Avbryt", "Cancel")}
                            </button>
                          </div>
                        </div>
                      )}
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
                            {article.published && (article as any).notifiedAt && (
                              <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-600" title={t("Skickad till prenumeranter", "Sent to subscribers") + " " + new Date((article as any).notifiedAt).toLocaleDateString("sv-SE")}>
                                <MailCheck className="w-3.5 h-3.5" />{t("Skickad", "Sent")}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-xl text-foreground truncate">{article.title}</h3>
                          <p className="text-base text-muted-foreground">{new Date(article.publishedAt).toLocaleDateString("sv-SE")}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {article.published && (
                            <button
                              onClick={() => setNotifyConfirmArticleId(article.id)}
                              disabled={notifySubscribersMutation.isPending}
                              className="p-3 rounded-full hover:bg-emerald-50 transition-colors"
                              title={t("Skicka till prenumeranter", "Send to subscribers")}
                            >
                              <Send className="w-5 h-5 text-emerald-600" />
                            </button>
                          )}
                          {article.published && (
                            <button
                              onClick={() => setUnpublishConfirmArticleId(article.id)}
                              disabled={unpublishArticleMutation.isPending}
                              className="p-3 rounded-full hover:bg-slate-100 transition-colors"
                              title={t("Avpublicera", "Unpublish")}
                            >
                              <EyeOff className="w-5 h-5 text-slate-500" />
                            </button>
                          )}
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

              {/* Confirm dialog for sending to subscribers from article list */}
              {notifyConfirmArticleId && !showArticleForm && allArticles?.find(a => a.id === notifyConfirmArticleId) && (
                <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-base text-emerald-800 mb-1 font-semibold">{allArticles.find(a => a.id === notifyConfirmArticleId)!.title}</p>
                  <p className="text-base text-emerald-800 mb-3">
                    {t(
                      "Vill du skicka en notifikation till alla prenumeranter om denna artikel?",
                      "Do you want to send a notification to all subscribers about this article?"
                    )}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const target = allArticles?.find(a => a.id === notifyConfirmArticleId);
                        if (target) {
                          notifySubscribersMutation.mutate({
                            articleId: notifyConfirmArticleId,
                            articleTitle: target.title,
                            articleExcerpt: target.excerpt || undefined,
                            siteUrl: window.location.origin,
                          });
                        }
                        setNotifyConfirmArticleId(null);
                      }}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      {t("Ja, skicka", "Yes, send")}
                    </button>
                    <button
                      onClick={() => setNotifyConfirmArticleId(null)}
                      className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-full font-semibold hover:bg-slate-50 transition-colors"
                    >
                      {t("Avbryt", "Cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm dialog for unpublishing from article list */}
              {unpublishConfirmArticleId && !showArticleForm && allArticles?.find(a => a.id === unpublishConfirmArticleId) && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-base text-slate-800 mb-1 font-semibold">{allArticles.find(a => a.id === unpublishConfirmArticleId)!.title}</p>
                  <p className="text-base text-slate-800 mb-3">
                    {t(
                      "Vill du avpublicera denna artikel? Den kommer att bli ett utkast och inte längre vara synlig för besökare.",
                      "Do you want to unpublish this article? It will become a draft and no longer be visible to visitors."
                    )}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        unpublishArticleMutation.mutate({
                          id: unpublishConfirmArticleId,
                          published: false,
                        });
                      }}
                      className="px-6 py-2 bg-slate-600 text-white rounded-full font-semibold hover:bg-slate-700 transition-colors"
                    >
                      {t("Ja, avpublicera", "Yes, unpublish")}
                    </button>
                    <button
                      onClick={() => setUnpublishConfirmArticleId(null)}
                      className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-full font-semibold hover:bg-slate-50 transition-colors"
                    >
                      {t("Avbryt", "Cancel")}
                    </button>
                  </div>
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

          {/* ============ LINKS TAB ============ */}
          {activeTab === "links" && (
            <LinksEditor />
          )}

          {/* ============ SETTINGS TAB ============ */}
          {activeTab === "settings" && (
            <SiteSettingsEditor />
          )}

          {/* ============ BACKUP TAB ============ */}
          {activeTab === "backup" && (
            <BackupEditor />
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

// ---- Site Settings Editor ----
function SiteSettingsEditor() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();

  const { data: commentsEnabled, isLoading } = trpc.settings.get.useQuery({ key: "comments_enabled" });

  const updateSetting = trpc.settings.update.useMutation({
    onSuccess: () => {
      utils.settings.get.invalidate({ key: "comments_enabled" });
      toast.success(t("Inställning sparad", "Setting saved"));
    },
    onError: () => {
      toast.error(t("Kunde inte spara inställning", "Could not save setting"));
    },
  });

  const isCommentsOn = commentsEnabled === "true";

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-foreground">
        {t("Inställningar", "Settings")}
      </h2>

      <p className="text-lg text-muted-foreground">
        {t(
          "Här kan du slå på och av funktioner på sajten.",
          "Here you can toggle features on and off on the site."
        )}
      </p>

      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              {t("Kommentarsfunktion", "Comments section")}
            </h3>
            <p className="text-base text-muted-foreground mt-1">
              {t(
                "Visa eller dölj kommentarssektionen på startsidan. När den är avstängd ser besökare inte kommentarsfältet.",
                "Show or hide the comments section on the homepage. When off, visitors won't see the comments area."
              )}
            </p>
          </div>
          <button
            onClick={() => {
              updateSetting.mutate({
                key: "comments_enabled",
                value: isCommentsOn ? "false" : "true",
              });
            }}
            disabled={updateSetting.isPending}
            className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c05746] focus-visible:ring-offset-2 ${
              isCommentsOn ? "bg-[#c05746]" : "bg-slate-300"
            } ${updateSetting.isPending ? "opacity-50" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isCommentsOn ? "translate-x-10" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
            isCommentsOn
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCommentsOn ? "bg-emerald-500" : "bg-slate-400"}`} />
            {isCommentsOn ? t("Påslagen", "Enabled") : t("Avstängd", "Disabled")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---- Backup / Export / Import Editor ----
function BackupEditor() {
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<Record<string, number> | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportQuery = trpc.backup.export.useQuery(undefined, {
    enabled: false, // Only fetch on demand
  });

  const importMutation = trpc.backup.import.useMutation({
    onSuccess: (result) => {
      setImportStats(result.stats);
      setIsImporting(false);
      setShowImportConfirm(false);
      setPendingImportData(null);
      setPendingFileName("");
      toast.success(t("Import klar!", "Import complete!"));
    },
    onError: (error) => {
      setIsImporting(false);
      toast.error(t("Import misslyckades: ", "Import failed: ") + error.message);
    },
  });

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportQuery.refetch();
      if (result.data) {
        const jsonStr = JSON.stringify(result.data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `dellby-backup-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t("Backup nedladdad!", "Backup downloaded!"));
      }
    } catch (error) {
      toast.error(t("Kunde inte exportera data", "Could not export data"));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.exportVersion) {
          toast.error(t(
            "Ogiltig backupfil. Filen måste vara en JSON-export från denna sajt.",
            "Invalid backup file. The file must be a JSON export from this site."
          ));
          return;
        }
        setPendingImportData(data);
        setPendingFileName(file.name);
        setShowImportConfirm(true);
      } catch {
        toast.error(t("Kunde inte läsa filen. Kontrollera att det är en giltig JSON-fil.", "Could not read file. Make sure it is a valid JSON file."));
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportConfirm = () => {
    if (!pendingImportData) return;
    setIsImporting(true);
    const { exportVersion, exportDate, ...importData } = pendingImportData;
    importMutation.mutate(importData);
  };

  const handleImportCancel = () => {
    setShowImportConfirm(false);
    setPendingImportData(null);
    setPendingFileName("");
  };

  // Count items in pending import data
  const pendingCounts = pendingImportData ? {
    articles: pendingImportData.articles?.length ?? 0,
    diaryEntries: pendingImportData.diaryEntries?.length ?? 0,
    aiSections: pendingImportData.aiSections?.length ?? 0,
    aiItems: pendingImportData.aiItems?.length ?? 0,
    subscribers: pendingImportData.subscribers?.length ?? 0,
    sitePages: pendingImportData.sitePages?.length ?? 0,
    siteSettings: pendingImportData.siteSettings?.length ?? 0,
  } : null;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-foreground">
        {t("Säkerhetskopiering", "Backup")}
      </h2>

      <p className="text-lg text-muted-foreground">
        {t(
          "Ladda ner allt innehåll som en fil (artiklar, dagbok, AI-sida, prenumeranter, inställningar). Du kan använda filen för att återställa innehållet om det behövs.",
          "Download all content as a file (articles, diary, AI page, subscribers, settings). You can use the file to restore content if needed."
        )}
      </p>

      {/* ---- EXPORT SECTION ---- */}
      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Download className="w-7 h-7 text-emerald-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              {t("Ladda ner backup", "Download backup")}
            </h3>
            <p className="text-base text-muted-foreground mt-1">
              {t(
                "Sparar allt innehåll på sajten som en JSON-fil på din dator. Gör detta regelbundet!",
                "Saves all site content as a JSON file on your computer. Do this regularly!"
              )}
            </p>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-lg font-medium transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isExporting
                ? t("Laddar ner...", "Downloading...")
                : t("Ladda ner backup", "Download backup")}
            </button>
          </div>
        </div>
      </div>

      {/* ---- IMPORT SECTION ---- */}
      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <UploadCloud className="w-7 h-7 text-amber-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground">
              {t("Återställ från backup", "Restore from backup")}
            </h3>
            <p className="text-base text-muted-foreground mt-1">
              {t(
                "Ladda upp en tidigare nedladdad backupfil för att återställa innehållet. Befintligt innehåll uppdateras, inget raderas.",
                "Upload a previously downloaded backup file to restore content. Existing content is updated, nothing is deleted."
              )}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-lg font-medium transition-colors disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
              {isImporting
                ? t("Importerar...", "Importing...")
                : t("Välj backupfil...", "Choose backup file...")}
            </button>
          </div>
        </div>
      </div>

      {/* ---- IMPORT CONFIRMATION DIALOG ---- */}
      {showImportConfirm && pendingCounts && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 shadow-md">
          <h3 className="text-xl font-semibold text-amber-900 mb-4">
            {t("Bekräfta import", "Confirm import")}
          </h3>
          <p className="text-base text-amber-800 mb-2">
            {t("Fil: ", "File: ")}<strong>{pendingFileName}</strong>
          </p>
          {pendingImportData?.exportDate && (
            <p className="text-base text-amber-800 mb-4">
              {t("Exporterad: ", "Exported: ")}
              <strong>{new Date(pendingImportData.exportDate).toLocaleString("sv-SE")}</strong>
            </p>
          )}
          <p className="text-base text-amber-800 mb-4">
            {t("Filen innehåller:", "The file contains:")}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {pendingCounts.articles > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-amber-200">
                <span className="text-2xl font-bold text-amber-900">{pendingCounts.articles}</span>
                <span className="text-base text-amber-700 ml-2">{t("artiklar", "articles")}</span>
              </div>
            )}
            {pendingCounts.diaryEntries > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-amber-200">
                <span className="text-2xl font-bold text-amber-900">{pendingCounts.diaryEntries}</span>
                <span className="text-base text-amber-700 ml-2">{t("dagboksinlägg", "diary entries")}</span>
              </div>
            )}
            {pendingCounts.aiItems > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-amber-200">
                <span className="text-2xl font-bold text-amber-900">{pendingCounts.aiItems}</span>
                <span className="text-base text-amber-700 ml-2">{t("AI-kort", "AI cards")}</span>
              </div>
            )}
            {pendingCounts.subscribers > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-amber-200">
                <span className="text-2xl font-bold text-amber-900">{pendingCounts.subscribers}</span>
                <span className="text-base text-amber-700 ml-2">{t("prenumeranter", "subscribers")}</span>
              </div>
            )}
            {pendingCounts.sitePages > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-amber-200">
                <span className="text-2xl font-bold text-amber-900">{pendingCounts.sitePages}</span>
                <span className="text-base text-amber-700 ml-2">{t("sidor", "pages")}</span>
              </div>
            )}
            {pendingCounts.siteSettings > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-amber-200">
                <span className="text-2xl font-bold text-amber-900">{pendingCounts.siteSettings}</span>
                <span className="text-base text-amber-700 ml-2">{t("inställningar", "settings")}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-amber-700 mb-6">
            {t(
              "Befintligt innehåll uppdateras med data från filen. Inget raderas, men ändringar skrivs över.",
              "Existing content will be updated with data from the file. Nothing is deleted, but changes are overwritten."
            )}
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleImportConfirm}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-lg font-medium transition-colors disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isImporting
                ? t("Importerar...", "Importing...")
                : t("Ja, importera", "Yes, import")}
            </button>
            <button
              onClick={handleImportCancel}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-lg font-medium border border-slate-300 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
              {t("Avbryt", "Cancel")}
            </button>
          </div>
        </div>
      )}

      {/* ---- IMPORT RESULTS ---- */}
      {importStats && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 shadow-md">
          <h3 className="text-xl font-semibold text-emerald-900 mb-4 flex items-center gap-2">
            <Check className="w-6 h-6" />
            {t("Import slutförd!", "Import complete!")}
          </h3>
          <p className="text-base text-emerald-800 mb-4">
            {t("Följande innehåll importerades:", "The following content was imported:")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(importStats).map(([key, count]) => {
              if (count === 0) return null;
              const labels: Record<string, [string, string]> = {
                articles: ["artiklar", "articles"],
                diaryEntries: ["dagboksinlägg", "diary entries"],
                aiSections: ["AI-sektioner", "AI sections"],
                aiItems: ["AI-kort", "AI cards"],
                subscribers: ["prenumeranter", "subscribers"],
                sitePages: ["sidor", "pages"],
                siteSettings: ["inställningar", "settings"],
              };
              const [sv, en] = labels[key] ?? [key, key];
              return (
                <div key={key} className="bg-white rounded-xl px-4 py-3 border border-emerald-200">
                  <span className="text-2xl font-bold text-emerald-900">{count}</span>
                  <span className="text-base text-emerald-700 ml-2">{t(sv, en)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

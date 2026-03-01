import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
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
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  LogIn,
  ShieldAlert,
  BookOpen,
  FileText,
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

export default function AdminPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"articles" | "diary">("articles");

  // ---- Article state ----
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleForm>(emptyArticleForm);
  const [deleteArticleConfirm, setDeleteArticleConfirm] = useState<number | null>(null);

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
      setShowArticleForm(false);
      setArticleForm(emptyArticleForm);
      toast.success("Artikel skapad!");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateArticleMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setEditingArticleId(null);
      setArticleForm(emptyArticleForm);
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
  };

  const handleNewArticle = () => {
    setEditingArticleId(null);
    setShowArticleForm(true);
    setArticleForm(emptyArticleForm);
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
                      onClick={() => { setShowArticleForm(false); setEditingArticleId(null); setArticleForm(emptyArticleForm); }}
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
                      <textarea value={articleForm.excerpt} onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                        rows={2} className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-none"
                        placeholder={t("Kort sammanfattning...", "Short excerpt...")} />
                    </div>
                    <div>
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Innehåll (Markdown)", "Content (Markdown)")}</label>
                      <textarea value={articleForm.content} onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                        rows={12} className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 font-mono resize-y"
                        placeholder={t("Skriv artikelns innehåll i Markdown...", "Write article content in Markdown...")} />
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
                      <label className="block text-lg font-medium text-foreground mb-2">{t("Bild-URL (valfritt)", "Image URL (optional)")}</label>
                      <input type="text" value={articleForm.imageUrl} onChange={(e) => setArticleForm({ ...articleForm, imageUrl: e.target.value })}
                        className="w-full px-5 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                        placeholder="https://..." />
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={articleForm.published} onChange={(e) => setArticleForm({ ...articleForm, published: e.target.checked })}
                          className="w-5 h-5 rounded accent-[#c05746]" />
                        <span className="text-lg text-foreground">{t("Publicerad", "Published")}</span>
                      </label>
                      <button onClick={handleSaveArticle} disabled={isArticleSaving}
                        className="inline-flex items-center gap-2 px-10 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50">
                        {isArticleSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {t("Spara", "Save")}
                      </button>
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
                      <textarea
                        value={diaryForm.content}
                        onChange={(e) => setDiaryForm({ ...diaryForm, content: e.target.value })}
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

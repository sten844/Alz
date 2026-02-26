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
} from "lucide-react";
import { Link } from "wouter";

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

const emptyForm: ArticleForm = {
  title: "",
  excerpt: "",
  content: "",
  category: "Vardagsliv",
  language: "sv",
  imageUrl: "",
  published: true,
  publishedAt: new Date().toISOString().slice(0, 16),
};

const CATEGORIES = ["Behandling", "Forskning", "Vardagsliv", "Läkemedel", "Åsikt"];

export default function AdminPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: allArticles, isLoading } = trpc.articles.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const createMutation = trpc.articles.create.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setShowForm(false);
      setForm(emptyForm);
      toast.success("Artikel skapad!");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setEditingId(null);
      setForm(emptyForm);
      toast.success("Artikel uppdaterad!");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => {
      utils.articles.listAll.invalidate();
      utils.articles.list.invalidate();
      setDeleteConfirm(null);
      toast.success("Artikel borttagen!");
    },
    onError: (err) => toast.error(err.message),
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <LogIn className="w-16 h-16 mx-auto mb-6 text-muted-foreground/50" />
            <h1
              className="text-3xl mb-4 text-foreground"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t("Logga in", "Log in")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t(
                "Du måste logga in för att komma åt admin-panelen.",
                "You must log in to access the admin panel."
              )}
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#c05746] text-white rounded-full text-sm font-semibold hover:bg-[#a8483b] transition-colors shadow-lg"
            >
              <LogIn className="w-4 h-4" />
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
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-red-400" />
            <h1
              className="text-3xl mb-4 text-foreground"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t("Åtkomst nekad", "Access denied")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t(
                "Bara administratörer kan komma åt denna sida.",
                "Only administrators can access this page."
              )}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-card border border-border/50 rounded-full text-sm font-medium hover:bg-accent transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Tillbaka till startsidan", "Back to home")}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const handleEdit = (article: NonNullable<typeof allArticles>[0]) => {
    setEditingId(article.id);
    setShowForm(true);
    setForm({
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

  const handleNew = () => {
    setEditingId(null);
    setShowForm(true);
    setForm(emptyForm);
  };

  const handleSave = () => {
    if (!form.title || !form.excerpt || !form.content) {
      toast.error("Titel, sammanfattning och innehåll krävs");
      return;
    }

    const data = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      category: form.category,
      language: form.language,
      imageUrl: form.imageUrl || null,
      published: form.published,
      publishedAt: new Date(form.publishedAt),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("Tillbaka", "Back")}
              </Link>
              <h1
                className="text-3xl text-foreground"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {t("Artikelhantering", "Article Management")}
              </h1>
            </div>
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#c05746] text-white rounded-full text-sm font-semibold hover:bg-[#a8483b] transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              {t("Ny artikel", "New article")}
            </button>
          </div>

          {/* Article form */}
          {showForm && (
            <div className="bg-card rounded-2xl border border-border/50 p-6 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {editingId
                    ? t("Redigera artikel", "Edit article")
                    : t("Ny artikel", "New article")}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                  className="p-2 rounded-full hover:bg-accent transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("Titel", "Title")}
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                    placeholder={t("Artikelns titel...", "Article title...")}
                  />
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("Sammanfattning", "Excerpt")}
                  </label>
                  <textarea
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-none"
                    placeholder={t("Kort sammanfattning...", "Short excerpt...")}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("Innehåll (Markdown)", "Content (Markdown)")}
                  </label>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 font-mono resize-y"
                    placeholder={t("Skriv artikelns innehåll i Markdown...", "Write article content in Markdown...")}
                  />
                </div>

                {/* Row: Category, Language, Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t("Kategori", "Category")}
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t("Språk", "Language")}
                    </label>
                    <select
                      value={form.language}
                      onChange={(e) => setForm({ ...form, language: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                    >
                      <option value="sv">Svenska</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t("Publiceringsdatum", "Publish date")}
                    </label>
                    <input
                      type="datetime-local"
                      value={form.publishedAt}
                      onChange={(e) => setForm({ ...form, publishedAt: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("Bild-URL (valfritt)", "Image URL (optional)")}
                  </label>
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                    placeholder="https://..."
                  />
                </div>

                {/* Published toggle + Save */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.published}
                      onChange={(e) => setForm({ ...form, published: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#c05746]"
                    />
                    <span className="text-sm text-foreground">
                      {t("Publicerad", "Published")}
                    </span>
                  </label>

                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-8 py-2.5 bg-[#c05746] text-white rounded-full text-sm font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {t("Spara", "Save")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Articles list */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
            </div>
          ) : (
            <div className="space-y-3">
              {allArticles && allArticles.length > 0 ? (
                allArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                  >
                    {/* Thumbnail */}
                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">
                          {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {article.language.toUpperCase()}
                        </span>
                        {!article.published && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                            {t("Utkast", "Draft")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(article.publishedAt).toLocaleDateString("sv-SE")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-2 rounded-full hover:bg-accent transition-colors"
                        title={t("Redigera", "Edit")}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {deleteConfirm === article.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(article.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium hover:bg-red-600 transition-colors"
                          >
                            {t("Bekräfta", "Confirm")}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(article.id)}
                          className="p-2 rounded-full hover:bg-red-50 transition-colors"
                          title={t("Ta bort", "Delete")}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg mb-4">
                    {t("Inga artiklar ännu.", "No articles yet.")}
                  </p>
                  <button
                    onClick={handleNew}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#c05746] text-white rounded-full text-sm font-semibold hover:bg-[#a8483b] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {t("Skapa din första artikel", "Create your first article")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

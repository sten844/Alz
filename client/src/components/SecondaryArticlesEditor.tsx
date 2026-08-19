import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, FileText, ImageIcon, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdownUtils";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

type SecondaryForm = {
  titleSv: string;
  excerptSv: string;
  contentSv: string;
  imageUrl: string;
  sortOrder: number;
  published: boolean;
};

const emptyForm: SecondaryForm = { titleSv: "", excerptSv: "", contentSv: "", imageUrl: "", sortOrder: 0, published: false };
const settingKeys = ["secondary_articles_heading_sv", "secondary_articles_heading_en", "secondary_articles_intro_sv", "secondary_articles_intro_en"];

export default function SecondaryArticlesEditor() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { data: articles, isLoading } = trpc.secondaryArticles.listAll.useQuery();
  const { data: savedSettings } = trpc.settings.getMany.useQuery({ keys: settingKeys });
  const createMutation = trpc.secondaryArticles.create.useMutation();
  const updateMutation = trpc.secondaryArticles.update.useMutation();
  const deleteMutation = trpc.secondaryArticles.delete.useMutation();
  const updateSettingsMutation = trpc.settings.updateMany.useMutation();
  const uploadImageMutation = trpc.upload.image.useMutation();
  const [settings, setSettings] = useState({
    headingSv: "Livet med Alzheimer – tips och tricks",
    headingEn: "Life with Alzheimer's – tips and tricks",
    introSv: "En egen artikelrad för erfarenheter, idéer och nya reflektioner.",
    introEn: "A separate article stream for experiences, ideas and new reflections.",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SecondaryForm>(emptyForm);
  const [contentHtml, setContentHtml] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!savedSettings) return;
    setSettings({
      headingSv: savedSettings.secondary_articles_heading_sv || "Livet med Alzheimer – tips och tricks",
      headingEn: savedSettings.secondary_articles_heading_en || "Life with Alzheimer's – tips and tricks",
      introSv: savedSettings.secondary_articles_intro_sv || "En egen artikelrad för erfarenheter, idéer och nya reflektioner.",
      introEn: savedSettings.secondary_articles_intro_en || "A separate article stream for experiences, ideas and new reflections.",
    });
  }, [savedSettings]);

  const refresh = () => {
    utils.secondaryArticles.list.invalidate();
    utils.secondaryArticles.listAll.invalidate();
    utils.settings.getMany.invalidate();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setContentHtml("");
    setShowForm(false);
  };

  const startNew = () => {
    const nextOrder = articles?.length ? Math.max(...articles.map((article) => article.sortOrder)) + 1 : 1;
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: nextOrder });
    setContentHtml("");
    setShowForm(true);
  };

  const startEdit = (article: any) => {
    setEditingId(article.id);
    setForm({ titleSv: article.titleSv, excerptSv: article.excerptSv || "", contentSv: article.contentSv, imageUrl: article.imageUrl || "", sortOrder: article.sortOrder || 0, published: article.published });
    setContentHtml(markdownToHtml(article.contentSv));
    setShowForm(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const saveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        settings: [
          { key: "secondary_articles_heading_sv", value: settings.headingSv.trim() || "Livet med Alzheimer – tips och tricks" },
          { key: "secondary_articles_heading_en", value: settings.headingEn.trim() || "Life with Alzheimer's – tips and tricks" },
          { key: "secondary_articles_intro_sv", value: settings.introSv.trim() },
          { key: "secondary_articles_intro_en", value: settings.introEn.trim() },
        ],
      });
      refresh();
      toast.success(t("Rubriken har sparats.", "Heading saved."));
    } catch (error: any) {
      toast.error(error.message || t("Kunde inte spara rubriken.", "Could not save heading."));
    }
  };

  const saveArticle = async () => {
    if (!form.titleSv.trim() || !form.contentSv.trim()) {
      toast.error(t("Titel och innehåll krävs.", "A title and content are required."));
      return;
    }
    const data = { ...form, imageUrl: form.imageUrl || null, publishedAt: new Date() };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success(t("Artikeln har sparats.", "Article saved."));
      } else {
        await createMutation.mutateAsync(data);
        toast.success(t("Artikeln har skapats.", "Article created."));
      }
      refresh();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || t("Kunde inte spara artikeln.", "Could not save article."));
    }
  };

  const uploadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("Välj en bildfil.", "Choose an image file."));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("Bilden får vara högst 10 MB.", "The image can be at most 10 MB."));
      return;
    }
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => uploadImageMutation.mutate({ fileName: file.name, fileData: (reader.result as string).split(",")[1], contentType: file.type }, {
      onSuccess: (result) => { setForm((current) => ({ ...current, imageUrl: result.url })); setIsUploading(false); toast.success(t("Bild uppladdad.", "Image uploaded.")); },
      onError: () => { setIsUploading(false); toast.error(t("Kunde inte ladda upp bilden.", "Could not upload image.")); },
    });
    reader.onerror = () => { setIsUploading(false); toast.error(t("Kunde inte läsa bilden.", "Could not read image.")); };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-7">
      <section className="rounded-2xl border border-[#c05746]/20 bg-[#fdf4f1] p-5 md:p-7">
        <div className="flex items-center gap-3"><FileText className="h-6 w-6 text-[#c05746]" /><div><h2 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Livet med Alzheimer – tips och tricks", "Life with Alzheimer's – tips and tricks")}</h2><p className="mt-1 text-muted-foreground">{t("Detta är en helt egen artikelserie. Den visas under huvudartiklarna på startsidan.", "This is a fully independent article series. It appears below the main articles on the home page.")}</p></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block font-semibold">{t("Rubrik på svenska", "Swedish heading")}<input value={settings.headingSv} onChange={(event) => setSettings({ ...settings, headingSv: event.target.value })} className="mt-2 w-full rounded-lg border border-border/50 bg-card px-4 py-3 text-lg" /></label>
          <label className="block font-semibold">{t("Rubrik på engelska", "English heading")}<input value={settings.headingEn} onChange={(event) => setSettings({ ...settings, headingEn: event.target.value })} className="mt-2 w-full rounded-lg border border-border/50 bg-card px-4 py-3 text-lg" /></label>
          <label className="block font-semibold">{t("Kort introduktion på svenska", "Swedish introduction")}<textarea value={settings.introSv} onChange={(event) => setSettings({ ...settings, introSv: event.target.value })} rows={3} className="mt-2 w-full resize-y rounded-lg border border-border/50 bg-card px-4 py-3" /></label>
          <label className="block font-semibold">{t("Kort introduktion på engelska", "English introduction")}<textarea value={settings.introEn} onChange={(event) => setSettings({ ...settings, introEn: event.target.value })} rows={3} className="mt-2 w-full resize-y rounded-lg border border-border/50 bg-card px-4 py-3" /></label>
        </div>
        <button onClick={saveSettings} disabled={updateSettingsMutation.isPending} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c05746] px-5 py-3 font-bold text-white hover:bg-[#a84537] disabled:opacity-50">{updateSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t("Spara rubrikremsan", "Save heading bar")}</button>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-2xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Artiklar i serien", "Articles in the series")}</h3><p className="text-muted-foreground">{t("Spara som utkast tills texten är klar. Publicerade artiklar visas i det nya nätet.", "Save as a draft until the text is ready. Published articles appear in the new grid.")}</p></div><button onClick={startNew} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c05746] px-6 py-3 font-bold text-white hover:bg-[#a84537]"><Plus className="h-5 w-5" />{t("Ny artikel", "New article")}</button></div>

      {showForm && <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm md:p-8"><div className="flex items-center justify-between gap-4"><h3 className="text-2xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{editingId ? t("Redigera artikel", "Edit article") : t("Ny artikel", "New article")}</h3><button onClick={resetForm} className="rounded-full p-2 hover:bg-accent" aria-label={t("Stäng", "Close")}><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-5"><div className="grid gap-4 md:grid-cols-[1fr_180px]"><label className="block font-semibold">{t("Titel", "Title")}<input value={form.titleSv} onChange={(event) => setForm({ ...form, titleSv: event.target.value })} className="mt-2 w-full rounded-lg border border-border/50 bg-background px-4 py-3 text-lg" /></label><label className="block font-semibold">{t("Sorteringsordning", "Sort order")}<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-border/50 bg-background px-4 py-3 text-lg" /></label></div><label className="block font-semibold">{t("Kort sammanfattning", "Short summary")}<textarea value={form.excerptSv} onChange={(event) => setForm({ ...form, excerptSv: event.target.value })} rows={3} className="mt-2 w-full resize-y rounded-lg border border-border/50 bg-background px-4 py-3 text-lg" /></label><div><p className="font-semibold">{t("Innehåll", "Content")}</p><div className="mt-2"><RichTextEditor content={contentHtml} onChange={(html) => { setContentHtml(html); setForm((current) => ({ ...current, contentSv: htmlToMarkdown(html) })); }} placeholder={t("Skriv artikelns innehåll här...", "Write the article content here...")} /></div></div><div><p className="font-semibold">{t("Bild (valfritt)", "Image (optional)")}</p>{form.imageUrl ? <div className="relative mt-2 overflow-hidden rounded-xl border border-border/50"><img src={form.imageUrl} alt="" className="max-h-72 w-full object-cover" /><button onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"><X className="h-5 w-5 text-red-600" /></button></div> : <button type="button" onClick={() => imageInputRef.current?.click()} className="mt-2 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-[#c05746]/30 p-7 text-[#a84537] hover:bg-[#fdf4f1]">{isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-8 w-8" />}<span className="mt-2 font-semibold">{isUploading ? t("Laddar upp...", "Uploading...") : t("Välj en bild", "Choose an image")}</span></button>}<input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadImage(file); event.target.value = ""; }} /></div><label className="flex items-center gap-3 rounded-xl border border-border/50 bg-accent/20 p-4 font-semibold"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-5 w-5 accent-[#c05746]" />{t("Publicera artikeln på webbplatsen", "Publish this article on the website")}</label><div className="flex flex-wrap gap-3"><button onClick={saveArticle} disabled={createMutation.isPending || updateMutation.isPending} className="inline-flex items-center gap-2 rounded-full bg-[#c05746] px-6 py-3 font-bold text-white hover:bg-[#a84537] disabled:opacity-50">{createMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t("Spara", "Save")}</button><button onClick={resetForm} className="rounded-full border border-border/50 px-6 py-3 font-semibold hover:bg-accent">{t("Avbryt", "Cancel")}</button></div></div></section>}

      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-9 w-9 animate-spin text-[#c05746]" /></div> : !articles?.length ? <div className="rounded-xl border border-dashed border-[#c05746]/35 bg-[#fdf4f1] p-8 text-center text-muted-foreground">{t("Inga artiklar ännu.", "No articles yet.")}</div> : <div className="space-y-3">{articles.map((article) => <article key={article.id} className={`flex flex-col gap-4 rounded-xl border p-5 md:flex-row md:items-center md:justify-between ${article.published ? "border-border/50 bg-card" : "border-amber-300 bg-amber-50/50"}`}><div className="min-w-0"><div className="flex items-center gap-2">{article.published ? <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800"><Eye className="h-4 w-4" />{t("Publicerad", "Published")}</span> : <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-700"><EyeOff className="h-4 w-4" />{t("Utkast", "Draft")}</span>}</div><h4 className="mt-2 text-xl font-semibold">{article.titleSv}</h4>{article.excerptSv && <p className="mt-1 text-muted-foreground">{article.excerptSv}</p>}</div><div className="flex shrink-0 items-center gap-2"><button onClick={() => startEdit(article)} className="rounded-full p-3 hover:bg-accent" title={t("Redigera", "Edit")}><Pencil className="h-5 w-5" /></button>{deleteConfirmId === article.id ? <><button onClick={() => deleteMutation.mutate({ id: article.id }, { onSuccess: () => { refresh(); setDeleteConfirmId(null); toast.success(t("Artikeln har tagits bort.", "Article deleted.")); }, onError: () => toast.error(t("Kunde inte ta bort artikeln.", "Could not delete article.")) })} className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white">{t("Ta bort", "Delete")}</button><button onClick={() => setDeleteConfirmId(null)} className="rounded-full border border-border/50 px-4 py-2 font-semibold">{t("Avbryt", "Cancel")}</button></> : <button onClick={() => setDeleteConfirmId(article.id)} className="rounded-full p-3 hover:bg-red-50" title={t("Ta bort", "Delete")}><Trash2 className="h-5 w-5 text-red-500" /></button>}</div></article>)}</div>}
    </div>
  );
}

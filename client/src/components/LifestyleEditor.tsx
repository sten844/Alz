import { useRef, useState } from "react";
import { Eye, EyeOff, ImageIcon, Leaf, Loader2, Pencil, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/RichTextEditor";
import { LIFESTYLE_TOPICS } from "@/lib/lifestyle";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdownUtils";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";

type LifestyleForm = {
  topic: string;
  titleSv: string;
  excerptSv: string;
  contentSv: string;
  imageUrl: string;
  sortOrder: number;
  published: boolean;
};

const emptyForm: LifestyleForm = {
  topic: "mat-och-kost",
  titleSv: "",
  excerptSv: "",
  contentSv: "",
  imageUrl: "",
  sortOrder: 0,
  published: false,
};

export default function LifestyleEditor() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();
  const { data: pages, isLoading } = trpc.lifestyle.listAll.useQuery();
  const createMutation = trpc.lifestyle.create.useMutation();
  const updateMutation = trpc.lifestyle.update.useMutation();
  const deleteMutation = trpc.lifestyle.delete.useMutation();
  const uploadImageMutation = trpc.upload.image.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LifestyleForm>(emptyForm);
  const [contentHtml, setContentHtml] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm);
    setContentHtml("");
  };

  const invalidate = () => {
    utils.lifestyle.listAll.invalidate();
    utils.lifestyle.list.invalidate();
  };

  const handleNew = () => {
    const highestOrder = pages?.length ? Math.max(...pages.map((page) => page.sortOrder)) : 0;
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: highestOrder + 1 });
    setContentHtml("");
    setShowForm(true);
  };

  const handleEdit = (page: any) => {
    setEditingId(page.id);
    setForm({
      topic: page.topic,
      titleSv: page.titleSv,
      excerptSv: page.excerptSv || "",
      contentSv: page.contentSv,
      imageUrl: page.imageUrl || "",
      sortOrder: page.sortOrder || 0,
      published: page.published,
    });
    setContentHtml(markdownToHtml(page.contentSv));
    setShowForm(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleSave = async () => {
    if (!form.titleSv.trim() || !form.contentSv.trim()) {
      toast.error(t("Titel och innehåll krävs.", "A title and content are required."));
      return;
    }

    const data = {
      ...form,
      imageUrl: form.imageUrl || null,
      publishedAt: new Date(),
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
        toast.success(t("Livsstil-sidan har sparats.", "Lifestyle page saved."));
      } else {
        await createMutation.mutateAsync(data);
        toast.success(t("Livsstil-sidan har skapats.", "Lifestyle page created."));
      }
      invalidate();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || t("Kunde inte spara sidan.", "Could not save the page."));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      invalidate();
      setDeleteConfirmId(null);
      toast.success(t("Sidan har tagits bort.", "Page deleted."));
    } catch (error: any) {
      toast.error(error.message || t("Kunde inte ta bort sidan.", "Could not delete the page."));
    }
  };

  const handleImage = (file: File) => {
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
    reader.onload = () => {
      uploadImageMutation.mutate(
        {
          fileName: file.name,
          fileData: (reader.result as string).split(",")[1],
          contentType: file.type,
        },
        {
          onSuccess: (result) => {
            setForm((current) => ({ ...current, imageUrl: result.url }));
            setIsUploading(false);
            toast.success(t("Bild uppladdad.", "Image uploaded."));
          },
          onError: () => {
            setIsUploading(false);
            toast.error(t("Kunde inte ladda upp bilden.", "Could not upload the image."));
          },
        }
      );
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error(t("Kunde inte läsa bilden.", "Could not read the image."));
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-10 w-10 animate-spin text-emerald-800" /></div>;
  }

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-emerald-900/15 bg-emerald-950 p-6 text-white">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-100">
              <Leaf className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-wider">{t("Egen innehållsdel", "Dedicated content section")}</span>
            </div>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Livsstil vid Alzheimer", "Lifestyle and Alzheimer's")}</h2>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-emerald-50/85">
              {t("Skapa sidor som utkast först och publicera dem när de är genomlästa och färdiga.", "Create pages as drafts first and publish them once they are reviewed and ready.")}
            </p>
          </div>
          <button onClick={handleNew} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-amber-200 px-6 py-3 font-semibold text-emerald-950 hover:bg-amber-100">
            <Plus className="h-5 w-5" /> {t("Ny sida", "New page")}
          </button>
        </div>
      </div>

      {showForm && (
        <section className="rounded-2xl border border-emerald-900/20 bg-card p-5 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-2xl text-emerald-950" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {editingId ? t("Redigera Livsstil-sida", "Edit Lifestyle page") : t("Ny Livsstil-sida", "New Lifestyle page")}
            </h3>
            <button onClick={resetForm} className="rounded-full p-2 hover:bg-accent" aria-label={t("Stäng", "Close")}><X className="h-5 w-5" /></button>
          </div>

          <div className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-base font-semibold text-foreground">
                {t("Ämnesflik", "Topic tab")}
                <select value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} className="mt-2 w-full rounded-lg border border-border/50 bg-background px-4 py-3 text-lg">
                  {LIFESTYLE_TOPICS.map((topic) => <option key={topic.key} value={topic.key}>{topic.sv}</option>)}
                </select>
              </label>
              <label className="block text-base font-semibold text-foreground">
                {t("Sorteringsordning", "Sort order")}
                <input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="mt-2 w-full rounded-lg border border-border/50 bg-background px-4 py-3 text-lg" />
              </label>
            </div>

            <label className="block text-base font-semibold text-foreground">
              {t("Titel", "Title")}
              <input value={form.titleSv} onChange={(event) => setForm({ ...form, titleSv: event.target.value })} placeholder={t("Till exempel: Medelhavskost i praktiken", "For example: Mediterranean diet in practice")} className="mt-2 w-full rounded-lg border border-border/50 bg-background px-4 py-3 text-lg" />
            </label>

            <label className="block text-base font-semibold text-foreground">
              {t("Kort sammanfattning", "Short summary")}
              <textarea value={form.excerptSv} onChange={(event) => setForm({ ...form, excerptSv: event.target.value })} rows={3} placeholder={t("En kort introduktion som syns på ämnessidan.", "A short introduction shown on the topic page.")} className="mt-2 w-full resize-y rounded-lg border border-border/50 bg-background px-4 py-3 text-lg" />
            </label>

            <div>
              <p className="text-base font-semibold text-foreground">{t("Innehåll", "Content")}</p>
              <div className="mt-2"><RichTextEditor content={contentHtml} onChange={(html) => { setContentHtml(html); setForm((current) => ({ ...current, contentSv: htmlToMarkdown(html) })); }} placeholder={t("Skriv sidans innehåll här...", "Write the page content here...")} /></div>
            </div>

            <div>
              <p className="text-base font-semibold text-foreground">{t("Bild (valfritt)", "Image (optional)")}</p>
              {form.imageUrl ? (
                <div className="relative mt-2 overflow-hidden rounded-xl border border-border/50"><img src={form.imageUrl} alt="" className="max-h-72 w-full object-cover" /><button onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute right-3 top-3 rounded-full bg-white p-2 shadow" aria-label={t("Ta bort bild", "Remove image")}><X className="h-5 w-5 text-red-600" /></button></div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-emerald-900/20 p-7 text-emerald-900 hover:bg-emerald-50/50">
                  {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <ImageIcon className="h-8 w-8" />}
                  <span className="mt-2 font-semibold">{isUploading ? t("Laddar upp...", "Uploading...") : t("Välj en bild", "Choose an image")}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleImage(file); event.target.value = ""; }} />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border/50 bg-accent/20 p-4 text-base font-semibold">
              <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-5 w-5 accent-emerald-800" />
              {t("Publicera sidan så att besökare kan läsa den", "Publish this page so visitors can read it")}
            </label>

            <div className="flex flex-wrap gap-3">
              <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-emerald-900 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t("Spara", "Save")}
              </button>
              <button onClick={resetForm} className="rounded-full border border-border/50 bg-card px-6 py-3 font-semibold hover:bg-accent">{t("Avbryt", "Cancel")}</button>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h3 className="text-2xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Dina sidor", "Your pages")}</h3>
        {!pages?.length ? (
          <div className="rounded-2xl border border-dashed border-emerald-900/20 bg-emerald-50/30 p-8 text-center text-muted-foreground">
            {t("Inga sidor ännu. Börja med en sida som utkast.", "No pages yet. Start with a draft page.")}
          </div>
        ) : pages.map((page) => {
          const topic = LIFESTYLE_TOPICS.find((item) => item.key === page.topic);
          return (
            <article key={page.id} className={`flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between ${page.published ? "border-border/50 bg-card" : "border-amber-300 bg-amber-50/50"}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-800">{topic?.sv ?? page.topic}</span>{page.published ? <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"><Eye className="h-4 w-4" /> {t("Publicerad", "Published")}</span> : <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700"><EyeOff className="h-4 w-4" /> {t("Utkast", "Draft")}</span>}</div>
                <h4 className="mt-2 text-xl font-semibold text-foreground">{page.titleSv}</h4>
                {page.excerptSv && <p className="mt-1 text-base text-muted-foreground">{page.excerptSv}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2"><button onClick={() => handleEdit(page)} className="rounded-full p-3 hover:bg-accent" title={t("Redigera", "Edit")}><Pencil className="h-5 w-5" /></button>{deleteConfirmId === page.id ? <><button onClick={() => handleDelete(page.id)} className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white">{t("Ta bort", "Delete")}</button><button onClick={() => setDeleteConfirmId(null)} className="rounded-full border border-border/50 px-4 py-2 font-semibold">{t("Avbryt", "Cancel")}</button></> : <button onClick={() => setDeleteConfirmId(page.id)} className="rounded-full p-3 hover:bg-red-50" title={t("Ta bort", "Delete")}><Trash2 className="h-5 w-5 text-red-500" /></button>}</div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

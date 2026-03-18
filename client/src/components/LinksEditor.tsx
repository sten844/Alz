import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  ExternalLink,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

type LinkForm = {
  category: string;
  nameSv: string;
  nameEn: string;
  descSv: string;
  descEn: string;
  url: string;
  sortOrder: number;
  visible: boolean;
};

const emptyLinkForm: LinkForm = {
  category: "swedish",
  nameSv: "",
  nameEn: "",
  descSv: "",
  descEn: "",
  url: "",
  sortOrder: 0,
  visible: true,
};

export default function LinksEditor() {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LinkForm>({ ...emptyLinkForm });

  const { data: links, isLoading } = trpc.resourceLinks.listAll.useQuery();
  const createMutation = trpc.resourceLinks.create.useMutation();
  const updateMutation = trpc.resourceLinks.update.useMutation();
  const deleteMutation = trpc.resourceLinks.delete.useMutation();
  const utils = trpc.useUtils();

  const swedishLinks = links?.filter((l: any) => l.category === "swedish") ?? [];
  const internationalLinks = links?.filter((l: any) => l.category === "international") ?? [];

  const handleEdit = (link: any) => {
    setForm({
      category: link.category,
      nameSv: link.nameSv,
      nameEn: link.nameEn,
      descSv: link.descSv,
      descEn: link.descEn,
      url: link.url,
      sortOrder: link.sortOrder,
      visible: link.visible,
    });
    setEditingId(link.id);
    setShowForm(true);
  };

  const handleNew = () => {
    setForm({ ...emptyLinkForm });
    setEditingId(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyLinkForm });
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form });
        toast.success(t("Länk uppdaterad!", "Link updated!"));
      } else {
        await createMutation.mutateAsync(form);
        toast.success(t("Länk skapad!", "Link created!"));
      }
      utils.resourceLinks.listAll.invalidate();
      utils.resourceLinks.list.invalidate();
      handleCancel();
    } catch (error) {
      toast.error(t("Kunde inte spara", "Failed to save"));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("Vill du verkligen ta bort denna länk?", "Are you sure you want to delete this link?"))) return;
    try {
      await deleteMutation.mutateAsync({ id });
      utils.resourceLinks.listAll.invalidate();
      utils.resourceLinks.list.invalidate();
      toast.success(t("Länk borttagen!", "Link deleted!"));
    } catch (error) {
      toast.error(t("Kunde inte ta bort", "Failed to delete"));
    }
  };

  const handleToggleVisibility = async (link: any) => {
    try {
      await updateMutation.mutateAsync({ id: link.id, visible: !link.visible });
      utils.resourceLinks.listAll.invalidate();
      utils.resourceLinks.list.invalidate();
      toast.success(link.visible
        ? t("Länk dold", "Link hidden")
        : t("Länk synlig", "Link visible"));
    } catch (error) {
      toast.error(t("Kunde inte uppdatera", "Failed to update"));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-10 h-10 animate-spin text-[#c05746]" /></div>;
  }

  const renderLinkRow = (link: any) => (
    <div
      key={link.id}
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
        link.visible ? "bg-card border-border/50" : "bg-muted/50 border-border/30 opacity-70"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-foreground truncate">{link.nameSv}</span>
          {!link.visible && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
              {t("Dold", "Hidden")}
            </span>
          )}
        </div>
        <p className="text-base text-muted-foreground truncate">{link.descSv}</p>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#c05746] hover:underline inline-flex items-center gap-1 mt-1"
        >
          {link.url} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => handleToggleVisibility(link)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title={link.visible ? t("Dölj", "Hide") : t("Visa", "Show")}
        >
          {link.visible ? <Eye className="w-5 h-5 text-emerald-600" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
        </button>
        <button
          onClick={() => handleEdit(link)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Pencil className="w-5 h-5 text-blue-600" />
        </button>
        <button
          onClick={() => handleDelete(link.id)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("Redigera Länkar", "Edit Links")}
        </h2>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          {t("Ny länk", "New link")}
        </button>
      </div>

      {/* Link form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="text-xl font-semibold text-foreground">
            {editingId ? t("Redigera länk", "Edit link") : t("Ny länk", "New link")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                {t("Kategori", "Category")}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg"
              >
                <option value="swedish">{t("Svenska resurser", "Swedish resources")}</option>
                <option value="international">{t("Internationella resurser", "International resources")}</option>
              </select>
            </div>
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                {t("Sorteringsordning", "Sort order")}
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                {t("Namn (svenska)", "Name (Swedish)")}
              </label>
              <input
                type="text"
                value={form.nameSv}
                onChange={(e) => setForm({ ...form, nameSv: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg"
                placeholder="Alzheimer Sverige"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                {t("Namn (engelska)", "Name (English)")}
              </label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg"
                placeholder="Alzheimer Sweden"
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-medium text-foreground mb-1">
              URL
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg"
              placeholder="https://www.example.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                {t("Beskrivning (svenska)", "Description (Swedish)")}
              </label>
              <textarea
                value={form.descSv}
                onChange={(e) => setForm({ ...form, descSv: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg resize-y"
                placeholder={t("Kort beskrivning av resursen...", "Short description of the resource...")}
              />
            </div>
            <div>
              <label className="block text-base font-medium text-foreground mb-1">
                {t("Beskrivning (engelska)", "Description (English)")}
              </label>
              <textarea
                value={form.descEn}
                onChange={(e) => setForm({ ...form, descEn: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-lg resize-y"
                placeholder="Short description of the resource..."
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                className="w-5 h-5 rounded"
              />
              <span className="text-base text-foreground">{t("Synlig", "Visible")}</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#c05746] text-white rounded-full text-lg font-semibold hover:bg-[#a8483b] transition-colors shadow-md disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {t("Spara", "Save")}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-8 py-3 bg-card text-foreground rounded-full text-lg font-medium border border-border/50 hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
              {t("Avbryt", "Cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Swedish links */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          {t("Svenska resurser", "Swedish resources")} ({swedishLinks.length})
        </h3>
        <div className="space-y-3">
          {swedishLinks.map(renderLinkRow)}
          {swedishLinks.length === 0 && (
            <p className="text-muted-foreground text-lg py-4">{t("Inga svenska länkar ännu.", "No Swedish links yet.")}</p>
          )}
        </div>
      </div>

      {/* International links */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          {t("Internationella resurser", "International resources")} ({internationalLinks.length})
        </h3>
        <div className="space-y-3">
          {internationalLinks.map(renderLinkRow)}
          {internationalLinks.length === 0 && (
            <p className="text-muted-foreground text-lg py-4">{t("Inga internationella länkar ännu.", "No international links yet.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

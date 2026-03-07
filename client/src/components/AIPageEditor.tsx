import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  Pencil,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ExternalLink,
  GripVertical,
} from "lucide-react";

type AiItemForm = {
  nameSv: string;
  nameEn: string;
  descSv: string;
  descEn: string;
  url: string;
  linkTextSv: string;
  linkTextEn: string;
  iconName: string;
  sortOrder: number;
  visible: boolean;
};

const emptyItemForm: AiItemForm = {
  nameSv: "",
  nameEn: "",
  descSv: "",
  descEn: "",
  url: "",
  linkTextSv: "",
  linkTextEn: "",
  iconName: "",
  sortOrder: 0,
  visible: true,
};

// Section display names
const sectionNames: Record<string, { sv: string; en: string }> = {
  cognitive_help: { sv: "AI som hjälpmedel", en: "AI as an aid" },
  tools: { sv: "Verktyg att testa", en: "Tools to try" },
  spectacular: { sv: "Det spektakulära", en: "The spectacular" },
  already_use: { sv: "AI du redan använder", en: "AI you already use" },
  useful_links: { sv: "Användbara länkar", en: "Useful links" },
};

export default function AIPageEditor() {
  const { t } = useLanguage();
  const utils = trpc.useUtils();

  const { data: sections, isLoading } = trpc.aiPage.getSections.useQuery();
  const updateSectionMutation = trpc.aiPage.updateSection.useMutation();
  const createItemMutation = trpc.aiPage.createItem.useMutation();
  const updateItemMutation = trpc.aiPage.updateItem.useMutation();
  const deleteItemMutation = trpc.aiPage.deleteItem.useMutation();

  // Which section is expanded
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  // Editing section titles
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState<{
    titleSv: string; titleEn: string; subtitleSv: string; subtitleEn: string;
  }>({ titleSv: "", titleEn: "", subtitleSv: "", subtitleEn: "" });

  // Editing/creating items
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [showNewItemForm, setShowNewItemForm] = useState<string | null>(null); // sectionKey
  const [itemForm, setItemForm] = useState<AiItemForm>(emptyItemForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Saving states
  const [savingSection, setSavingSection] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-muted-foreground mb-4">
          {t("AI-sidan har inga sektioner ännu.", "AI page has no sections yet.")}
        </p>
        <p className="text-lg text-muted-foreground">
          {t("Innehållet behöver laddas in först.", "Content needs to be loaded first.")}
        </p>
      </div>
    );
  }

  const handleEditSection = (section: any) => {
    setEditingSectionKey(section.sectionKey);
    setSectionForm({
      titleSv: section.titleSv || "",
      titleEn: section.titleEn || "",
      subtitleSv: section.subtitleSv || "",
      subtitleEn: section.subtitleEn || "",
    });
  };

  const handleSaveSection = async (sectionKey: string) => {
    setSavingSection(true);
    try {
      await updateSectionMutation.mutateAsync({
        sectionKey,
        ...sectionForm,
      });
      utils.aiPage.getSections.invalidate();
      setEditingSectionKey(null);
      toast.success(t("Sektion sparad!", "Section saved!"));
    } catch (error) {
      toast.error(t("Kunde inte spara", "Failed to save"));
    } finally {
      setSavingSection(false);
    }
  };

  const handleToggleSectionVisibility = async (section: any) => {
    try {
      await updateSectionMutation.mutateAsync({
        sectionKey: section.sectionKey,
        visible: !section.visible,
      });
      utils.aiPage.getSections.invalidate();
      toast.success(section.visible
        ? t("Sektion dold", "Section hidden")
        : t("Sektion visas", "Section visible"));
    } catch (error) {
      toast.error(t("Kunde inte uppdatera", "Failed to update"));
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setShowNewItemForm(null);
    setItemForm({
      nameSv: item.nameSv || "",
      nameEn: item.nameEn || "",
      descSv: item.descSv || "",
      descEn: item.descEn || "",
      url: item.url || "",
      linkTextSv: item.linkTextSv || "",
      linkTextEn: item.linkTextEn || "",
      iconName: item.iconName || "",
      sortOrder: item.sortOrder || 0,
      visible: item.visible !== false,
    });
  };

  const handleNewItem = (sectionKey: string) => {
    setShowNewItemForm(sectionKey);
    setEditingItemId(null);
    // Set sort order to be after the last item in this section
    const sectionItems = sections?.find(s => s.sectionKey === sectionKey)?.items || [];
    const maxSort = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.sortOrder)) : 0;
    setItemForm({ ...emptyItemForm, sortOrder: maxSort + 1 });
  };

  const handleSaveItem = async (sectionKey: string) => {
    setSavingItem(true);
    try {
      if (editingItemId) {
        await updateItemMutation.mutateAsync({
          id: editingItemId,
          ...itemForm,
        });
        toast.success(t("Kort uppdaterat!", "Card updated!"));
      } else {
        await createItemMutation.mutateAsync({
          sectionKey,
          ...itemForm,
        });
        toast.success(t("Nytt kort skapat!", "New card created!"));
      }
      utils.aiPage.getSections.invalidate();
      setEditingItemId(null);
      setShowNewItemForm(null);
      setItemForm(emptyItemForm);
    } catch (error) {
      toast.error(t("Kunde inte spara", "Failed to save"));
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteItemMutation.mutateAsync({ id });
      utils.aiPage.getSections.invalidate();
      setDeleteConfirmId(null);
      toast.success(t("Kort borttaget!", "Card deleted!"));
    } catch (error) {
      toast.error(t("Kunde inte ta bort", "Failed to delete"));
    }
  };

  const handleToggleItemVisibility = async (item: any) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        visible: !item.visible,
      });
      utils.aiPage.getSections.invalidate();
    } catch (error) {
      toast.error(t("Kunde inte uppdatera", "Failed to update"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">
          {t("Redigera AI-sidan", "Edit AI page")}
        </h2>
      </div>

      <p className="text-lg text-muted-foreground">
        {t(
          "Klicka på en sektion för att se och redigera dess kort. Du kan ändra texter, lägga till nya kort och ta bort kort.",
          "Click a section to see and edit its cards. You can change texts, add new cards and remove cards."
        )}
      </p>

      {sections.map((section) => (
        <div
          key={section.sectionKey}
          className={`bg-card rounded-2xl border shadow-sm overflow-hidden ${
            section.visible ? "border-border/50" : "border-amber-300 opacity-70"
          }`}
        >
          {/* Section header */}
          <div
            className="flex items-center gap-3 p-5 cursor-pointer hover:bg-accent/30 transition-colors"
            onClick={() => setExpandedSection(
              expandedSection === section.sectionKey ? null : section.sectionKey
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-foreground truncate">
                  {t(section.titleSv, section.titleEn)}
                </h3>
                {!section.visible && (
                  <span className="text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {t("Dold", "Hidden")}
                  </span>
                )}
              </div>
              <p className="text-base text-muted-foreground mt-1">
                {section.items.length} {t("kort", "cards")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleSectionVisibility(section); }}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title={section.visible ? t("Dölj sektion", "Hide section") : t("Visa sektion", "Show section")}
              >
                {section.visible ? <Eye className="w-5 h-5 text-muted-foreground" /> : <EyeOff className="w-5 h-5 text-amber-500" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleEditSection(section); }}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title={t("Redigera rubrik", "Edit title")}
              >
                <Pencil className="w-5 h-5 text-muted-foreground" />
              </button>
              {expandedSection === section.sectionKey
                ? <ChevronUp className="w-6 h-6 text-muted-foreground" />
                : <ChevronDown className="w-6 h-6 text-muted-foreground" />
              }
            </div>
          </div>

          {/* Section title editor */}
          {editingSectionKey === section.sectionKey && (
            <div className="border-t border-border/50 p-5 bg-accent/20">
              <h4 className="text-lg font-semibold mb-4">{t("Redigera sektionsrubriker", "Edit section titles")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium mb-1">{t("Rubrik (svenska)", "Title (Swedish)")}</label>
                  <input
                    type="text"
                    value={sectionForm.titleSv}
                    onChange={(e) => setSectionForm({ ...sectionForm, titleSv: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">{t("Rubrik (engelska)", "Title (English)")}</label>
                  <input
                    type="text"
                    value={sectionForm.titleEn}
                    onChange={(e) => setSectionForm({ ...sectionForm, titleEn: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">{t("Underrubrik (svenska)", "Subtitle (Swedish)")}</label>
                  <input
                    type="text"
                    value={sectionForm.subtitleSv}
                    onChange={(e) => setSectionForm({ ...sectionForm, subtitleSv: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-1">{t("Underrubrik (engelska)", "Subtitle (English)")}</label>
                  <input
                    type="text"
                    value={sectionForm.subtitleEn}
                    onChange={(e) => setSectionForm({ ...sectionForm, subtitleEn: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleSaveSection(section.sectionKey)}
                  disabled={savingSection}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#c05746] text-white rounded-full text-base font-semibold hover:bg-[#a8483b] transition-colors disabled:opacity-50"
                >
                  {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t("Spara", "Save")}
                </button>
                <button
                  onClick={() => setEditingSectionKey(null)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-card text-foreground rounded-full text-base font-semibold border border-border/50 hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("Avbryt", "Cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Expanded section: list items */}
          {expandedSection === section.sectionKey && (
            <div className="border-t border-border/50 p-5 space-y-4">
              {/* Add new item button */}
              <button
                onClick={() => handleNewItem(section.sectionKey)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-full text-base font-semibold hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t("Lägg till nytt kort", "Add new card")}
              </button>

              {/* New item form */}
              {showNewItemForm === section.sectionKey && (
                <ItemFormCard
                  form={itemForm}
                  setForm={setItemForm}
                  onSave={() => handleSaveItem(section.sectionKey)}
                  onCancel={() => { setShowNewItemForm(null); setItemForm(emptyItemForm); }}
                  saving={savingItem}
                  isNew={true}
                  t={t}
                />
              )}

              {/* Existing items */}
              {section.items.length === 0 && !showNewItemForm && (
                <p className="text-muted-foreground text-base py-4">
                  {t("Inga kort i denna sektion.", "No cards in this section.")}
                </p>
              )}

              {section.items.map((item: any) => (
                <div key={item.id}>
                  {editingItemId === item.id ? (
                    <ItemFormCard
                      form={itemForm}
                      setForm={setItemForm}
                      onSave={() => handleSaveItem(section.sectionKey)}
                      onCancel={() => { setEditingItemId(null); setItemForm(emptyItemForm); }}
                      saving={savingItem}
                      isNew={false}
                      t={t}
                    />
                  ) : (
                    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                      item.visible ? "border-border/50 bg-background" : "border-amber-200 bg-amber-50/50 opacity-70"
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-foreground">{item.nameSv}</h4>
                          {!item.visible && (
                            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                              {t("Dold", "Hidden")}
                            </span>
                          )}
                        </div>
                        <p className="text-base text-muted-foreground mt-0.5">{item.descSv}</p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#c05746] hover:underline mt-1"
                        >
                          {item.url} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleItemVisibility(item)}
                          className="p-2 rounded-lg hover:bg-accent transition-colors"
                          title={item.visible ? t("Dölj", "Hide") : t("Visa", "Show")}
                        >
                          {item.visible ? <Eye className="w-5 h-5 text-muted-foreground" /> : <EyeOff className="w-5 h-5 text-amber-500" />}
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 rounded-lg hover:bg-accent transition-colors"
                          title={t("Redigera", "Edit")}
                        >
                          <Pencil className="w-5 h-5 text-muted-foreground" />
                        </button>
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                              {t("Ja, ta bort", "Yes, delete")}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 bg-card text-foreground rounded-lg text-sm font-medium border border-border/50 hover:bg-accent"
                            >
                              {t("Nej", "No")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title={t("Ta bort", "Delete")}
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Reusable item form card
function ItemFormCard({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  isNew,
  t,
}: {
  form: AiItemForm;
  setForm: (f: AiItemForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
  t: (sv: string, en: string) => string;
}) {
  return (
    <div className="bg-accent/20 rounded-xl border border-[#c05746]/30 p-5 space-y-4">
      <h4 className="text-lg font-semibold text-foreground">
        {isNew ? t("Nytt kort", "New card") : t("Redigera kort", "Edit card")}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium mb-1">{t("Namn (svenska)", "Name (Swedish)")}</label>
          <input
            type="text"
            value={form.nameSv}
            onChange={(e) => setForm({ ...form, nameSv: e.target.value })}
            placeholder="t.ex. ChatGPT"
            className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
          />
        </div>
        <div>
          <label className="block text-base font-medium mb-1">{t("Namn (engelska)", "Name (English)")}</label>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            placeholder="e.g. ChatGPT"
            className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium mb-1">{t("Beskrivning (svenska)", "Description (Swedish)")}</label>
          <textarea
            value={form.descSv}
            onChange={(e) => setForm({ ...form, descSv: e.target.value })}
            placeholder={t("Kort beskrivning...", "Short description...")}
            rows={2}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-y"
          />
        </div>
        <div>
          <label className="block text-base font-medium mb-1">{t("Beskrivning (engelska)", "Description (English)")}</label>
          <textarea
            value={form.descEn}
            onChange={(e) => setForm({ ...form, descEn: e.target.value })}
            placeholder="Short description..."
            rows={2}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 resize-y"
          />
        </div>
      </div>

      <div>
        <label className="block text-base font-medium mb-1">{t("Länk (URL)", "Link (URL)")}</label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-base font-medium mb-1">{t("Länktext (svenska)", "Link text (Swedish)")}</label>
          <input
            type="text"
            value={form.linkTextSv}
            onChange={(e) => setForm({ ...form, linkTextSv: e.target.value })}
            placeholder={t("t.ex. Prova ChatGPT", "e.g. Try ChatGPT")}
            className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
          />
        </div>
        <div>
          <label className="block text-base font-medium mb-1">{t("Länktext (engelska)", "Link text (English)")}</label>
          <input
            type="text"
            value={form.linkTextEn}
            onChange={(e) => setForm({ ...form, linkTextEn: e.target.value })}
            placeholder="e.g. Try ChatGPT"
            className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 text-lg focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.visible}
            onChange={(e) => setForm({ ...form, visible: e.target.checked })}
            className="w-5 h-5 rounded border-border accent-[#c05746]"
          />
          <span className="text-base">{t("Synlig", "Visible")}</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !form.nameSv || !form.descSv || !form.url}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#c05746] text-white rounded-full text-base font-semibold hover:bg-[#a8483b] transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t("Spara", "Save")}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 px-6 py-3 bg-card text-foreground rounded-full text-base font-semibold border border-border/50 hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4" />
          {t("Avbryt", "Cancel")}
        </button>
      </div>
    </div>
  );
}

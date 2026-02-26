/**
 * Nordic Warmth Design: Home Page
 * - Warm watercolor hero background
 * - Editorial article listing
 * - Category filter pills
 * - AI section, newsletter, comments, X feed
 */
import { useState, useMemo } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleCard from "@/components/ArticleCard";
import { articles, categories, categoriesEn, IMAGES } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, ChevronLeft, ChevronRight, ExternalLink, MessageCircle, Rss } from "lucide-react";
import { Link } from "wouter";

const ARTICLES_PER_PAGE = 4;

export default function Home() {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("Alla");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredArticles = useMemo(() => {
    let filtered = articles.filter((a) => a.language === language);

    if (activeCategory !== "Alla" && activeCategory !== "All") {
      filtered = filtered.filter((a) => a.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q)
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }, [language, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const displayCategories = language === "sv" ? categories : categoriesEn;
  // Map English categories back to Swedish for filtering
  const categoryMap: Record<string, string> = {
    All: "Alla",
    Treatment: "Behandling",
    Research: "Forskning",
    "Daily Life": "Vardagsliv",
    Medication: "Läkemedel",
    Opinion: "Åsikt",
  };

  const handleCategoryClick = (cat: string) => {
    const mapped = language === "en" ? (categoryMap[cat] || cat) : cat;
    setActiveCategory(mapped);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Category filters + Search */}
        <section className="container py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {displayCategories.map((cat) => {
                const mappedCat = language === "en" ? (categoryMap[cat] || cat) : cat;
                const isActive = mappedCat === activeCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#c05746] text-white shadow-md"
                        : "bg-card text-muted-foreground hover:bg-accent border border-border/50"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("Sök artiklar...", "Search articles...")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-card border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 focus:border-[#c05746]/50 transition-all"
              />
            </div>
          </div>

          {/* Articles list */}
          <div className="space-y-5">
            {paginatedArticles.length > 0 ? (
              paginatedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg">
                  {t("Inga artiklar hittades.", "No articles found.")}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("Föregående", "Previous")}
              </button>
              <span className="text-sm text-muted-foreground">
                {t("Sida", "Page")} {currentPage} {t("av", "of")} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium bg-card border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t("Nästa", "Next")}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* Extra sections */}
        <section className="container pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Section */}
            <div className="relative rounded-xl overflow-hidden shadow-md group">
              <img
                src={IMAGES.aiSectionBg}
                alt="AI"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl text-white mb-2">
                  {t("AI långt bortom Google", "AI far beyond Google")}
                </h3>
                <p className="text-slate-200 text-sm mb-4 leading-relaxed">
                  {t(
                    "Som alzheimerdrabbad behöver jag modern teknik. Här presenterar jag AI och ger lite exempel på tillämpningar.",
                    "As someone affected by Alzheimer's, I need modern technology. Here I present AI and give some examples of applications."
                  )}
                </p>
                <a
                  href="https://aiundersajt-h4ruqvxt.manus.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 text-slate-800 rounded-full text-sm font-semibold hover:bg-white transition-colors"
                >
                  {t("Utforska AI-världen", "Explore the AI world")}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#c05746]/10 flex items-center justify-center">
                    <Rss className="w-5 h-5 text-[#c05746]" />
                  </div>
                  <h3 className="text-2xl text-foreground">
                    {t("Få nya artiklar i din inkorg", "Get new articles in your inbox")}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {t(
                    "Prenumerera för att få notiser när nya artiklar publiceras.",
                    "Subscribe to get notifications when new articles are published."
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t("Din email-adress", "Your email address")}
                  className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#c05746]/30"
                />
                <button className="px-6 py-2.5 bg-[#c05746] text-white rounded-full text-sm font-semibold hover:bg-[#a84838] transition-colors shadow-md">
                  {t("Prenumerera", "Subscribe")}
                </button>
              </div>
            </div>

            {/* Comments / Discussion */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-2xl text-foreground">
                  {t("Kommentarer och diskussion", "Comments and discussion")}
                </h3>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {t(
                  "Dela dina tankar, ställ frågor eller diskutera artiklar.",
                  "Share your thoughts, ask questions, or discuss articles."
                )}
              </p>
              <a
                href="https://jagochminalzheimer.manus.space/comments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#c05746] font-semibold text-sm hover:underline"
              >
                {t("Gå till diskussionen", "Go to the discussion")}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Follow on X */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <h3 className="text-2xl text-foreground">
                  {t("Följ mig på X", "Follow me on X")}
                </h3>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {t(
                  "Jag skriver om mitt nya liv med Alzheimers på X (Twitter).",
                  "I write about my new life with Alzheimer's on X (Twitter)."
                )}
              </p>
              <a
                href="https://x.com/stendellby"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#c05746] font-semibold text-sm hover:underline"
              >
                {t("Ta mig till X", "Take me to X")}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* About link */}
        <section className="bg-accent/50 py-10">
          <div className="container text-center">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-lg font-semibold text-foreground hover:text-[#c05746] transition-colors"
            >
              {t(
                "Om mig och detta försök till kunskapsbank för oss med diagnos",
                "About me and this attempt at a knowledge base for those of us with a diagnosis"
              )}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

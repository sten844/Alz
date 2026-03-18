/**
 * Nordic Warmth Design: Home Page
 * - Fetches articles from database via tRPC
 * - Editorial article listing with category filter, search, pagination
 * - Diary column sidebar on desktop/iPad (left side)
 * - Diary section below articles on mobile
 * - Newsletter, comments, X feed
 */
import { useState, useMemo, useEffect, useRef } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleCard from "@/components/ArticleCard";
import DiaryColumn from "@/components/DiaryColumn";
import { categories, categoriesEn, IMAGES } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Search, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";

const ARTICLES_PER_PAGE = 4;

export default function Home() {
  // Reload Twitter widget when component mounts (SPA navigation)
  useEffect(() => {
    if ((window as any).twttr?.widgets) {
      (window as any).twttr.widgets.load();
    }
  }, []);

  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("Alla");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch articles from database
  const { data: dbArticles, isLoading } = trpc.articles.list.useQuery({
    language,
    published: true,
  });

  // Fetch site settings for comments visibility
  const { data: commentsSettingValue } = trpc.settings.get.useQuery({ key: "comments_enabled" });
  const commentsEnabled = commentsSettingValue === "true";

  const filteredArticles = useMemo(() => {
    if (!dbArticles) return [];
    let filtered = [...dbArticles];

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
  }, [dbArticles, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ARTICLES_PER_PAGE,
    currentPage * ARTICLES_PER_PAGE
  );

  const displayCategories = language === "sv" ? categories : categoriesEn;
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

  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "exists" | "error">("idle");
  const subscribeMutation = trpc.subscribers.subscribe.useMutation({
    onSuccess: (data) => {
      setSubscribeStatus(data.alreadyExists ? "exists" : "success");
      setSubscribeEmail("");
      setTimeout(() => setSubscribeStatus("idle"), 5000);
    },
    onError: () => {
      setSubscribeStatus("error");
      setTimeout(() => setSubscribeStatus("idle"), 5000);
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Main content area: Headings row + Diary sidebar + Articles */}
        <section className="container py-2 sm:py-4">
          {/* Desktop: Both headings on same row */}
          <div className="hidden lg:flex gap-8 mb-4">
            <div className="w-80 xl:w-96 shrink-0">
              <h2
                className="text-3xl text-foreground font-bold"
                style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
              >
                {t("Min dagbok", "My diary")}
              </h2>
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-3xl md:text-4xl text-foreground"
                style={{ fontFamily: "'DM Serif Display', serif" }}
              >
                {t("Försök till en kunskapsbank", "Notes towards a knowledge base")}
              </h2>
            </div>
          </div>

          {/* Mobile: Only show "Kunskapsbank" heading */}
          <section className="lg:hidden pt-3 sm:pt-4 pb-1 sm:pb-2">
            <h2
              className="text-xl sm:text-2xl text-foreground"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              {t("Försök till en kunskapsbank", "Notes towards a knowledge base")}
            </h2>
          </section>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Diary sidebar - visible on lg+ screens */}
            <aside className="hidden lg:block w-80 xl:w-96 shrink-0">
              <div className="sticky top-8 bg-card/50 rounded-2xl border border-border/30 p-5 shadow-sm backdrop-blur-sm">
                <DiaryColumn hideHeader maxEntries={2} showArchiveLink />
              </div>
            </aside>

            {/* Right: Articles (main content) */}
            <div className="flex-1 min-w-0">
              {/* Category filters + Search */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex flex-wrap gap-1.5">
                  {displayCategories.map((cat) => {
                    const mappedCat = language === "en" ? (categoryMap[cat] || cat) : cat;
                    const isActive = mappedCat === activeCategory;
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`px-5 py-2.5 rounded-full text-base font-medium transition-all ${
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
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-card border border-border/50 text-base focus:outline-none focus:ring-2 focus:ring-[#c05746]/30 focus:border-[#c05746]/50 transition-all"
                  />
                </div>
              </div>

              {/* Articles list */}
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
                  </div>
                ) : paginatedArticles.length > 0 ? (
                  paginatedArticles.map((article) => (
                    <ArticleCard key={article.id} article={{
                      id: article.id,
                      title: article.title,
                      excerpt: article.excerpt,
                      content: article.content,
                      category: article.category,
                      language: article.language,
                      imageUrl: article.imageUrl,
                      publishedAt: new Date(article.publishedAt).toISOString(),
                    }} />
                  ))
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-xl">
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
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-base font-medium bg-card border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t("Föregående", "Previous")}
                  </button>
                  <span className="text-base text-muted-foreground">
                    {t("Sida", "Page")} {currentPage} {t("av", "of")} {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-base font-medium bg-card border border-border/50 hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {t("Nästa", "Next")}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Mobile diary section - BELOW articles, only visible on smaller screens */}
        <section className="lg:hidden container pt-4 pb-6">
          <div className="bg-card/50 rounded-xl border border-border/30 p-3 shadow-sm">
            <h2
              className="text-xl text-foreground mb-2 pb-2 border-b border-[#c05746]/20 flex items-center gap-2 font-bold"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              <span>{t("Min dagbok", "My diary")}</span>
            </h2>
            <DiaryColumn compact maxEntries={2} hideHeader showArchiveLink />
          </div>
        </section>

        {/* Bottom sections - stacked slim bands */}
        <section className="container py-6 md:py-10 space-y-4 md:space-y-5">

          {/* Newsletter Band */}
          <div className="bg-[#c05746] rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                <h2 className="text-2xl md:text-3xl text-white whitespace-nowrap" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {t("Få nya artiklar i din inkorg", "Get new articles in your inbox")}
                </h2>
                <p className="text-white/90 text-lg md:text-xl leading-relaxed text-center md:text-left">
                  {t(
                    "Prenumerera för att få notiser när nya artiklar publiceras.",
                    "Subscribe to get notifications when new articles are published."
                  )}
                </p>
              </div>
              {subscribeStatus === "success" ? (
                <p className="text-white text-lg font-semibold whitespace-nowrap shrink-0">
                  {t("Tack! Du prenumererar nu.", "Thanks! You're subscribed.")}
                </p>
              ) : subscribeStatus === "exists" ? (
                <p className="text-white text-lg font-semibold whitespace-nowrap shrink-0">
                  {t("Du prenumererar redan!", "Already subscribed!")}
                </p>
              ) : subscribeStatus === "error" ? (
                <p className="text-white text-lg font-semibold whitespace-nowrap shrink-0">
                  {t("Något gick fel.", "Something went wrong.")}
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (subscribeEmail.trim()) {
                      subscribeMutation.mutate({ email: subscribeEmail.trim() });
                    }
                  }}
                  className="flex gap-3 shrink-0"
                >
                  <input
                    type="email"
                    required
                    value={subscribeEmail}
                    onChange={(e) => setSubscribeEmail(e.target.value)}
                    placeholder={t("Din email-adress", "Your email address")}
                    className="px-4 py-3 rounded-full bg-white/90 text-slate-800 text-lg focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-slate-400 w-56 md:w-72"
                  />
                  <button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="px-6 py-3 bg-slate-900 text-white rounded-full text-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-60"
                  >
                    {subscribeMutation.isPending
                      ? t("Sparar...", "Saving...")
                      : t("Prenumerera", "Subscribe")}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Comments Band - controlled from admin Settings */}
          {commentsEnabled && (
          <div className="bg-emerald-800 rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                <h2 className="text-2xl md:text-3xl text-white whitespace-nowrap" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {t("Kommentarer och diskussion", "Comments and discussion")}
                </h2>
                <p className="text-white/90 text-lg md:text-xl leading-relaxed text-center md:text-left">
                  {t(
                    "Dela dina tankar, ställ frågor eller diskutera artiklar.",
                    "Share your thoughts, ask questions, or discuss articles."
                  )}
                </p>
              </div>
              <a
                href="https://jagochminalzheimer.manus.space/comments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-full text-lg font-semibold hover:bg-emerald-50 transition-colors shadow-lg shrink-0"
              >
                {t("Gå till diskussionen", "Go to the discussion")}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          )}

          {/* Follow on X Band */}
          <div className="bg-slate-900 rounded-2xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
                <h2 className="text-2xl md:text-3xl text-white whitespace-nowrap" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {t("Följ mig på X", "Follow me on X")}
                </h2>
                <p className="text-slate-200 text-lg md:text-xl leading-relaxed text-center md:text-left">
                  {t(
                    "Jag skriver om mitt nya liv med Alzheimers på X (Twitter).",
                    "I write about my new life with Alzheimer's on X (Twitter)."
                  )}
                </p>
              </div>
              <a
                href="https://x.com/stendellby"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full text-lg font-semibold hover:bg-slate-100 transition-colors shadow-lg shrink-0"
              >
                {t("Ta mig till X", "Take me to X")}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* About link */}
        <section className="bg-accent/50 py-6">
          <div className="container text-center">
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-xl font-semibold text-foreground hover:text-[#c05746] transition-colors"
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

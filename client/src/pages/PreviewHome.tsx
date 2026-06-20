/**
 * Preview Homepage: Moscow Times newspaper style
 * - Tabloid/Helvetica header with profile photo
 * - Two-column layout: articles left, diary right
 * - Hero article (latest) with image + partial ingress
 * - Second article with image + ingress
 * - 2x3 grid with thumbnails + titles
 * - Tiles (newsletter, behandlingsplan, X) within article column
 * - Diary column stretches full height on the right
 * - Footer at bottom
 * 
 * NOTE: This is a PREVIEW page at /preview-home. Not live.
 * Mobile layout remains unchanged (falls back to current mobile behavior).
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { getArticleImage, IMAGES, categories, categoriesEn, type Article } from "@/data/articles";
import DiaryColumn from "@/components/DiaryColumn";
import { Link } from "wouter";
import { ExternalLink, ChevronRight, Loader2, Mail, Search } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function PreviewHome() {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Alla");

  const categoryMap: Record<string, string> = {
    All: "Alla",
    Treatment: "Behandling",
    Research: "Forskning",
    "Daily Life": "Vardagsliv",
    Medication: "Läkemedel",
    Opinion: "Åsikt",
  };

  // Fetch articles
  const { data: dbArticles, isLoading } = trpc.articles.list.useQuery({
    language,
    published: true,
  });

  // Fetch site settings for comments visibility
  const { data: commentsSettingValue } = trpc.settings.get.useQuery({ key: "comments_enabled" });
  const commentsEnabled = commentsSettingValue === "true";

  // Subscribe form
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

  const displayCategories = language === "sv" ? categories : categoriesEn;

  const handleCategoryClick = (cat: string) => {
    const mapped = language === "en" ? (categoryMap[cat] || cat) : cat;
    setActiveCategory(mapped);
  };

  const sortedArticles = useMemo(() => {
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

  const heroArticle = sortedArticles[0];
  const secondArticle = sortedArticles[1];
  const gridArticles = sortedArticles.slice(2, 8); // 6 articles for 2x3 grid

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* === HEADER: Same as active site === */}
      <SiteHeader />

      {/* === MAIN CONTENT: Two columns === */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 md:py-8 w-full">
        <div className="flex gap-8 lg:gap-10">
          
          {/* LEFT COLUMN: Articles + Tiles */}
          <div className="flex-1 min-w-0">

            {/* HERO ARTICLE (latest) - reduced height */}
            {heroArticle && (
              <Link href={`/article/${heroArticle.id}`} className="block group mb-6">
                <article>
                  <div className="relative overflow-hidden rounded-lg aspect-[3/1] mb-3">
                    <img
                      src={getArticleImage({ ...heroArticle, publishedAt: new Date(heroArticle.publishedAt).toISOString() })}
                      alt={heroArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded">
                        {heroArticle.category}
                      </span>
                    </div>
                  </div>
                  <h2
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight group-hover:text-red-800 transition-colors"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    {heroArticle.title}
                  </h2>
                  <p className="mt-2 text-lg text-slate-600 leading-relaxed line-clamp-3">
                    {heroArticle.excerpt}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {new Date(heroArticle.publishedAt).toLocaleDateString(language === "sv" ? "sv-SE" : "en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </article>
              </Link>
            )}

            {/* SECOND ARTICLE */}
            {secondArticle && (
              <Link href={`/article/${secondArticle.id}`} className="block group mb-6 pb-6 border-b border-slate-200">
                <article className="flex gap-4">
                  <div className="relative overflow-hidden rounded-lg w-48 h-32 shrink-0">
                    <img
                      src={getArticleImage({ ...secondArticle, publishedAt: new Date(secondArticle.publishedAt).toISOString() })}
                      alt={secondArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                        {secondArticle.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xl md:text-2xl font-bold text-slate-900 leading-tight group-hover:text-red-800 transition-colors"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {secondArticle.title}
                    </h3>
                    <p className="mt-1 text-base text-slate-600 leading-relaxed line-clamp-2">
                      {secondArticle.excerpt}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(secondArticle.publishedAt).toLocaleDateString(language === "sv" ? "sv-SE" : "en-US", {
                        year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                </article>
              </Link>
            )}

            {/* 2x3 ARTICLE GRID with thumbnails + titles */}
            {gridArticles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {gridArticles.map((article) => (
                  <Link key={article.id} href={`/article/${article.id}`} className="block group">
                    <article>
                      <div className="relative overflow-hidden rounded-md aspect-[4/3] mb-2">
                        <img
                          src={getArticleImage({ ...article, publishedAt: new Date(article.publishedAt).toISOString() })}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 bg-red-700 text-white text-[9px] font-bold uppercase tracking-wider rounded">
                            {article.category}
                          </span>
                        </div>
                      </div>
                      <h4
                        className="text-sm md:text-base font-bold text-slate-900 leading-snug group-hover:text-red-800 transition-colors line-clamp-2"
                        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                      >
                        {article.title}
                      </h4>
                    </article>
                  </Link>
                ))}
              </div>
            )}

            {/* SEARCH + CATEGORY FILTERS - on one row below articles */}
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 overflow-x-auto">
              {displayCategories.map((cat) => {
                const mappedCat = language === "en" ? (categoryMap[cat] || cat) : cat;
                const isActive = mappedCat === activeCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                    }`}
                    style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
                  >
                    {cat}
                  </button>
                );
              })}
              <div className="relative ml-auto w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("S\u00f6k...", "Search...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all"
                />
              </div>
            </div>

            {/* TILES: 2x2 grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {/* 1. Newsletter */}
              <div className="bg-[#c05746] rounded-xl p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                  {t("Prenumerera", "Subscribe")}
                </h3>
                <p className="text-white/90 text-sm mb-3">
                  {t("Få nya artiklar direkt i din inkorg.", "Get new articles directly in your inbox.")}
                </p>
                {subscribeStatus === "success" ? (
                  <p className="text-white font-semibold text-sm">{t("Tack! Du prenumererar nu.", "Thanks! You're subscribed.")}</p>
                ) : subscribeStatus === "exists" ? (
                  <p className="text-white font-semibold text-sm">{t("Du prenumererar redan!", "Already subscribed!")}</p>
                ) : subscribeStatus === "error" ? (
                  <p className="text-white font-semibold text-sm">{t("Något gick fel.", "Something went wrong.")}</p>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (subscribeEmail.trim()) {
                        subscribeMutation.mutate({ email: subscribeEmail.trim() });
                      }
                    }}
                    className="flex flex-col gap-2"
                  >
                    <input
                      type="email"
                      required
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      placeholder={t("Din email", "Your email")}
                      className="w-full px-3 py-2 rounded-lg bg-white/90 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={subscribeMutation.isPending}
                      className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60"
                    >
                      {subscribeMutation.isPending ? "..." : t("Skicka", "Send")}
                    </button>
                  </form>
                )}
              </div>

              {/* 2. Min behandlingsplan */}
              <Link href="/article/1" className="block">
                <div className="bg-amber-800 rounded-xl p-4 md:p-5 hover:bg-amber-700 transition-colors cursor-pointer h-full flex flex-col justify-center">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1"
                    style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                    {t("Min behandlingsplan", "My treatment plan")}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {t(
                      "Medicin, kost och livsstil som ett integrerat system.",
                      "Medicine, diet and lifestyle as an integrated system."
                    )}
                  </p>
                </div>
              </Link>

              {/* 3. Följ på X */}
              <div className="bg-slate-900 rounded-xl p-4 md:p-5 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-1"
                  style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                  {t("Följ mig på X", "Follow me on X")}
                </h3>
                <p className="text-slate-300 text-sm mb-3">
                  {t("Jag skriver om mitt liv med Alzheimers.", "I write about my life with Alzheimer's.")}
                </p>
                <a
                  href="https://x.com/stendellby"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors self-start"
                >
                  X <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* 4. Vad jag vill med denna sajt */}
              <Link href="/article/1920001" className="block">
                <div className="bg-teal-800 rounded-xl p-4 md:p-5 hover:bg-teal-700 transition-colors cursor-pointer h-full flex flex-col justify-center">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1"
                    style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
                    {t("Vad jag vill med denna sajt", "What I want with this site")}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {t(
                      "Mitt statement och mina mål med bloggen.",
                      "My statement and goals for this blog."
                    )}
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Diary - limited to same height as articles */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0 self-start">
            <div className="pr-2">
              <h2
                className="text-2xl font-black text-slate-900 uppercase tracking-wide mb-4 pb-3 border-b-2 border-slate-900"
                style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
              >
                {t("Dagbok", "Diary")}
              </h2>
              <DiaryColumn hideHeader maxEntries={6} showArchiveLink />
            </div>
          </aside>
        </div>
      </main>

      {/* === FOOTER: Same dark footer as published site === */}
      <SiteFooter />
    </div>
  );
}

import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, HeartPulse, Leaf, Loader2, Pill, Sprout } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { LIFESTYLE_TOPICS } from "@/lib/lifestyle";
import { trpc } from "@/lib/trpc";

const topicIcons = [Leaf, HeartPulse, Pill, Sprout];

export default function LifestylePage() {
  const { language, t } = useLanguage();
  const [activeTopic, setActiveTopic] = useState<string>(LIFESTYLE_TOPICS[0].key);
  const { data: pages, isLoading } = trpc.lifestyle.list.useQuery();

  const selectedTopic = LIFESTYLE_TOPICS.find((topic) => topic.key === activeTopic) ?? LIFESTYLE_TOPICS[0];
  const selectedPages = useMemo(
    () => (pages ?? []).filter((page) => page.topic === activeTopic),
    [pages, activeTopic]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f4ed]">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-emerald-950/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#315b50] text-white">
          <div className="container py-14 md:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold tracking-wide">
                <Leaf className="h-4 w-4" />
                {t("NY KUNSKAPSDEL", "NEW KNOWLEDGE SECTION")}
              </div>
              <h1 className="mt-6 text-4xl leading-tight md:text-6xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {t("Livsstil vid Alzheimer", "Lifestyle and Alzheimer's")}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-emerald-50 md:text-xl">
                {t(
                  "En separat plats för mat, FINGER-livsstil, läkemedel, kosttillskott och verktyg som kan vara värdefulla i vardagen.",
                  "A dedicated place for food, FINGER lifestyle, medication, supplements and tools that may be valuable in everyday life."
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="container py-8 md:py-12">
          <div className="rounded-2xl border border-amber-700/20 bg-amber-50 p-5 shadow-sm md:p-7">
            <div className="flex items-start gap-4">
              <BookOpen className="mt-1 h-7 w-7 shrink-0 text-amber-800" />
              <div>
                <h2 className="text-2xl text-emerald-950" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {t("Under uppbyggnad", "Under construction")}
                </h2>
                <p className="mt-2 max-w-3xl text-base leading-relaxed text-emerald-950/75 md:text-lg">
                  {t(
                    "Den här delen byggs upp stegvis. Ämnesflikarna finns redan på plats, och nya sidor kan fyllas på och publiceras i lugn takt.",
                    "This section is being built step by step. The topic tabs are already in place, and new pages can be added and published at a comfortable pace."
                  )}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t("Ämnen inom livsstil", "Lifestyle topics")}>
            {LIFESTYLE_TOPICS.map((topic, index) => {
              const Icon = topicIcons[index];
              const isActive = activeTopic === topic.key;
              return (
                <button
                  key={topic.key}
                  type="button"
                  onClick={() => setActiveTopic(topic.key)}
                  aria-pressed={isActive}
                  className={`min-h-28 rounded-xl border p-4 text-left transition-all focus:outline-none focus:ring-2 focus:ring-emerald-800/40 ${
                    isActive
                      ? "border-emerald-900 bg-emerald-900 text-white shadow-md"
                      : "border-emerald-950/15 bg-white text-emerald-950 hover:-translate-y-0.5 hover:border-emerald-800/40 hover:shadow-sm"
                  }`}
                >
                  <Icon className={`mb-3 h-6 w-6 ${isActive ? "text-amber-200" : "text-emerald-700"}`} />
                  <span className="block text-base font-bold leading-tight">
                    {language === "sv" ? topic.sv : topic.en}
                  </span>
                </button>
              );
            })}
          </nav>

          <section className="mt-8 rounded-2xl border border-emerald-950/10 bg-white p-5 shadow-sm md:p-8">
            <div className="border-b border-emerald-950/10 pb-5">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                {t("Ämne", "Topic")}
              </p>
              <h2 className="mt-1 text-3xl text-emerald-950" style={{ fontFamily: "'DM Serif Display', serif" }}>
                {language === "sv" ? selectedTopic.sv : selectedTopic.en}
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {language === "sv" ? selectedTopic.descriptionSv : selectedTopic.descriptionEn}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-9 w-9 animate-spin text-emerald-800" />
              </div>
            ) : selectedPages.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {selectedPages.map((page) => {
                  const title = language === "en" && page.titleEn ? page.titleEn : page.titleSv;
                  const excerpt = language === "en" && page.excerptEn ? page.excerptEn : page.excerptSv;
                  return (
                    <Link key={page.id} href={`/livsstil-vid-alzheimer/${page.id}`}>
                      <article className="group h-full overflow-hidden rounded-xl border border-emerald-950/10 bg-[#fbfaf7] transition-all hover:-translate-y-0.5 hover:border-emerald-800/35 hover:shadow-md">
                        {page.imageUrl && (
                          <img src={page.imageUrl} alt="" className="h-44 w-full object-cover" />
                        )}
                        <div className="p-5">
                          <h3 className="text-2xl leading-snug text-emerald-950 group-hover:text-emerald-700" style={{ fontFamily: "'DM Serif Display', serif" }}>
                            {title}
                          </h3>
                          {excerpt && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{excerpt}</p>}
                          <span className="mt-5 inline-flex items-center gap-2 font-semibold text-emerald-800 group-hover:underline">
                            {t("Läs mer", "Read more")} <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center">
                <Leaf className="mx-auto h-11 w-11 text-emerald-700/55" />
                <h3 className="mt-4 text-2xl text-emerald-950" style={{ fontFamily: "'DM Serif Display', serif" }}>
                  {t("Under uppbyggnad", "Under construction")}
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t(
                    "Här kommer sidor om detta ämne. Innehållet publiceras när det är färdigt och genomläst.",
                    "Pages on this topic will appear here. Content is published when it is ready and reviewed."
                  )}
                </p>
              </div>
            )}
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

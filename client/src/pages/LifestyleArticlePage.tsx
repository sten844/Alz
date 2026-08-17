import { ArrowLeft, Leaf, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLifestyleTopic } from "@/lib/lifestyle";
import { markdownToHtml } from "@/lib/markdownUtils";
import { trpc } from "@/lib/trpc";

export default function LifestyleArticlePage() {
  const { language, t } = useLanguage();
  const [, params] = useRoute("/livsstil-vid-alzheimer/:id");
  const pageId = Number(params?.id ?? 0);
  const { data: page, isLoading } = trpc.lifestyle.getById.useQuery({ id: pageId }, { enabled: pageId > 0 });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f4ed]">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-800" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f7f4ed]">
        <SiteHeader />
        <main className="container flex-1 py-16 text-center">
          <Leaf className="mx-auto h-12 w-12 text-emerald-700/55" />
          <h1 className="mt-5 text-4xl text-emerald-950" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {t("Sidan finns inte ännu", "This page is not available yet")}
          </h1>
          <Link href="/livsstil-vid-alzheimer" className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-900 px-6 py-3 font-semibold text-white hover:bg-emerald-800">
            <ArrowLeft className="h-4 w-4" />
            {t("Till Livsstil vid Alzheimer", "Back to Lifestyle and Alzheimer's")}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = language === "en" && page.titleEn ? page.titleEn : page.titleSv;
  const content = language === "en" && page.contentEn ? page.contentEn : page.contentSv;
  const topic = getLifestyleTopic(page.topic);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f4ed]">
      <SiteHeader />
      <main className="flex-1">
        <article className="container max-w-4xl py-8 md:py-14">
          <Link href="/livsstil-vid-alzheimer" className="inline-flex items-center gap-2 text-base font-semibold text-emerald-800 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {t("Livsstil vid Alzheimer", "Lifestyle and Alzheimer's")}
          </Link>

          <div className="mt-7 rounded-2xl border border-emerald-950/10 bg-white p-6 shadow-sm md:p-10">
            {topic && (
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">
                {language === "sv" ? topic.sv : topic.en}
              </p>
            )}
            <h1 className="mt-3 text-4xl leading-tight text-emerald-950 md:text-5xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {title}
            </h1>
            {page.imageUrl && <img src={page.imageUrl} alt="" className="mt-7 max-h-[440px] w-full rounded-xl object-cover" />}
            <div
              className="mt-8 text-lg leading-relaxed text-foreground [&_a]:text-emerald-800 [&_a]:underline [&_h1]:mt-8 [&_h1]:text-4xl [&_h1]:text-emerald-950 [&_h2]:mt-8 [&_h2]:text-3xl [&_h2]:text-emerald-950 [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:text-emerald-950 [&_li]:my-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
            />
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { markdownToHtml } from "@/lib/markdownUtils";
import { trpc } from "@/lib/trpc";

export default function SecondaryArticlePage() {
  const { language, t } = useLanguage();
  const [, params] = useRoute("/fordjupning/:id");
  const articleId = Number(params?.id ?? 0);
  const { data: article, isLoading } = trpc.secondaryArticles.getById.useQuery({ id: articleId }, { enabled: articleId > 0 });

  if (isLoading) {
    return <div className="min-h-screen flex flex-col bg-background"><SiteHeader /><main className="flex flex-1 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-[#c05746]" /></main><SiteFooter /></div>;
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="container flex-1 py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-[#c05746]/60" />
          <h1 className="mt-5 text-4xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>{t("Artikeln finns inte ännu", "This article is not available yet")}</h1>
          <Link href="/fordjupning" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#c05746] px-6 py-3 font-semibold text-white hover:bg-[#a84537]"><ArrowLeft className="h-4 w-4" />{t("Till artikelserien", "Back to the article series")}</Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const title = language === "en" && article.titleEn ? article.titleEn : article.titleSv;
  const content = language === "en" && article.contentEn ? article.contentEn : article.contentSv;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 max-w-4xl py-8 md:py-14">
        <Link href="/fordjupning" className="inline-flex items-center gap-2 font-semibold text-[#a84537] hover:underline"><ArrowLeft className="h-4 w-4" />{t("Till artikelserien", "Back to the article series")}</Link>
        <article className="mt-7 rounded-2xl border border-border/50 bg-card p-6 shadow-sm md:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-[#a84537]">{t("Fördjupning", "In depth")}</p>
          <h1 className="mt-3 text-4xl leading-tight text-foreground md:text-5xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{title}</h1>
          {article.imageUrl && <img src={article.imageUrl} alt="" className="mt-7 max-h-[440px] w-full rounded-xl object-cover" />}
          <div className="mt-8 text-lg leading-relaxed text-foreground [&_a]:text-[#a84537] [&_a]:underline [&_h1]:mt-8 [&_h1]:text-4xl [&_h2]:mt-8 [&_h2]:text-3xl [&_h3]:mt-6 [&_h3]:text-2xl [&_li]:my-2 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-7 [&_p]:my-5 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-7" dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

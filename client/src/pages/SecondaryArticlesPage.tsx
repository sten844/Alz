import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SecondaryArticleGrid from "@/components/SecondaryArticleGrid";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

const headingKeys = ["secondary_articles_heading_sv", "secondary_articles_heading_en", "secondary_articles_intro_sv", "secondary_articles_intro_en"];

export default function SecondaryArticlesPage() {
  const { language, t } = useLanguage();
  const { data: articles, isLoading } = trpc.secondaryArticles.list.useQuery();
  const { data: settings } = trpc.settings.getMany.useQuery({ keys: headingKeys });
  const heading = language === "en"
    ? settings?.secondary_articles_heading_en || "Life with Alzheimer's – tips and tricks"
    : settings?.secondary_articles_heading_sv || "Livet med Alzheimer – tips och tricks";
  const intro = language === "en"
    ? settings?.secondary_articles_intro_en || "A separate article stream for experiences, ideas and new reflections."
    : settings?.secondary_articles_intro_sv || "En egen artikelrad för erfarenheter, idéer och nya reflektioner.";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="container flex-1 py-8 md:py-12">
        <Link href="/" className="inline-flex items-center gap-2 font-semibold text-[#a84537] hover:underline">
          <ArrowLeft className="h-4 w-4" /> {t("Till startsidan", "Back to home")}
        </Link>
        <section className="mt-6 rounded-2xl bg-[#c05746] px-6 py-7 text-white shadow-sm md:px-9 md:py-9">
          <p className="text-sm font-bold uppercase tracking-wider text-white/80">{t("Egen artikelserie", "Independent article series")}</p>
          <h1 className="mt-2 text-4xl leading-tight md:text-5xl" style={{ fontFamily: "'DM Serif Display', serif" }}>{heading}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-white/90">{intro}</p>
        </section>

        <section className="mt-8">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-9 w-9 animate-spin text-[#c05746]" /></div>
          ) : articles?.length ? (
            <SecondaryArticleGrid articles={articles} />
          ) : (
            <div className="rounded-xl border border-dashed border-[#c05746]/35 bg-[#fdf4f1] p-10 text-center text-muted-foreground">
              {t("Artiklarna byggs upp här. Titta gärna snart igen.", "Articles are being built here. Please check back soon.")}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

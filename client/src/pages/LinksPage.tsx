/**
 * Nordic Warmth Design: Links & Resources Page
 * - Curated links to Alzheimer organizations
 * - Swedish and international sections
 * - Content loaded from database (editable from admin)
 */
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function LinksPage() {
  const { language, t } = useLanguage();
  const { data: links, isLoading } = trpc.resourceLinks.list.useQuery();

  const swedishLinks = links?.filter((l: any) => l.category === "swedish") ?? [];
  const internationalLinks = links?.filter((l: any) => l.category === "international") ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-gradient-to-b from-[#f5ebe0]/60 to-background py-12 md:py-16">
          <div className="container max-w-4xl">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#c05746] hover:text-[#a8483b] transition-colors mb-6 text-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              {t("Tillbaka", "Back")}
            </Link>

            <h1
              className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {t("Länkar och resurser", "Links and Resources")}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl">
              {t(
                "Här har jag samlat några av de mest pålitliga källorna för information, forskning och stöd kring Alzheimers sjukdom – både i Sverige och internationellt.",
                "Here I have gathered some of the most reliable sources for information, research and support regarding Alzheimer's disease – both in Sweden and internationally."
              )}
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
          </div>
        ) : (
          <div className="container max-w-4xl py-10 md:py-14 space-y-14">
            {/* Swedish resources */}
            {swedishLinks.length > 0 && (
              <section>
                <h2
                  className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8 pb-3 border-b-2 border-[#c05746]/30"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t("Svenska resurser", "Swedish Resources")}
                </h2>
                <div className="space-y-5">
                  {swedishLinks.map((link: any) => (
                    <LinkCard key={link.id} link={link} language={language} />
                  ))}
                </div>
              </section>
            )}

            {/* International resources */}
            {internationalLinks.length > 0 && (
              <section>
                <h2
                  className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8 pb-3 border-b-2 border-[#c05746]/30"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {t("Internationella resurser", "International Resources")}
                </h2>
                <div className="space-y-5">
                  {internationalLinks.map((link: any) => (
                    <LinkCard key={link.id} link={link} language={language} />
                  ))}
                </div>
              </section>
            )}

            {swedishLinks.length === 0 && internationalLinks.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">
                  {t("Inga länkar har lagts till ännu.", "No links have been added yet.")}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function LinkCard({ link, language }: { link: any; language: string }) {
  const name = language === "sv" ? link.nameSv : link.nameEn;
  const desc = language === "sv" ? link.descSv : link.descEn;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card rounded-2xl border border-border/50 p-6 md:p-8 hover:border-[#c05746]/40 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground group-hover:text-[#c05746] transition-colors mb-2">
            {name}
          </h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {desc}
          </p>
          <span className="inline-flex items-center gap-1.5 text-base text-[#c05746] mt-3 group-hover:underline">
            {link.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <ExternalLink className="w-4 h-4" />
          </span>
        </div>
        <div className="shrink-0 w-12 h-12 rounded-xl bg-[#c05746]/10 flex items-center justify-center group-hover:bg-[#c05746]/20 transition-colors">
          <ExternalLink className="w-6 h-6 text-[#c05746]" />
        </div>
      </div>
    </a>
  );
}

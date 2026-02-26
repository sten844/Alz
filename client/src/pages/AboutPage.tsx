/**
 * Nordic Warmth Design: About Page
 * - Personal, warm tone
 * - Profile photo prominently displayed
 * - Clean reading layout
 */
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IMAGES } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 container max-w-3xl mx-auto py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("Tillbaka", "Back")}
        </Link>

        <div className="bg-card rounded-xl shadow-sm p-8 md:p-10 border border-border/30">
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
            <img
              src={IMAGES.profile}
              alt="Sten Dellby"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div>
              <h1 className="text-3xl md:text-4xl text-foreground mb-2">
                {t("Om mig", "About me")}
              </h1>
              <p className="text-lg text-muted-foreground">Sten Dellby</p>
            </div>
          </div>

          <div className="space-y-5 text-lg leading-relaxed text-foreground/90">
            <p>
              {t(
                "Jag heter Sten Dellby och har fått diagnosen Alzheimers sjukdom. Denna webbplats är mitt försök att bygga en kunskapsbank – inte bara för mig själv, utan för alla som lever med samma diagnos.",
                "My name is Sten Dellby and I have been diagnosed with Alzheimer's disease. This website is my attempt to build a knowledge base – not just for myself, but for everyone living with the same diagnosis."
              )}
            </p>
            <p>
              {t(
                "Jag tror på att dela kunskap öppet. Genom att dokumentera min resa – behandlingsplaner, forskningsrön, vardagstips och erfarenheter med AI-verktyg – hoppas jag kunna hjälpa andra i samma situation.",
                "I believe in sharing knowledge openly. By documenting my journey – treatment plans, research findings, everyday tips, and experiences with AI tools – I hope to help others in the same situation."
              )}
            </p>
            <p>
              {t(
                "Denna webbplats är också mitt \"meningsskapande projekt\" – en central del av min behandlingsplan. Forskning visar att sammanhängande, meningsfullt engagemang stärker hjärnans motståndskraft. Att bygga och underhålla denna kunskapsbank ger mig kognitiv stimulans, social koppling och struktur i vardagen.",
                "This website is also my \"meaning-making project\" – a central part of my treatment plan. Research shows that coherent, meaningful engagement strengthens the brain's resilience. Building and maintaining this knowledge base gives me cognitive stimulation, social connection, and structure in everyday life."
              )}
            </p>
            <p>
              {t(
                "Jag nås enklast via e-post på sten@dellby.info eller via X (Twitter) där jag skriver om mitt nya liv med Alzheimers.",
                "I'm easiest to reach via email at sten@dellby.info or via X (Twitter) where I write about my new life with Alzheimer's."
              )}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-4">
            <a
              href="mailto:sten@dellby.info"
              className="px-5 py-2.5 bg-[#c05746] text-white rounded-full text-sm font-semibold hover:bg-[#a84838] transition-colors shadow-md"
            >
              {t("Skicka e-post", "Send email")}
            </a>
            <a
              href="https://x.com/stendellby"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-slate-800 text-white rounded-full text-sm font-semibold hover:bg-slate-700 transition-colors shadow-md"
            >
              {t("Följ på X", "Follow on X")}
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

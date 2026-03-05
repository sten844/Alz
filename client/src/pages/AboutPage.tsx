/**
 * Nordic Warmth Design: About Page
 * - Personal, warm tone
 * - Profile photo prominently displayed
 * - Clean reading layout
 * - Loads editable content from database
 * - Shows technical description at bottom
 */
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { IMAGES } from "@/data/articles";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Simple markdown-like renderer for the about page content
function renderAboutContent(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table detection
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|[\s-|]+\|$/)) {
      // Parse table
      const headerCells = line.split("|").filter(c => c.trim()).map(c => c.trim());
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i].split("|").filter(c => c.trim()).map(c => c.trim());
        rows.push(cells);
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="px-4 py-2 text-base font-semibold text-foreground">{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/30">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2 text-base text-foreground/90">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Heading ### 
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xl font-semibold text-foreground mt-8 mb-3">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Heading ##
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-2xl font-bold text-foreground mt-10 mb-4">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---") {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-border" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-lg leading-relaxed text-foreground/90 mb-4">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <>{elements}</>;
}

// Render inline markdown (bold, italic)
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }

    // No more matches
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

export default function AboutPage() {
  const { language, t } = useLanguage();
  const { data: pageData, isLoading } = trpc.pages.get.useQuery({ slug: "about" });

  const dbContent = language === "sv" ? pageData?.contentSv : pageData?.contentEn;

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

          {/* Database-loaded content (editable from admin) */}
          {isLoading && (
            <div className="mt-10 pt-8 border-t border-border flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#c05746]" />
            </div>
          )}

          {dbContent && (
            <div className="mt-10 pt-8 border-t border-border">
              {renderAboutContent(dbContent)}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

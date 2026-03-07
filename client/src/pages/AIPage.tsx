/**
 * AI Page - Content loaded from database (editable via admin panel)
 * Falls back to hardcoded content if database is empty.
 * Max 2 columns, shorter texts, useful links
 * Each fact card has a relevant link
 */
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Bell, Mic, Shield, MessageCircle, FileText, Brain, Camera, PenLine, ListChecks, Headphones, MapPin, Languages, Heart, Atom, Car, Cloud, Film, Palette, Music, Bot, Sparkles, Mail, Navigation, Lock, Keyboard, Loader2 } from "lucide-react";

// Icon map for database items (iconName → component)
const iconMap: Record<string, any> = {
  Bell, Mic, Shield, MessageCircle, FileText, Brain, Camera, PenLine, ListChecks,
  Headphones, MapPin, Languages, Heart, Atom, Car, Cloud, Film, Palette, Music,
  Bot, Sparkles, Mail, Navigation, Lock, Keyboard, ExternalLink,
};

// ============================================================
// HARDCODED FALLBACK DATA (used when database is empty)
// ============================================================

const fallbackSections = [
  {
    sectionKey: "cognitive_help",
    titleSv: "AI som hjälpmedel", titleEn: "AI as an aid",
    subtitleSv: "Tålmodigt. Aldrig dömande. Dygnet runt.",
    subtitleEn: "Patient. Never judging. Around the clock.",
    sortOrder: 1, visible: true, variant: "light",
    items: [
      { nameSv: "Påminnelser", nameEn: "Reminders", descSv: "Siri eller Google Assistant påminner om mediciner och möten.", descEn: "Siri or Google Assistant reminds you about meds and appointments.", url: "https://support.apple.com/sv-se/guide/iphone/iph5e81ca4c4/ios", linkTextSv: "Siri-guide", linkTextEn: "Siri guide", iconName: "Bell", visible: true },
      { nameSv: "Röststyrning", nameEn: "Voice control", descSv: "Styr allt med rösten. Inga knappar behövs.", descEn: "Control everything by voice. No buttons needed.", url: "https://assistant.google.com", linkTextSv: "Google Assistant", linkTextEn: "Google Assistant", iconName: "Mic", visible: true },
      { nameSv: "Falldetektering", nameEn: "Fall detection", descSv: "Apple Watch larmar anhöriga automatiskt vid fall.", descEn: "Apple Watch alerts family automatically if you fall.", url: "https://support.apple.com/sv-se/108896", linkTextSv: "Apple Watch", linkTextEn: "Apple Watch", iconName: "Shield", visible: true },
      { nameSv: "Sällskap", nameEn: "Companionship", descSv: "ChatGPT pratar med dig om vad som helst, dygnet runt.", descEn: "ChatGPT talks with you about anything, 24/7.", url: "https://chat.openai.com", linkTextSv: "Öppna ChatGPT", linkTextEn: "Open ChatGPT", iconName: "MessageCircle", visible: true },
      { nameSv: "Förenkla texter", nameEn: "Simplify texts", descSv: "Klistra in ett läkarbrev – AI förklarar på enkel svenska.", descEn: "Paste a doctor's letter – AI explains in plain language.", url: "https://claude.ai", linkTextSv: "Prova Claude", linkTextEn: "Try Claude", iconName: "FileText", visible: true },
      { nameSv: "Hjärnträning", nameEn: "Brain training", descSv: "Appar som Duolingo anpassar svårigheten efter dig.", descEn: "Apps like Duolingo adapt difficulty to your level.", url: "https://www.duolingo.com", linkTextSv: "Duolingo", linkTextEn: "Duolingo", iconName: "Brain", visible: true },
      { nameSv: "Identifiera saker", nameEn: "Identify things", descSv: "Rikta kameran mot ett piller eller skylt – AI berättar vad det är.", descEn: "Point camera at a pill or sign – AI tells you what it is.", url: "https://lens.google.com", linkTextSv: "Google Lens", linkTextEn: "Google Lens", iconName: "Camera", visible: true },
      { nameSv: "Skrivhjälp", nameEn: "Writing help", descSv: "Berätta vad du vill säga – AI skriver mejlet.", descEn: "Tell AI what you want to say – it writes the email.", url: "https://chat.openai.com", linkTextSv: "Prova ChatGPT", linkTextEn: "Try ChatGPT", iconName: "PenLine", visible: true },
      { nameSv: "Planera dagen", nameEn: "Plan the day", descSv: "AI bryter ner uppgifter i små steg och gör att-göra-listor.", descEn: "AI breaks tasks into small steps and creates to-do lists.", url: "https://www.todoist.com", linkTextSv: "Todoist", linkTextEn: "Todoist", iconName: "ListChecks", visible: true },
      { nameSv: "Lyssna istället", nameEn: "Listen instead", descSv: "AI läser upp texter med naturlig röst.", descEn: "AI reads texts aloud with a natural voice.", url: "https://www.naturalreaders.com", linkTextSv: "Natural Reader", linkTextEn: "Natural Reader", iconName: "Headphones", visible: true },
      { nameSv: "Hitta hem", nameEn: "Find home", descSv: "Fråga AI: 'Hur tar jag mig hem?' – röstinstruktioner steg för steg.", descEn: "Ask AI: 'How do I get home?' – voice directions step by step.", url: "https://maps.google.com", linkTextSv: "Google Maps", linkTextEn: "Google Maps", iconName: "MapPin", visible: true },
      { nameSv: "Översätt & förklara", nameEn: "Translate & explain", descSv: "Svårt ord? Skriv, tala eller fotografera – AI förklarar.", descEn: "Difficult word? Type, speak or photograph – AI explains.", url: "https://translate.google.com", linkTextSv: "Google Translate", linkTextEn: "Google Translate", iconName: "Languages", visible: true },
    ],
  },
  {
    sectionKey: "tools",
    titleSv: "Verktyg att testa – gratis", titleEn: "Tools to try – free",
    subtitleSv: "Klicka för att prova direkt.",
    subtitleEn: "Click to try right away.",
    sortOrder: 2, visible: true, variant: "accent",
    items: [
      { nameSv: "ChatGPT", nameEn: "ChatGPT", descSv: "Prata, fråga, skriv", descEn: "Chat, ask, write", url: "https://chat.openai.com", linkTextSv: "ChatGPT", linkTextEn: "ChatGPT", iconName: "MessageCircle", visible: true },
      { nameSv: "Claude", nameEn: "Claude", descSv: "Bra på långa texter", descEn: "Great for long texts", url: "https://claude.ai", linkTextSv: "Claude", linkTextEn: "Claude", iconName: "PenLine", visible: true },
      { nameSv: "Perplexity", nameEn: "Perplexity", descSv: "Research med källor", descEn: "Research with sources", url: "https://perplexity.ai", linkTextSv: "Perplexity", linkTextEn: "Perplexity", iconName: "Sparkles", visible: true },
      { nameSv: "Gemini", nameEn: "Gemini", descSv: "Googles AI-assistent", descEn: "Google's AI assistant", url: "https://gemini.google.com", linkTextSv: "Gemini", linkTextEn: "Gemini", iconName: "Sparkles", visible: true },
      { nameSv: "Google Lens", nameEn: "Google Lens", descSv: "Identifiera med kameran", descEn: "Identify with camera", url: "https://lens.google.com", linkTextSv: "Google Lens", linkTextEn: "Google Lens", iconName: "Camera", visible: true },
    ],
  },
  {
    sectionKey: "spectacular",
    titleSv: "Det spektakulära", titleEn: "The spectacular",
    subtitleSv: "Värt att känna till.",
    subtitleEn: "Worth knowing about.",
    sortOrder: 3, visible: true, variant: "dark",
    items: [
      { nameSv: "Hittar cancer i förväg", nameEn: "Detects cancer early", descSv: "Stanford-AI förutsäger lungcancer innan symtom uppstår.", descEn: "Stanford AI predicts lung cancer before symptoms appear.", url: "https://med.stanford.edu/news/all-news/2023/08/ai-lung-cancer.html", linkTextSv: "Stanford-studie", linkTextEn: "Stanford study", iconName: "Heart", visible: true },
      { nameSv: "Löste 50-årig gåta", nameEn: "Solved 50-year mystery", descSv: "AlphaFold kartlade 200 miljoner proteiner på ett år.", descEn: "AlphaFold mapped 200 million proteins in one year.", url: "https://alphafold.ebi.ac.uk", linkTextSv: "AlphaFold-databasen", linkTextEn: "AlphaFold database", iconName: "Atom", visible: true },
      { nameSv: "Kör utan förare", nameEn: "Drives without driver", descSv: "Waymo kör 50 000 passagerare per vecka utan förare.", descEn: "Waymo drives 50,000 passengers per week without a driver.", url: "https://waymo.com", linkTextSv: "Waymo", linkTextEn: "Waymo", iconName: "Car", visible: true },
      { nameSv: "Förutsäger orkaner", nameEn: "Predicts hurricanes", descSv: "Googles GraphCast slår världens bästa vädersystem.", descEn: "Google's GraphCast beats the world's best weather systems.", url: "https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/", linkTextSv: "GraphCast", linkTextEn: "GraphCast", iconName: "Cloud", visible: true },
      { nameSv: "Skapar film från text", nameEn: "Creates video from text", descSv: "OpenAIs Sora genererar filmklipp från en textbeskrivning.", descEn: "OpenAI's Sora generates video clips from text descriptions.", url: "https://openai.com/sora", linkTextSv: "Sora", linkTextEn: "Sora", iconName: "Film", visible: true },
      { nameSv: "Vann konstpriset", nameEn: "Won art prize", descSv: "En AI-målning vann Colorado State Fair 2022.", descEn: "An AI painting won Colorado State Fair 2022.", url: "https://www.midjourney.com", linkTextSv: "Midjourney", linkTextEn: "Midjourney", iconName: "Palette", visible: true },
      { nameSv: "Komponerar musik", nameEn: "Composes music", descSv: "Suno skapar kompletta låtar med sång på sekunder.", descEn: "Suno creates complete songs with vocals in seconds.", url: "https://suno.com", linkTextSv: "Prova Suno", linkTextEn: "Try Suno", iconName: "Music", visible: true },
      { nameSv: "Robotar arbetar", nameEn: "Robots work", descSv: "Tesla Optimus arbetar i fabriker. Ameca har mänskliga ansiktsuttryck.", descEn: "Tesla Optimus works in factories. Ameca has human facial expressions.", url: "https://www.engineeredarts.co.uk/robot/ameca/", linkTextSv: "Se Ameca", linkTextEn: "See Ameca", iconName: "Bot", visible: true },
    ],
  },
  {
    sectionKey: "already_use",
    titleSv: "AI du redan använder", titleEn: "AI you already use",
    subtitleSv: "Inbyggt i appar du använder varje dag.",
    subtitleEn: "Built into apps you use every day.",
    sortOrder: 4, visible: true, variant: "light",
    items: [
      { nameSv: "Streaming", nameEn: "Streaming", descSv: "Spotify väljer låtar baserat på ditt humör.", descEn: "Spotify picks songs based on your mood.", url: "https://www.spotify.com", linkTextSv: "Spotify", linkTextEn: "Spotify", iconName: "Sparkles", visible: true },
      { nameSv: "E-post", nameEn: "Email", descSv: "AI sorterar spam och skriver halva mejlet.", descEn: "AI sorts spam and writes half your email.", url: "https://mail.google.com", linkTextSv: "Gmail", linkTextEn: "Gmail", iconName: "Mail", visible: true },
      { nameSv: "Navigation", nameEn: "Navigation", descSv: "Google Maps förutsäger köer innan de uppstår.", descEn: "Google Maps predicts traffic before it happens.", url: "https://maps.google.com", linkTextSv: "Google Maps", linkTextEn: "Google Maps", iconName: "Navigation", visible: true },
      { nameSv: "Bankskydd", nameEn: "Bank security", descSv: "AI stoppar kortbedrägerier på millisekunder.", descEn: "AI stops card fraud in milliseconds.", url: "https://www.visa.se/om-visa/innovation/ai.html", linkTextSv: "Visa AI", linkTextEn: "Visa AI", iconName: "Lock", visible: true },
      { nameSv: "Ansiktslås", nameEn: "Face unlock", descSv: "Känner igen dig i 3D – säkrare än lösenord.", descEn: "Recognizes you in 3D – safer than passwords.", url: "https://support.apple.com/sv-se/108411", linkTextSv: "Face ID", linkTextEn: "Face ID", iconName: "Camera", visible: true },
      { nameSv: "Tangentbordet", nameEn: "Keyboard", descSv: "Förutsäger nästa ord du skriver.", descEn: "Predicts the next word you type.", url: "https://support.google.com/gboard", linkTextSv: "Gboard", linkTextEn: "Gboard", iconName: "Keyboard", visible: true },
    ],
  },
  {
    sectionKey: "useful_links",
    titleSv: "Användbara länkar", titleEn: "Useful links",
    subtitleSv: "Svenska och internationella resurser.",
    subtitleEn: "Swedish and international resources.",
    sortOrder: 5, visible: true, variant: "light",
    items: [
      { nameSv: "AI Sweden", nameEn: "AI Sweden", descSv: "Sveriges nationella AI-center", descEn: "Sweden's national AI center", url: "https://www.ai.se", linkTextSv: "AI Sweden", linkTextEn: "AI Sweden", iconName: "Sparkles", visible: true },
      { nameSv: "Demensförbundet", nameEn: "Demensförbundet", descSv: "Stöd och information om demens", descEn: "Support and information about dementia", url: "https://www.demensforbundet.se", linkTextSv: "Demensförbundet", linkTextEn: "Demensförbundet", iconName: "Heart", visible: true },
      { nameSv: "1177 Vårdguiden – Alzheimer", nameEn: "1177 Vårdguiden – Alzheimer", descSv: "Fakta om Alzheimers sjukdom", descEn: "Facts about Alzheimer's disease", url: "https://www.1177.se/sjukdomar--besvar/hjarna-och-nerver/demenssjukdomar/alzheimers-sjukdom/", linkTextSv: "1177", linkTextEn: "1177", iconName: "Heart", visible: true },
      { nameSv: "Alzheimer's Association", nameEn: "Alzheimer's Association", descSv: "Internationell forskning och stöd (engelska)", descEn: "International research and support", url: "https://www.alz.org", linkTextSv: "Alzheimer's Association", linkTextEn: "Alzheimer's Association", iconName: "Heart", visible: true },
      { nameSv: "Anthropic", nameEn: "Anthropic", descSv: "Företaget bakom Claude AI", descEn: "The company behind Claude AI", url: "https://www.anthropic.com", linkTextSv: "Anthropic", linkTextEn: "Anthropic", iconName: "Bot", visible: true },
    ],
  },
];

// Reusable card component with link
function FactCard({ icon: Icon, title, desc, url, linkText, variant = "light" }: {
  icon: any;
  title: string;
  desc: string;
  url: string;
  linkText: string;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <div className={`flex items-start gap-4 p-5 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-card border border-border/50 hover:shadow-md"} transition-shadow`}>
      <div className={`w-10 h-10 rounded-lg ${isDark ? "bg-[#c05746]/20" : "bg-accent"} flex items-center justify-center flex-shrink-0`}>
        {Icon ? <Icon className="w-5 h-5 text-[#c05746]" /> : <Sparkles className="w-5 h-5 text-[#c05746]" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{title}</h3>
        <p className={`text-sm ${isDark ? "text-slate-400" : "text-muted-foreground"} mt-1`}>{desc}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-[#c05746] hover:underline mt-2"
        >
          {linkText} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

// Render a "tools" section (clickable cards with external links)
function ToolsSection({ items, t, variant }: { items: any[]; t: (sv: string, en: string) => string; variant: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.filter(i => i.visible !== false).map((item: any, i: number) => {
        const Icon = iconMap[item.iconName] || Sparkles;
        return (
          <a
            key={item.id || i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-[#c05746]/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c05746]/10 to-[#c05746]/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-[#c05746]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-[#c05746] transition-colors">
                {t(item.nameSv, item.nameEn)}
              </h3>
              <p className="text-sm text-muted-foreground">{t(item.descSv, item.descEn)}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#c05746] transition-colors" />
          </a>
        );
      })}
    </div>
  );
}

// Render a "links" section (simple link cards)
function LinksSection({ items, t }: { items: any[]; t: (sv: string, en: string) => string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.filter(i => i.visible !== false).map((item: any, i: number) => (
        <a
          key={item.id || i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-5 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-[#c05746]/30 transition-all group"
        >
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-[#c05746] transition-colors">
              {t(item.nameSv, item.nameEn)}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{t(item.descSv, item.descEn)}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#c05746] transition-colors flex-shrink-0 ml-4" />
        </a>
      ))}
    </div>
  );
}

// Render a standard "fact cards" section
function FactCardsSection({ items, t, variant }: { items: any[]; t: (sv: string, en: string) => string; variant: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.filter(i => i.visible !== false).map((item: any, i: number) => {
        const Icon = iconMap[item.iconName] || Sparkles;
        return (
          <FactCard
            key={item.id || i}
            icon={Icon}
            title={t(item.nameSv, item.nameEn)}
            desc={t(item.descSv, item.descEn)}
            url={item.url}
            linkText={t(item.linkTextSv || item.nameSv, item.linkTextEn || item.nameEn)}
            variant={variant === "dark" ? "dark" : "light"}
          />
        );
      })}
    </div>
  );
}

export default function AIPage() {
  const { t } = useLanguage();
  const { data: dbSections, isLoading } = trpc.aiPage.getSections.useQuery();

  // Use database sections if available, otherwise fallback
  const sections = (dbSections && dbSections.length > 0) ? dbSections : fallbackSections;

  // Section rendering config: which wrapper/bg to use
  const sectionConfig: Record<string, { bg: string; textColor: string; subtitleColor: string }> = {
    cognitive_help: { bg: "", textColor: "text-foreground", subtitleColor: "text-muted-foreground" },
    tools: { bg: "bg-accent/30", textColor: "text-foreground", subtitleColor: "text-muted-foreground" },
    spectacular: { bg: "bg-slate-900", textColor: "text-white", subtitleColor: "text-slate-400" },
    already_use: { bg: "", textColor: "text-foreground", subtitleColor: "text-muted-foreground" },
    useful_links: { bg: "", textColor: "text-foreground", subtitleColor: "text-muted-foreground" },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-800 to-slate-900 py-16 md:py-20">
          <div className="container text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-[#c05746]/20 text-[#c05746] text-sm font-medium mb-4">
              {t("Vardagsliv · AI", "Daily Life · AI")}
            </span>
            <h1 className="text-4xl md:text-5xl text-white mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
              AI – {t("Långt bortom Google", "Far beyond Google")}
            </h1>
            <p className="text-slate-300 text-lg max-w-xl mx-auto">
              {t(
                "AI har blivit mitt oväntat bästa hjälpmedel. Här visar jag vad det kan göra.",
                "AI has become my unexpectedly best aid. Here I show what it can do."
              )}
            </p>
          </div>
        </section>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#c05746]" />
          </div>
        )}

        {/* Dynamic sections */}
        {sections.filter(s => s.visible !== false).map((section) => {
          const config = sectionConfig[section.sectionKey] || sectionConfig.cognitive_help;
          const isDark = section.variant === "dark" || section.sectionKey === "spectacular";
          const isTools = section.sectionKey === "tools";
          const isLinks = section.sectionKey === "useful_links";

          return (
            <section key={section.sectionKey} className={`${config.bg} py-16`}>
              <div className="container">
                <h2
                  className={`text-3xl ${config.textColor} mb-2`}
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  {t(section.titleSv, section.titleEn)}
                </h2>
                {(section.subtitleSv || section.subtitleEn) && (
                  <p className={`${config.subtitleColor} mb-8`}>
                    {t(section.subtitleSv || "", section.subtitleEn || "")}
                  </p>
                )}

                {isTools ? (
                  <ToolsSection items={section.items} t={t} variant={section.variant || "light"} />
                ) : isLinks ? (
                  <LinksSection items={section.items} t={t} />
                ) : (
                  <FactCardsSection items={section.items} t={t} variant={isDark ? "dark" : "light"} />
                )}
              </div>
            </section>
          );
        })}

        {/* Closing */}
        <section className="bg-[#c05746] py-12">
          <div className="container text-center">
            <h2 className="text-2xl text-white mb-3" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {t("Vi är bara i början", "We're just at the beginning")}
            </h2>
            <p className="text-white/80 max-w-lg mx-auto">
              {t(
                "Frågan är inte 'Vad kan AI göra?' utan 'Vad väljer vi att använda det till?'",
                "The question is not 'What can AI do?' but 'What do we choose to use it for?'"
              )}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

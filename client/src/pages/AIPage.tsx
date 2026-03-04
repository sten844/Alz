/**
 * AI Page - Integrated from the AI subsite
 * Max 2 columns, shorter texts, useful links
 * Each fact card has a relevant link
 */
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, Bell, Mic, Shield, MessageCircle, FileText, Brain, Camera, PenLine, ListChecks, Headphones, MapPin, Languages, Heart, Atom, Car, Cloud, Film, Palette, Music, Bot, Sparkles, Mail, Navigation, Lock, Keyboard } from "lucide-react";

// AI tools with real links
const aiTools = [
  {
    name: "ChatGPT",
    descSv: "Prata, fråga, skriv",
    descEn: "Chat, ask, write",
    url: "https://chat.openai.com",
    icon: MessageCircle,
  },
  {
    name: "Claude",
    descSv: "Bra på långa texter",
    descEn: "Great for long texts",
    url: "https://claude.ai",
    icon: PenLine,
  },
  {
    name: "Perplexity",
    descSv: "Research med källor",
    descEn: "Research with sources",
    url: "https://perplexity.ai",
    icon: Sparkles,
  },
  {
    name: "Gemini",
    descSv: "Googles AI-assistent",
    descEn: "Google's AI assistant",
    url: "https://gemini.google.com",
    icon: Sparkles,
  },
  {
    name: "Google Lens",
    descSv: "Identifiera med kameran",
    descEn: "Identify with camera",
    url: "https://lens.google.com",
    icon: Camera,
  },
];

// Swedish AI resources
const swedishLinks = [
  {
    name: "AI Sweden",
    descSv: "Sveriges nationella AI-center",
    descEn: "Sweden's national AI center",
    url: "https://www.ai.se",
  },
  {
    name: "Demensförbundet",
    descSv: "Stöd och information om demens",
    descEn: "Support and information about dementia",
    url: "https://www.demensforbundet.se",
  },
  {
    name: "1177 Vårdguiden – Alzheimer",
    descSv: "Fakta om Alzheimers sjukdom",
    descEn: "Facts about Alzheimer's disease",
    url: "https://www.1177.se/sjukdomar--besvar/hjarna-och-nerver/demenssjukdomar/alzheimers-sjukdom/",
  },
  {
    name: "Alzheimer's Association",
    descSv: "Internationell forskning och stöd (engelska)",
    descEn: "International research and support",
    url: "https://www.alz.org",
  },
  {
    name: "Anthropic",
    descSv: "Företaget bakom Claude AI",
    descEn: "The company behind Claude AI",
    url: "https://www.anthropic.com",
  },
];

// Cognitive help cards - each with a relevant link
const cognitiveHelp = [
  {
    icon: Bell, titleSv: "Påminnelser", titleEn: "Reminders",
    descSv: "Siri eller Google Assistant påminner om mediciner och möten.",
    descEn: "Siri or Google Assistant reminds you about meds and appointments.",
    url: "https://support.apple.com/sv-se/guide/iphone/iph5e81ca4c4/ios",
    linkSv: "Siri-guide", linkEn: "Siri guide",
  },
  {
    icon: Mic, titleSv: "Röststyrning", titleEn: "Voice control",
    descSv: "Styr allt med rösten. Inga knappar behövs.",
    descEn: "Control everything by voice. No buttons needed.",
    url: "https://assistant.google.com",
    linkSv: "Google Assistant", linkEn: "Google Assistant",
  },
  {
    icon: Shield, titleSv: "Falldetektering", titleEn: "Fall detection",
    descSv: "Apple Watch larmar anhöriga automatiskt vid fall.",
    descEn: "Apple Watch alerts family automatically if you fall.",
    url: "https://support.apple.com/sv-se/108896",
    linkSv: "Apple Watch", linkEn: "Apple Watch",
  },
  {
    icon: MessageCircle, titleSv: "Sällskap", titleEn: "Companionship",
    descSv: "ChatGPT pratar med dig om vad som helst, dygnet runt.",
    descEn: "ChatGPT talks with you about anything, 24/7.",
    url: "https://chat.openai.com",
    linkSv: "Öppna ChatGPT", linkEn: "Open ChatGPT",
  },
  {
    icon: FileText, titleSv: "Förenkla texter", titleEn: "Simplify texts",
    descSv: "Klistra in ett läkarbrev – AI förklarar på enkel svenska.",
    descEn: "Paste a doctor's letter – AI explains in plain language.",
    url: "https://claude.ai",
    linkSv: "Prova Claude", linkEn: "Try Claude",
  },
  {
    icon: Brain, titleSv: "Hjärnträning", titleEn: "Brain training",
    descSv: "Appar som Duolingo anpassar svårigheten efter dig.",
    descEn: "Apps like Duolingo adapt difficulty to your level.",
    url: "https://www.duolingo.com",
    linkSv: "Duolingo", linkEn: "Duolingo",
  },
  {
    icon: Camera, titleSv: "Identifiera saker", titleEn: "Identify things",
    descSv: "Rikta kameran mot ett piller eller skylt – AI berättar vad det är.",
    descEn: "Point camera at a pill or sign – AI tells you what it is.",
    url: "https://lens.google.com",
    linkSv: "Google Lens", linkEn: "Google Lens",
  },
  {
    icon: PenLine, titleSv: "Skrivhjälp", titleEn: "Writing help",
    descSv: "Berätta vad du vill säga – AI skriver mejlet.",
    descEn: "Tell AI what you want to say – it writes the email.",
    url: "https://chat.openai.com",
    linkSv: "Prova ChatGPT", linkEn: "Try ChatGPT",
  },
  {
    icon: ListChecks, titleSv: "Planera dagen", titleEn: "Plan the day",
    descSv: "AI bryter ner uppgifter i små steg och gör att-göra-listor.",
    descEn: "AI breaks tasks into small steps and creates to-do lists.",
    url: "https://www.todoist.com",
    linkSv: "Todoist", linkEn: "Todoist",
  },
  {
    icon: Headphones, titleSv: "Lyssna istället", titleEn: "Listen instead",
    descSv: "AI läser upp texter med naturlig röst.",
    descEn: "AI reads texts aloud with a natural voice.",
    url: "https://www.naturalreaders.com",
    linkSv: "Natural Reader", linkEn: "Natural Reader",
  },
  {
    icon: MapPin, titleSv: "Hitta hem", titleEn: "Find home",
    descSv: "Fråga AI: 'Hur tar jag mig hem?' – röstinstruktioner steg för steg.",
    descEn: "Ask AI: 'How do I get home?' – voice directions step by step.",
    url: "https://maps.google.com",
    linkSv: "Google Maps", linkEn: "Google Maps",
  },
  {
    icon: Languages, titleSv: "Översätt & förklara", titleEn: "Translate & explain",
    descSv: "Svårt ord? Skriv, tala eller fotografera – AI förklarar.",
    descEn: "Difficult word? Type, speak or photograph – AI explains.",
    url: "https://translate.google.com",
    linkSv: "Google Translate", linkEn: "Google Translate",
  },
];

// Spectacular AI achievements - each with a relevant link
const spectacular = [
  {
    icon: Heart, titleSv: "Hittar cancer i förväg", titleEn: "Detects cancer early",
    descSv: "Stanford-AI förutsäger lungcancer innan symtom uppstår.",
    descEn: "Stanford AI predicts lung cancer before symptoms appear.",
    url: "https://med.stanford.edu/news/all-news/2023/08/ai-lung-cancer.html",
    linkSv: "Stanford-studie", linkEn: "Stanford study",
  },
  {
    icon: Atom, titleSv: "Löste 50-årig gåta", titleEn: "Solved 50-year mystery",
    descSv: "AlphaFold kartlade 200 miljoner proteiner på ett år.",
    descEn: "AlphaFold mapped 200 million proteins in one year.",
    url: "https://alphafold.ebi.ac.uk",
    linkSv: "AlphaFold-databasen", linkEn: "AlphaFold database",
  },
  {
    icon: Car, titleSv: "Kör utan förare", titleEn: "Drives without driver",
    descSv: "Waymo kör 50 000 passagerare per vecka utan förare.",
    descEn: "Waymo drives 50,000 passengers per week without a driver.",
    url: "https://waymo.com",
    linkSv: "Waymo", linkEn: "Waymo",
  },
  {
    icon: Cloud, titleSv: "Förutsäger orkaner", titleEn: "Predicts hurricanes",
    descSv: "Googles GraphCast slår världens bästa vädersystem.",
    descEn: "Google's GraphCast beats the world's best weather systems.",
    url: "https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/",
    linkSv: "GraphCast", linkEn: "GraphCast",
  },
  {
    icon: Film, titleSv: "Skapar film från text", titleEn: "Creates video from text",
    descSv: "OpenAIs Sora genererar filmklipp från en textbeskrivning.",
    descEn: "OpenAI's Sora generates video clips from text descriptions.",
    url: "https://openai.com/sora",
    linkSv: "Sora", linkEn: "Sora",
  },
  {
    icon: Palette, titleSv: "Vann konstpriset", titleEn: "Won art prize",
    descSv: "En AI-målning vann Colorado State Fair 2022.",
    descEn: "An AI painting won Colorado State Fair 2022.",
    url: "https://www.midjourney.com",
    linkSv: "Midjourney", linkEn: "Midjourney",
  },
  {
    icon: Music, titleSv: "Komponerar musik", titleEn: "Composes music",
    descSv: "Suno skapar kompletta låtar med sång på sekunder.",
    descEn: "Suno creates complete songs with vocals in seconds.",
    url: "https://suno.com",
    linkSv: "Prova Suno", linkEn: "Try Suno",
  },
  {
    icon: Bot, titleSv: "Robotar arbetar", titleEn: "Robots work",
    descSv: "Tesla Optimus arbetar i fabriker. Ameca har mänskliga ansiktsuttryck.",
    descEn: "Tesla Optimus works in factories. Ameca has human facial expressions.",
    url: "https://www.engineeredarts.co.uk/robot/ameca/",
    linkSv: "Se Ameca", linkEn: "See Ameca",
  },
];

// AI you already use - each with a relevant link
const alreadyUse = [
  { icon: Sparkles, titleSv: "Streaming", titleEn: "Streaming", descSv: "Spotify väljer låtar baserat på ditt humör.", descEn: "Spotify picks songs based on your mood.", url: "https://www.spotify.com", linkSv: "Spotify", linkEn: "Spotify" },
  { icon: Mail, titleSv: "E-post", titleEn: "Email", descSv: "AI sorterar spam och skriver halva mejlet.", descEn: "AI sorts spam and writes half your email.", url: "https://mail.google.com", linkSv: "Gmail", linkEn: "Gmail" },
  { icon: Navigation, titleSv: "Navigation", titleEn: "Navigation", descSv: "Google Maps förutsäger köer innan de uppstår.", descEn: "Google Maps predicts traffic before it happens.", url: "https://maps.google.com", linkSv: "Google Maps", linkEn: "Google Maps" },
  { icon: Lock, titleSv: "Bankskydd", titleEn: "Bank security", descSv: "AI stoppar kortbedrägerier på millisekunder.", descEn: "AI stops card fraud in milliseconds.", url: "https://www.visa.se/om-visa/innovation/ai.html", linkSv: "Visa AI", linkEn: "Visa AI" },
  { icon: Camera, titleSv: "Ansiktslås", titleEn: "Face unlock", descSv: "Känner igen dig i 3D – säkrare än lösenord.", descEn: "Recognizes you in 3D – safer than passwords.", url: "https://support.apple.com/sv-se/108411", linkSv: "Face ID", linkEn: "Face ID" },
  { icon: Keyboard, titleSv: "Tangentbordet", titleEn: "Keyboard", descSv: "Förutsäger nästa ord du skriver.", descEn: "Predicts the next word you type.", url: "https://support.google.com/gboard", linkSv: "Gboard", linkEn: "Gboard" },
];

// Reusable card component with link
function FactCard({ icon: Icon, title, desc, url, linkText, variant = "light" }: {
  icon: typeof Bell;
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
        <Icon className="w-5 h-5 text-[#c05746]" />
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

export default function AIPage() {
  const { t } = useLanguage();

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

        {/* Cognitive help - 2 column grid */}
        <section className="container py-16">
          <h2 className="text-3xl text-foreground mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {t("AI som hjälpmedel", "AI as an aid")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("Tålmodigt. Aldrig dömande. Dygnet runt.", "Patient. Never judging. Around the clock.")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cognitiveHelp.map((item, i) => (
              <FactCard
                key={i}
                icon={item.icon}
                title={t(item.titleSv, item.titleEn)}
                desc={t(item.descSv, item.descEn)}
                url={item.url}
                linkText={t(item.linkSv, item.linkEn)}
              />
            ))}
          </div>
        </section>

        {/* Tools to try - 2 column grid */}
        <section className="bg-accent/30 py-16">
          <div className="container">
            <h2 className="text-3xl text-foreground mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {t("Verktyg att testa – gratis", "Tools to try – free")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t("Klicka för att prova direkt.", "Click to try right away.")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiTools.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <a
                    key={i}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-[#c05746]/30 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c05746]/10 to-[#c05746]/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#c05746]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-[#c05746] transition-colors">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground">{t(tool.descSv, tool.descEn)}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#c05746] transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Spectacular - 2 column grid */}
        <section className="bg-slate-900 py-16">
          <div className="container">
            <h2 className="text-3xl text-white mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
              {t("Det spektakulära", "The spectacular")}
            </h2>
            <p className="text-slate-400 mb-8">
              {t("Värt att känna till.", "Worth knowing about.")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spectacular.map((item, i) => (
                <FactCard
                  key={i}
                  icon={item.icon}
                  title={t(item.titleSv, item.titleEn)}
                  desc={t(item.descSv, item.descEn)}
                  url={item.url}
                  linkText={t(item.linkSv, item.linkEn)}
                  variant="dark"
                />
              ))}
            </div>
          </div>
        </section>

        {/* AI you already use - 2 column grid */}
        <section className="container py-16">
          <h2 className="text-3xl text-foreground mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {t("AI du redan använder", "AI you already use")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("Inbyggt i appar du använder varje dag.", "Built into apps you use every day.")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alreadyUse.map((item, i) => (
              <FactCard
                key={i}
                icon={item.icon}
                title={t(item.titleSv, item.titleEn)}
                desc={t(item.descSv, item.descEn)}
                url={item.url}
                linkText={t(item.linkSv, item.linkEn)}
              />
            ))}
          </div>
        </section>

        {/* Useful links - Swedish & English (moved to bottom) */}
        <section className="container py-16">
          <h2 className="text-3xl text-foreground mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
            {t("Användbara länkar", "Useful links")}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t("Svenska och internationella resurser.", "Swedish and international resources.")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swedishLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-5 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-[#c05746]/30 transition-all group"
              >
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-[#c05746] transition-colors">{link.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t(link.descSv, link.descEn)}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#c05746] transition-colors flex-shrink-0 ml-4" />
              </a>
            ))}
          </div>
        </section>

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

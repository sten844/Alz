/**
 * Seed script: populate ai_sections and ai_items tables with the current hardcoded AI page content.
 * Run: node seed-ai-page.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sections = [
  {
    section_key: "cognitive_help",
    title_sv: "AI som hjälpmedel",
    title_en: "AI as an aid",
    subtitle_sv: "Tålmodigt. Aldrig dömande. Dygnet runt.",
    subtitle_en: "Patient. Never judging. Around the clock.",
    sort_order: 1,
    visible: true,
    variant: "light",
  },
  {
    section_key: "tools",
    title_sv: "Verktyg att testa – gratis",
    title_en: "Tools to try – free",
    subtitle_sv: "Klicka för att prova direkt.",
    subtitle_en: "Click to try right away.",
    sort_order: 2,
    visible: true,
    variant: "accent",
  },
  {
    section_key: "spectacular",
    title_sv: "Det spektakulära",
    title_en: "The spectacular",
    subtitle_sv: "Värt att känna till.",
    subtitle_en: "Worth knowing about.",
    sort_order: 3,
    visible: true,
    variant: "dark",
  },
  {
    section_key: "already_use",
    title_sv: "AI du redan använder",
    title_en: "AI you already use",
    subtitle_sv: "Inbyggt i appar du använder varje dag.",
    subtitle_en: "Built into apps you use every day.",
    sort_order: 4,
    visible: true,
    variant: "light",
  },
  {
    section_key: "useful_links",
    title_sv: "Användbara länkar",
    title_en: "Useful links",
    subtitle_sv: "Svenska och internationella resurser.",
    subtitle_en: "Swedish and international resources.",
    sort_order: 5,
    visible: true,
    variant: "light",
  },
];

const items = [
  // cognitive_help
  { section_key: "cognitive_help", name_sv: "Påminnelser", name_en: "Reminders", desc_sv: "Siri eller Google Assistant påminner om mediciner och möten.", desc_en: "Siri or Google Assistant reminds you about meds and appointments.", url: "https://support.apple.com/sv-se/guide/iphone/iph5e81ca4c4/ios", link_text_sv: "Siri-guide", link_text_en: "Siri guide", icon_name: "Bell", sort_order: 1 },
  { section_key: "cognitive_help", name_sv: "Röststyrning", name_en: "Voice control", desc_sv: "Styr allt med rösten. Inga knappar behövs.", desc_en: "Control everything by voice. No buttons needed.", url: "https://assistant.google.com", link_text_sv: "Google Assistant", link_text_en: "Google Assistant", icon_name: "Mic", sort_order: 2 },
  { section_key: "cognitive_help", name_sv: "Falldetektering", name_en: "Fall detection", desc_sv: "Apple Watch larmar anhöriga automatiskt vid fall.", desc_en: "Apple Watch alerts family automatically if you fall.", url: "https://support.apple.com/sv-se/108896", link_text_sv: "Apple Watch", link_text_en: "Apple Watch", icon_name: "Shield", sort_order: 3 },
  { section_key: "cognitive_help", name_sv: "Sällskap", name_en: "Companionship", desc_sv: "ChatGPT pratar med dig om vad som helst, dygnet runt.", desc_en: "ChatGPT talks with you about anything, 24/7.", url: "https://chat.openai.com", link_text_sv: "Öppna ChatGPT", link_text_en: "Open ChatGPT", icon_name: "MessageCircle", sort_order: 4 },
  { section_key: "cognitive_help", name_sv: "Förenkla texter", name_en: "Simplify texts", desc_sv: "Klistra in ett läkarbrev – AI förklarar på enkel svenska.", desc_en: "Paste a doctor's letter – AI explains in plain language.", url: "https://claude.ai", link_text_sv: "Prova Claude", link_text_en: "Try Claude", icon_name: "FileText", sort_order: 5 },
  { section_key: "cognitive_help", name_sv: "Hjärnträning", name_en: "Brain training", desc_sv: "Appar som Duolingo anpassar svårigheten efter dig.", desc_en: "Apps like Duolingo adapt difficulty to your level.", url: "https://www.duolingo.com", link_text_sv: "Duolingo", link_text_en: "Duolingo", icon_name: "Brain", sort_order: 6 },
  { section_key: "cognitive_help", name_sv: "Identifiera saker", name_en: "Identify things", desc_sv: "Rikta kameran mot ett piller eller skylt – AI berättar vad det är.", desc_en: "Point camera at a pill or sign – AI tells you what it is.", url: "https://lens.google.com", link_text_sv: "Google Lens", link_text_en: "Google Lens", icon_name: "Camera", sort_order: 7 },
  { section_key: "cognitive_help", name_sv: "Skrivhjälp", name_en: "Writing help", desc_sv: "Berätta vad du vill säga – AI skriver mejlet.", desc_en: "Tell AI what you want to say – it writes the email.", url: "https://chat.openai.com", link_text_sv: "Prova ChatGPT", link_text_en: "Try ChatGPT", icon_name: "PenLine", sort_order: 8 },
  { section_key: "cognitive_help", name_sv: "Planera dagen", name_en: "Plan the day", desc_sv: "AI bryter ner uppgifter i små steg och gör att-göra-listor.", desc_en: "AI breaks tasks into small steps and creates to-do lists.", url: "https://www.todoist.com", link_text_sv: "Todoist", link_text_en: "Todoist", icon_name: "ListChecks", sort_order: 9 },
  { section_key: "cognitive_help", name_sv: "Lyssna istället", name_en: "Listen instead", desc_sv: "AI läser upp texter med naturlig röst.", desc_en: "AI reads texts aloud with a natural voice.", url: "https://www.naturalreaders.com", link_text_sv: "Natural Reader", link_text_en: "Natural Reader", icon_name: "Headphones", sort_order: 10 },
  { section_key: "cognitive_help", name_sv: "Hitta hem", name_en: "Find home", desc_sv: "Fråga AI: 'Hur tar jag mig hem?' – röstinstruktioner steg för steg.", desc_en: "Ask AI: 'How do I get home?' – voice directions step by step.", url: "https://maps.google.com", link_text_sv: "Google Maps", link_text_en: "Google Maps", icon_name: "MapPin", sort_order: 11 },
  { section_key: "cognitive_help", name_sv: "Översätt & förklara", name_en: "Translate & explain", desc_sv: "Svårt ord? Skriv, tala eller fotografera – AI förklarar.", desc_en: "Difficult word? Type, speak or photograph – AI explains.", url: "https://translate.google.com", link_text_sv: "Google Translate", link_text_en: "Google Translate", icon_name: "Languages", sort_order: 12 },

  // tools
  { section_key: "tools", name_sv: "ChatGPT", name_en: "ChatGPT", desc_sv: "Prata, fråga, skriv", desc_en: "Chat, ask, write", url: "https://chat.openai.com", link_text_sv: "ChatGPT", link_text_en: "ChatGPT", icon_name: "MessageCircle", sort_order: 1 },
  { section_key: "tools", name_sv: "Claude", name_en: "Claude", desc_sv: "Bra på långa texter", desc_en: "Great for long texts", url: "https://claude.ai", link_text_sv: "Claude", link_text_en: "Claude", icon_name: "PenLine", sort_order: 2 },
  { section_key: "tools", name_sv: "Perplexity", name_en: "Perplexity", desc_sv: "Research med källor", desc_en: "Research with sources", url: "https://perplexity.ai", link_text_sv: "Perplexity", link_text_en: "Perplexity", icon_name: "Sparkles", sort_order: 3 },
  { section_key: "tools", name_sv: "Gemini", name_en: "Gemini", desc_sv: "Googles AI-assistent", desc_en: "Google's AI assistant", url: "https://gemini.google.com", link_text_sv: "Gemini", link_text_en: "Gemini", icon_name: "Sparkles", sort_order: 4 },
  { section_key: "tools", name_sv: "Google Lens", name_en: "Google Lens", desc_sv: "Identifiera med kameran", desc_en: "Identify with camera", url: "https://lens.google.com", link_text_sv: "Google Lens", link_text_en: "Google Lens", icon_name: "Camera", sort_order: 5 },

  // spectacular
  { section_key: "spectacular", name_sv: "Hittar cancer i förväg", name_en: "Detects cancer early", desc_sv: "Stanford-AI förutsäger lungcancer innan symtom uppstår.", desc_en: "Stanford AI predicts lung cancer before symptoms appear.", url: "https://med.stanford.edu/news/all-news/2023/08/ai-lung-cancer.html", link_text_sv: "Stanford-studie", link_text_en: "Stanford study", icon_name: "Heart", sort_order: 1 },
  { section_key: "spectacular", name_sv: "Löste 50-årig gåta", name_en: "Solved 50-year mystery", desc_sv: "AlphaFold kartlade 200 miljoner proteiner på ett år.", desc_en: "AlphaFold mapped 200 million proteins in one year.", url: "https://alphafold.ebi.ac.uk", link_text_sv: "AlphaFold-databasen", link_text_en: "AlphaFold database", icon_name: "Atom", sort_order: 2 },
  { section_key: "spectacular", name_sv: "Kör utan förare", name_en: "Drives without driver", desc_sv: "Waymo kör 50 000 passagerare per vecka utan förare.", desc_en: "Waymo drives 50,000 passengers per week without a driver.", url: "https://waymo.com", link_text_sv: "Waymo", link_text_en: "Waymo", icon_name: "Car", sort_order: 3 },
  { section_key: "spectacular", name_sv: "Förutsäger orkaner", name_en: "Predicts hurricanes", desc_sv: "Googles GraphCast slår världens bästa vädersystem.", desc_en: "Google's GraphCast beats the world's best weather systems.", url: "https://deepmind.google/discover/blog/graphcast-ai-model-for-faster-and-more-accurate-global-weather-forecasting/", link_text_sv: "GraphCast", link_text_en: "GraphCast", icon_name: "Cloud", sort_order: 4 },
  { section_key: "spectacular", name_sv: "Skapar film från text", name_en: "Creates video from text", desc_sv: "OpenAIs Sora genererar filmklipp från en textbeskrivning.", desc_en: "OpenAI's Sora generates video clips from text descriptions.", url: "https://openai.com/sora", link_text_sv: "Sora", link_text_en: "Sora", icon_name: "Film", sort_order: 5 },
  { section_key: "spectacular", name_sv: "Vann konstpriset", name_en: "Won art prize", desc_sv: "En AI-målning vann Colorado State Fair 2022.", desc_en: "An AI painting won Colorado State Fair 2022.", url: "https://www.midjourney.com", link_text_sv: "Midjourney", link_text_en: "Midjourney", icon_name: "Palette", sort_order: 6 },
  { section_key: "spectacular", name_sv: "Komponerar musik", name_en: "Composes music", desc_sv: "Suno skapar kompletta låtar med sång på sekunder.", desc_en: "Suno creates complete songs with vocals in seconds.", url: "https://suno.com", link_text_sv: "Prova Suno", link_text_en: "Try Suno", icon_name: "Music", sort_order: 7 },
  { section_key: "spectacular", name_sv: "Robotar arbetar", name_en: "Robots work", desc_sv: "Tesla Optimus arbetar i fabriker. Ameca har mänskliga ansiktsuttryck.", desc_en: "Tesla Optimus works in factories. Ameca has human facial expressions.", url: "https://www.engineeredarts.co.uk/robot/ameca/", link_text_sv: "Se Ameca", link_text_en: "See Ameca", icon_name: "Bot", sort_order: 8 },

  // already_use
  { section_key: "already_use", name_sv: "Streaming", name_en: "Streaming", desc_sv: "Spotify väljer låtar baserat på ditt humör.", desc_en: "Spotify picks songs based on your mood.", url: "https://www.spotify.com", link_text_sv: "Spotify", link_text_en: "Spotify", icon_name: "Sparkles", sort_order: 1 },
  { section_key: "already_use", name_sv: "E-post", name_en: "Email", desc_sv: "AI sorterar spam och skriver halva mejlet.", desc_en: "AI sorts spam and writes half your email.", url: "https://mail.google.com", link_text_sv: "Gmail", link_text_en: "Gmail", icon_name: "Mail", sort_order: 2 },
  { section_key: "already_use", name_sv: "Navigation", name_en: "Navigation", desc_sv: "Google Maps förutsäger köer innan de uppstår.", desc_en: "Google Maps predicts traffic before it happens.", url: "https://maps.google.com", link_text_sv: "Google Maps", link_text_en: "Google Maps", icon_name: "Navigation", sort_order: 3 },
  { section_key: "already_use", name_sv: "Bankskydd", name_en: "Bank security", desc_sv: "AI stoppar kortbedrägerier på millisekunder.", desc_en: "AI stops card fraud in milliseconds.", url: "https://www.visa.se/om-visa/innovation/ai.html", link_text_sv: "Visa AI", link_text_en: "Visa AI", icon_name: "Lock", sort_order: 4 },
  { section_key: "already_use", name_sv: "Ansiktslås", name_en: "Face unlock", desc_sv: "Känner igen dig i 3D – säkrare än lösenord.", desc_en: "Recognizes you in 3D – safer than passwords.", url: "https://support.apple.com/sv-se/108411", link_text_sv: "Face ID", link_text_en: "Face ID", icon_name: "Camera", sort_order: 5 },
  { section_key: "already_use", name_sv: "Tangentbordet", name_en: "Keyboard", desc_sv: "Förutsäger nästa ord du skriver.", desc_en: "Predicts the next word you type.", url: "https://support.google.com/gboard", link_text_sv: "Gboard", link_text_en: "Gboard", icon_name: "Keyboard", sort_order: 6 },

  // useful_links
  { section_key: "useful_links", name_sv: "AI Sweden", name_en: "AI Sweden", desc_sv: "Sveriges nationella AI-center", desc_en: "Sweden's national AI center", url: "https://www.ai.se", link_text_sv: "AI Sweden", link_text_en: "AI Sweden", icon_name: "Sparkles", sort_order: 1 },
  { section_key: "useful_links", name_sv: "Demensförbundet", name_en: "Demensförbundet", desc_sv: "Stöd och information om demens", desc_en: "Support and information about dementia", url: "https://www.demensforbundet.se", link_text_sv: "Demensförbundet", link_text_en: "Demensförbundet", icon_name: "Heart", sort_order: 2 },
  { section_key: "useful_links", name_sv: "1177 Vårdguiden – Alzheimer", name_en: "1177 Vårdguiden – Alzheimer", desc_sv: "Fakta om Alzheimers sjukdom", desc_en: "Facts about Alzheimer's disease", url: "https://www.1177.se/sjukdomar--besvar/hjarna-och-nerver/demenssjukdomar/alzheimers-sjukdom/", link_text_sv: "1177", link_text_en: "1177", icon_name: "Heart", sort_order: 3 },
  { section_key: "useful_links", name_sv: "Alzheimer's Association", name_en: "Alzheimer's Association", desc_sv: "Internationell forskning och stöd (engelska)", desc_en: "International research and support", url: "https://www.alz.org", link_text_sv: "Alzheimer's Association", link_text_en: "Alzheimer's Association", icon_name: "Heart", sort_order: 4 },
  { section_key: "useful_links", name_sv: "Anthropic", name_en: "Anthropic", desc_sv: "Företaget bakom Claude AI", desc_en: "The company behind Claude AI", url: "https://www.anthropic.com", link_text_sv: "Anthropic", link_text_en: "Anthropic", icon_name: "Bot", sort_order: 5 },
];

async function seed() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Check if data already exists
    const [existingSections] = await conn.execute("SELECT COUNT(*) as cnt FROM ai_sections");
    if (existingSections[0].cnt > 0) {
      console.log("AI page data already exists in database. Skipping seed.");
      await conn.end();
      return;
    }

    console.log("Seeding AI page sections...");
    for (const s of sections) {
      await conn.execute(
        "INSERT INTO ai_sections (section_key, title_sv, title_en, subtitle_sv, subtitle_en, sort_order, visible, variant) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [s.section_key, s.title_sv, s.title_en, s.subtitle_sv, s.subtitle_en, s.sort_order, s.visible ? 1 : 0, s.variant]
      );
    }
    console.log(`  ✓ ${sections.length} sections inserted`);

    console.log("Seeding AI page items...");
    for (const item of items) {
      await conn.execute(
        "INSERT INTO ai_items (section_key, name_sv, name_en, desc_sv, desc_en, url, link_text_sv, link_text_en, icon_name, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [item.section_key, item.name_sv, item.name_en, item.desc_sv, item.desc_en, item.url, item.link_text_sv, item.link_text_en, item.icon_name, item.sort_order, 1]
      );
    }
    console.log(`  ✓ ${items.length} items inserted`);

    console.log("Done! AI page content seeded successfully.");
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await conn.end();
  }
}

seed();

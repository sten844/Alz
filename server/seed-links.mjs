import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const links = [
  // Swedish resources
  {
    category: "swedish",
    name_sv: "Alzheimer Sverige",
    name_en: "Alzheimer Sweden",
    desc_sv: "Stöd till patienter och anhöriga. Rådgivning, information och opinionsarbete.",
    desc_en: "Support for patients and families. Counseling, information and advocacy.",
    url: "https://www.alzheimerforeningen.se",
    sort_order: 1,
    visible: true,
  },
  {
    category: "swedish",
    name_sv: "Alzheimerfonden",
    name_en: "The Alzheimer Foundation",
    desc_sv: "Finansierar svensk forskning om demens. Populärvetenskapliga artiklar och nyheter.",
    desc_en: "Funds Swedish dementia research. Popular science articles and news.",
    url: "https://www.alzheimerfonden.se",
    sort_order: 2,
    visible: true,
  },
  {
    category: "swedish",
    name_sv: "Demensförbundet",
    name_en: "The Dementia Association",
    desc_sv: "Information, stöd och forskning. Driver Demensfonden.",
    desc_en: "Information, support and research. Runs the Dementia Fund.",
    url: "https://www.demensforbundet.se",
    sort_order: 3,
    visible: true,
  },
  {
    category: "swedish",
    name_sv: "Svenskt Demenscentrum",
    name_en: "Swedish Dementia Centre",
    desc_sv: "Nationellt kunskapscentrum. Evidensbaserad information för vård och allmänhet.",
    desc_en: "National knowledge center. Evidence-based information for healthcare and the public.",
    url: "https://www.demenscentrum.se",
    sort_order: 4,
    visible: true,
  },
  {
    category: "swedish",
    name_sv: "Karolinska Institutet Center for Alzheimer Research",
    name_en: "Karolinska Institutet Center for Alzheimer Research",
    desc_sv: "Forskning från molekylnivå till klinik. En av Sveriges viktigaste forskningsmiljöer.",
    desc_en: "Research from molecular level to clinic. One of Sweden's most important research environments.",
    url: "https://ki.se",
    sort_order: 5,
    visible: true,
  },
  // International resources
  {
    category: "international",
    name_sv: "Alzheimer's Association",
    name_en: "Alzheimer's Association",
    desc_sv: "Världsledande organisation. Information om behandling, symtom och stöd. Stora satsningar på forskning.",
    desc_en: "World-leading organization. Information on treatment, symptoms and support. Major research investments.",
    url: "https://www.alz.org",
    sort_order: 10,
    visible: true,
  },
  {
    category: "international",
    name_sv: "Alzheimer's Disease International",
    name_en: "Alzheimer's Disease International",
    desc_sv: "Global samarbetsorganisation. Samlar Alzheimerorganisationer världen över.",
    desc_en: "Global collaborative organization. Unites Alzheimer organizations worldwide.",
    url: "https://www.alzint.org",
    sort_order: 11,
    visible: true,
  },
  {
    category: "international",
    name_sv: "Alzheimer Europe",
    name_en: "Alzheimer Europe",
    desc_sv: "Europeisk policy, forskning och statistik. Bra översikter över utvecklingen i EU.",
    desc_en: "European policy, research and statistics. Good overviews of developments in the EU.",
    url: "https://www.alzheimer-europe.org",
    sort_order: 12,
    visible: true,
  },
];

async function seed() {
  for (const link of links) {
    await db.execute(sql`INSERT INTO resource_links (category, name_sv, name_en, desc_sv, desc_en, url, sort_order, visible) VALUES (${link.category}, ${link.name_sv}, ${link.name_en}, ${link.desc_sv}, ${link.desc_en}, ${link.url}, ${link.sort_order}, ${link.visible})`);
    console.log(`Seeded: ${link.name_sv}`);
  }
  console.log("Done seeding resource links!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

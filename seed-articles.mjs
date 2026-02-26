import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// All articles extracted from the static data file
const articles = [
  {
    title: "Min behandlingsplan",
    excerpt: "Min variant av femfingermodellen: Medicin + kost som ett system",
    category: "Behandling",
    language: "sv",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/YbglPANoQRTtiZxg.png",
    publishedAt: "2026-02-15",
    published: true,
  },
  {
    title: "AI och alzheimer",
    excerpt: "AI har blivit min livlina efter jag fått Alzheimerdiagnosen",
    category: "Vardagsliv",
    language: "sv",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/EPhJHiwgqLNNqEFo.png",
    publishedAt: "2026-01-15",
    published: true,
  },
  {
    title: "Självtestning: Kan jag lita på mig själv?",
    excerpt: "Hur jag testar min egen kognitiva förmåga och vad det betyder",
    category: "Vardagsliv",
    language: "sv",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/jeEdsAXfvgtrREvb.png",
    publishedAt: "2025-12-20",
    published: true,
  },
  {
    title: "Min behandlingsplan: Vetenskaplig bakgrund",
    excerpt: "Vad forskningen visar och inte visar om min behandlingsplan",
    category: "Forskning",
    language: "sv",
    imageUrl: null,
    publishedAt: "2026-02-04",
    published: true,
  },
  {
    title: "Lecanemab – det första bromsmedicinet",
    excerpt: "Vad vi vet om det första godkända bromsmedicinet mot Alzheimers",
    category: "Läkemedel",
    language: "sv",
    imageUrl: null,
    publishedAt: "2025-11-10",
    published: true,
  },
  {
    title: "Vad händer i hjärnan?",
    excerpt: "En förenklad guide till vad Alzheimers gör med hjärnan",
    category: "Forskning",
    language: "sv",
    imageUrl: null,
    publishedAt: "2025-10-05",
    published: true,
  },
  {
    title: "Att leva med diagnosen",
    excerpt: "Tankar och reflektioner om att få en Alzheimerdiagnos",
    category: "Vardagsliv",
    language: "sv",
    imageUrl: null,
    publishedAt: "2025-09-15",
    published: true,
  },
  // English articles
  {
    title: "My Treatment Plan",
    excerpt: "My variant of the five-finger model: Medicine + diet as a system",
    category: "Behandling",
    language: "en",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/YbglPANoQRTtiZxg.png",
    publishedAt: "2026-02-15",
    published: true,
  },
  {
    title: "AI and Alzheimer's",
    excerpt: "AI has become my lifeline after being diagnosed with Alzheimer's",
    category: "Vardagsliv",
    language: "en",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/EPhJHiwgqLNNqEFo.png",
    publishedAt: "2026-01-15",
    published: true,
  },
  {
    title: "Self-Testing: Can I Trust Myself?",
    excerpt: "How I test my own cognitive ability and what it means",
    category: "Vardagsliv",
    language: "en",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663318206043/jeEdsAXfvgtrREvb.png",
    publishedAt: "2025-12-20",
    published: true,
  },
  {
    title: "My Treatment Plan: Scientific Background",
    excerpt: "What research shows and doesn't show about my treatment plan",
    category: "Forskning",
    language: "en",
    imageUrl: null,
    publishedAt: "2026-02-04",
    published: true,
  },
  {
    title: "Lecanemab – The First Disease-Modifying Drug",
    excerpt: "What we know about the first approved disease-modifying drug for Alzheimer's",
    category: "Läkemedel",
    language: "en",
    imageUrl: null,
    publishedAt: "2025-11-10",
    published: true,
  },
  {
    title: "What Happens in the Brain?",
    excerpt: "A simplified guide to what Alzheimer's does to the brain",
    category: "Forskning",
    language: "en",
    imageUrl: null,
    publishedAt: "2025-10-05",
    published: true,
  },
  {
    title: "Living with the Diagnosis",
    excerpt: "Thoughts and reflections on receiving an Alzheimer's diagnosis",
    category: "Vardagsliv",
    language: "en",
    imageUrl: null,
    publishedAt: "2025-09-15",
    published: true,
  },
];

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Check if articles already exist
  const [existing] = await connection.execute('SELECT COUNT(*) as count FROM articles');
  if (existing[0].count > 0) {
    console.log(`Database already has ${existing[0].count} articles. Skipping seed.`);
    await connection.end();
    return;
  }

  // Read full content from the TypeScript file
  const fs = await import('fs');
  const fileContent = fs.readFileSync('/home/ubuntu/jagochminalzheimer/client/src/data/articles.ts', 'utf-8');
  
  // Extract content blocks using regex
  const contentRegex = /content:\s*`([^`]*)`/g;
  const contents = [];
  let match;
  while ((match = contentRegex.exec(fileContent)) !== null) {
    contents.push(match[1]);
  }
  
  console.log(`Found ${contents.length} content blocks`);
  
  // Match articles with their content
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const content = contents[i] || article.excerpt;
    
    await connection.execute(
      `INSERT INTO articles (title, excerpt, content, category, language, imageUrl, publishedAt, published) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.title,
        article.excerpt,
        content,
        article.category,
        article.language,
        article.imageUrl,
        article.publishedAt,
        article.published ? 1 : 0,
      ]
    );
    console.log(`Inserted: ${article.title} (${article.language})`);
  }
  
  console.log(`\nDone! Inserted ${articles.length} articles.`);
  await connection.end();
}

main().catch(console.error);

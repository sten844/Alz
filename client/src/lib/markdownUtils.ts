import TurndownService from "turndown";

// ---- Markdown → HTML ----
// Simple markdown to HTML converter for the content we use
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "<p></p>";

  let html = markdown;

  // Escape HTML entities first
  // (skip this since we want to preserve any existing HTML)

  // Split into lines for processing
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;
  let listType: "ul" | "ol" | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      if (inList) {
        result.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
        listType = null;
      }
      result.push("<hr>");
      continue;
    }

    // Headings
    if (/^### (.+)$/.test(line)) {
      if (inList) {
        result.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
        listType = null;
      }
      const match = line.match(/^### (.+)$/);
      if (match) {
        result.push(`<h3>${processInline(match[1])}</h3>`);
        continue;
      }
    }
    if (/^## (.+)$/.test(line)) {
      if (inList) {
        result.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
        listType = null;
      }
      const match = line.match(/^## (.+)$/);
      if (match) {
        result.push(`<h2>${processInline(match[1])}</h2>`);
        continue;
      }
    }
    if (/^# (.+)$/.test(line)) {
      if (inList) {
        result.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
        listType = null;
      }
      const match = line.match(/^# (.+)$/);
      if (match) {
        result.push(`<h1>${processInline(match[1])}</h1>`);
        continue;
      }
    }

    // Unordered list
    if (/^[-*] (.+)$/.test(line.trim())) {
      const match = line.trim().match(/^[-*] (.+)$/);
      if (match) {
        if (!inList || listType !== "ul") {
          if (inList) result.push(listType === "ul" ? "</ul>" : "</ol>");
          result.push("<ul>");
          inList = true;
          listType = "ul";
        }
        result.push(`<li>${processInline(match[1])}</li>`);
        continue;
      }
    }

    // Ordered list
    if (/^\d+\. (.+)$/.test(line.trim())) {
      const match = line.trim().match(/^\d+\. (.+)$/);
      if (match) {
        if (!inList || listType !== "ol") {
          if (inList) result.push(listType === "ul" ? "</ul>" : "</ol>");
          result.push("<ol>");
          inList = true;
          listType = "ol";
        }
        result.push(`<li>${processInline(match[1])}</li>`);
        continue;
      }
    }

    // Close list if we're in one and this isn't a list item
    if (inList) {
      result.push(listType === "ul" ? "</ul>" : "</ol>");
      inList = false;
      listType = null;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      continue;
    }

    // Regular paragraph
    // Check if next lines are also regular text (merge into one paragraph)
    let paragraph = processInline(line);
    result.push(`<p>${paragraph}</p>`);
  }

  if (inList) {
    result.push(listType === "ul" ? "</ul>" : "</ol>");
  }

  return result.join("") || "<p></p>";
}

// Process inline markdown: bold, italic
function processInline(text: string): string {
  // Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic: *text* or _text_ (but not inside bold)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "<em>$1</em>");
  return text;
}

// ---- HTML → Markdown ----
const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});

export function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>" || html === "<p><br></p>") return "";
  
  try {
    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (e) {
    console.error("Error converting HTML to markdown:", e);
    return html; // Return raw HTML as fallback
  }
}

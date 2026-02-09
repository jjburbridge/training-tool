/**
 * Extracts page context from the current document for the chat assistant.
 * Runs in the browser only.
 */
export function getPageContext(): string {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return "Page context unavailable (not in browser)";
  }

  const lines: string[] = [];

  // URL and title
  lines.push(`# Page Context`);
  lines.push("");
  lines.push(`**URL:** ${window.location.href}`);
  lines.push(`**Title:** ${document.title}`);
  lines.push("");

  // Meta description if present
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc?.getAttribute("content")) {
    lines.push(`**Description:** ${metaDesc.getAttribute("content")}`);
    lines.push("");
  }

  // Main content - prefer main, then look for content areas
  const main =
    document.querySelector("main") ??
    document.querySelector("[role='main']") ??
    document.body;

  // Headings (h1-h6)
  const headings = main.querySelectorAll("h1, h2, h3, h4, h5, h6");
  if (headings.length > 0) {
    lines.push("## Headings");
    headings.forEach((h) => {
      const level = parseInt(h.tagName.charAt(1), 10);
      const indent = "  ".repeat(level - 1);
      const text = h.textContent?.trim();
      if (text) lines.push(`${indent}- ${h.tagName}: ${text}`);
    });
    lines.push("");
  }

  // Links (limit to avoid huge output)
  const links = Array.from(main.querySelectorAll("a[href]")).slice(0, 30);
  if (links.length > 0) {
    lines.push("## Links");
    links.forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      const text = a.textContent?.trim()?.slice(0, 80) ?? "";
      if (href && !href.startsWith("#")) {
        lines.push(`- [${text || href}](${href})`);
      }
    });
    lines.push("");
  }

  // Lists (first 20 items)
  const listItems = main.querySelectorAll("ul li, ol li");
  if (listItems.length > 0) {
    lines.push("## List Items");
    Array.from(listItems)
      .slice(0, 20)
      .forEach((li) => {
        const text = li.textContent?.trim()?.slice(0, 100);
        if (text) lines.push(`- ${text}`);
      });
  }

  return lines.join("\n").trim() || "No structured content found.";
}

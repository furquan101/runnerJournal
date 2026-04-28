function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const HTML_BODY_RX = /^<(p|div|h[1-6]|ul|ol|blockquote|pre|figure)[\s>]/i;

export function legacyTextToHtml(text: string): string {
  if (!text) return "";
  if (HTML_BODY_RX.test(text.trimStart())) return text;
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function isEmptyHtml(html: string): boolean {
  if (!html) return true;
  const stripped = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "").trim();
  return stripped.length === 0;
}

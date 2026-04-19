/**
 * Плоский превью-текст из markdown для карточек (без рендера Tiptap).
 */
export function noteBodyPlainPreview(markdown: string, maxLen: number): string {
  const t = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!?\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_\-~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen)}…`
}

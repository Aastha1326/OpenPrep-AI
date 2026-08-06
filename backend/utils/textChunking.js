/**
 * Splits long text into semantic chunks without losing content.
 *
 * Instead of silently truncating large notes at a hard character cap, this
 * helper breaks the input at natural boundaries (paragraphs, lines,
 * sentences, then words) so downstream multi-pass Gemini processing can
 * cover the entire document.
 *
 * @param {string} text - The text to split.
 * @param {number} maxChars - Maximum length of each chunk.
 * @returns {string[]} Non-empty chunks; each chunk length <= maxChars.
 */
function splitIntoChunks(text, maxChars) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = findChunkEnd(clean, start, maxChars);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start = end;
  }

  return chunks;
}

/**
 * Finds the ideal cut point for the chunk starting at `start`, preferring
 * natural boundaries within the window instead of a hard mid-word cut.
 */
function findChunkEnd(text, start, maxChars) {
  const end = start + maxChars;
  if (end >= text.length) return text.length;

  // Prefer paragraph boundaries (double newline)
  const paragraph = text.lastIndexOf('\n\n', end);
  if (paragraph > start) return paragraph;

  // Then single line boundaries
  const line = text.lastIndexOf('\n', end);
  if (line > start) return line;

  // Then sentence boundaries
  for (const separator of ['. ', '? ', '! ']) {
    const sentence = text.lastIndexOf(separator, end);
    if (sentence > start) return sentence + separator.length;
  }

  // Then word boundaries
  const space = text.lastIndexOf(' ', end);
  if (space > start) return space + 1;

  // No boundary found in the window - hard cut
  return end;
}

module.exports = { splitIntoChunks };

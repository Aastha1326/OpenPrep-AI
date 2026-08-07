export function splitSentences(text) {
  if (!text || typeof text !== 'string') return [];

  const sentences = [];
  const regex = /[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const piece = match[0];
    if (!piece.trim()) continue;
    sentences.push({
      text: piece.trim(),
      start: match.index,
      end: match.index + piece.length,
    });
  }

  return sentences;
}

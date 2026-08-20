/**
 * Split text into sentences, reporting where each one actually sits.
 *
 * The offsets matter as much as the text: `useTextToSpeech` maps the
 * `charIndex` of a Web Speech `boundary` event back to a sentence to drive the
 * read-along highlight. That only works if `start`/`end` describe the exact
 * substring returned in `text`.
 *
 * Two properties this guarantees, both of which the previous implementation
 * broke:
 *
 *  - `source.slice(start, end) === text`. Offsets used to be taken from the
 *    untrimmed regex match, while `text` was trimmed, so every range was
 *    shifted by the leading whitespace the regex had swallowed.
 *  - Ranges never overlap. `end` of one sentence used to equal `start` of the
 *    next, so a boundary landing on a sentence start matched the previous
 *    sentence instead.
 *
 * @param {string} text
 * @returns {Array<{ text: string, start: number, end: number }>}
 */
export function splitSentences(text) {
  if (!text || typeof text !== 'string') return [];

  const sentences = [];
  // A run of non-terminator characters, then any terminators, then any
  // trailing closing punctuation ("He said 'go!'"). The final alternative
  // catches a last fragment with no terminator at all.
  const regex = /[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const piece = match[0];
    const trimmed = piece.trim();
    if (!trimmed) continue;

    // The regex consumes the whitespace that follows the previous terminator,
    // so `piece` usually starts with it. Skip past it before recording the
    // offset, and stop at the last non-whitespace character.
    const leading = piece.length - piece.trimStart().length;
    const start = match.index + leading;

    sentences.push({
      text: trimmed,
      start,
      end: start + trimmed.length,
    });
  }

  return sentences;
}

/**
 * Find the sentence being spoken at `charIndex`.
 *
 * Picks the last sentence that starts at or before the index rather than
 * testing `start <= i <= end`. A boundary event fires at the first character
 * of a word, which for the first word of a sentence is exactly that
 * sentence's `start`; an inclusive two-sided test matched the previous
 * sentence there and returned early.
 *
 * @param {Array<{ start: number, end: number }>} sentences from splitSentences
 * @param {number} charIndex offset into the same string the sentences came from
 * @returns {number} index into `sentences`, or -1 when there is no match
 */
export function findSentenceAt(sentences, charIndex) {
  if (!Array.isArray(sentences) || sentences.length === 0) return -1;
  if (!Number.isFinite(charIndex) || charIndex < 0) return -1;

  let found = -1;
  for (let i = 0; i < sentences.length; i += 1) {
    if (sentences[i].start > charIndex) break;
    found = i;
  }

  return found;
}

/**
 * Break text into renderable segments: each sentence plus the exact whitespace
 * that preceded it.
 *
 * `HighlightedText` used to rejoin sentences with a hard-coded single space,
 * which collapsed every newline in a note into one run-on paragraph. Carrying
 * the original gap keeps paragraph breaks intact.
 *
 * @param {string} text
 * @returns {Array<{ lead: string, text: string, index: number }>}
 */
export function toSentenceSegments(text) {
  if (!text || typeof text !== 'string') return [];

  const sentences = splitSentences(text);
  let cursor = 0;

  const segments = sentences.map((sentence, index) => {
    const lead = text.slice(cursor, sentence.start);
    cursor = sentence.end;
    return { lead, text: sentence.text, index };
  });

  // Anything after the final sentence (trailing whitespace) is appended to the
  // last segment so no character of the source is dropped.
  const tail = text.slice(cursor);
  if (tail && segments.length > 0) {
    segments[segments.length - 1].trail = tail;
  }

  return segments;
}

/**
 * Strip Markdown formatting syntax from text so SpeechSynthesis reads natural spoken prose.
 * Removes bold asterisks (**text**), italics (*text*), inline code (`code`), headers (#), links, and LaTeX math.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .trim();
}

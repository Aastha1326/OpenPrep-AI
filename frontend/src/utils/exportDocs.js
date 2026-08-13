/**
 * Client-side document builders for formatted PDF (html2pdf) and EPUB (EPUB 3)
 * exports of flashcard decks and study notes.
 *
 * - Math ($...$ / $$...$$ LaTeX) is rendered with KaTeX for PDF output.
 * - EPUB chapters preserve headings, lists, bold/italic and inline code;
 *   math is shown as monospace LaTeX so it stays readable in any e-reader.
 */
import katex from 'katex';
import katexCss from 'katex/dist/katex.min.css?raw';
import JSZip from 'jszip';
import html2pdf from 'html2pdf.js';

export const LAYOUTS = ['grid', 'list', 'compact'];

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const mathPlaceholder = (index) => `\u0000KATEX_MATH_${index}\u0000`;

/**
 * Replace $...$ (inline) and $$...$$ (block) math in `text` with KaTeX HTML.
 * Returns { text, fragments } where text still holds placeholders — callers
 * run markdown processing first, then substitute fragments back.
 */
function renderMathFragments(text) {
  const fragments = [];
  const replaced = String(text ?? '').replace(
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g,
    (match) => {
      const isBlock = match.startsWith('$$');
      const raw = match.slice(isBlock ? 2 : 1, isBlock ? -2 : -1).trim();
      let html;
      try {
        html = katex.renderToString(raw, { displayMode: isBlock, throwOnError: false });
      } catch (err) {
        console.error('KaTeX export error:', err);
        html = escapeHtml(match);
      }
      const index = fragments.length;
      fragments.push(
        isBlock
          ? `<div class="math-block">${html}</div>`
          : `<span class="math-inline">${html}</span>`
      );
      return mathPlaceholder(index);
    }
  );
  return { text: replaced, fragments };
}

const restoreMath = (text, fragments) =>
  // eslint-disable-next-line no-control-regex
  String(text).replace(/[\u0000]KATEX_MATH_(\d+)[\u0000]/g, (_, index) => fragments[Number(index)] ?? '');

/**
 * Math for EPUB: keeps the raw LaTeX in styled <code> blocks so formulas stay
 * readable in e-readers without embedded webfonts.
 */
function renderMathForEPUB(text) {
  return String(text ?? '').replace(
    /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g,
    (match) => {
      const isBlock = match.startsWith('$$');
      const raw = escapeHtml(match.slice(isBlock ? 2 : 1, isBlock ? -2 : -1).trim());
      return isBlock
        ? `<div class="math-block"><code>${raw}</code></div>`
        : `<span class="math-inline"><code>${raw}</code></span>`;
    }
  );
}

/**
 * Lightweight markdown → HTML for export documents (headings, paragraphs,
 * bold, italic, inline/block code, lists, blockquotes, horizontal rules).
 */
export function markdownToHTML(md) {
  const escaped = (str) => {
    const codeSpans = [];
    const html = escapeHtml(str).replace(/`([^`]+)`/g, (m, code) => {
      const index = codeSpans.length;
      codeSpans.push(`<code>${code}</code>`);
      return `\u0001CODE_SPAN_${index}\u0001`;
    });
    return html
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0001]CODE_SPAN_(\d+)[\u0001]/g, (_, index) => codeSpans[Number(index)] ?? '');
  };

  const blocks = String(md ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/\n{2,}/);

  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      if (/^#{1,6}\s/.test(trimmed)) {
        const level = trimmed.match(/^(#{1,6})/)[1].length;
        const content = escaped(trimmed.replace(/^#{1,6}\s*/, ''));
        return `<h${level}>${content}</h${level}>`;
      }

      if (/^```[\s\S]*```$/.test(trimmed)) {
        const code = trimmed.replace(/^```[^\n]*\n?/, '').replace(/```$/, '');
        return `<pre class="code-block">${escapeHtml(code)}</pre>`;
      }

      if (trimmed.startsWith('```')) {
        const code = trimmed.replace(/^```[^\n]*\n?/, '');
        return `<pre class="code-block">${escapeHtml(code)}</pre>`;
      }

      if (/^>\s/.test(trimmed)) {
        const quote = trimmed
          .split('\n')
          .map((line) => line.replace(/^>\s?/, ''))
          .join('\n');
        return `<blockquote>${escaped(quote)}</blockquote>`;
      }

      if (/^(-|\*|\+)\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
        const ordered = /^\d+\.\s/.test(trimmed);
        const items = trimmed
          .split('\n')
          .filter((line) => /^(\s*(-|\*|\+|\d+\.)\s)/.test(line))
          .map((line) => `<li>${escaped(line.replace(/^\s*(-|\*|\+|\d+\.)\s/, ''))}</li>`)
          .join('');
        return ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
      }

      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        return '<hr/>';
      }

      return `<p>${escaped(block.trim()).replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');
}

/** Render a plain text string that may contain LaTeX into HTML for PDF. */
export function textToHTMLForPDF(text) {
  const { text: withPlaceholders, fragments } = renderMathFragments(text);
  return restoreMath(markdownToHTML(withPlaceholders), fragments);
}

/** Render a plain text string that may contain LaTeX into HTML for EPUB. */
export function textToHTMLForEPUB(text) {
  return renderMathForEPUB(markdownToHTML(text));
}

// ---------------------------------------------------------------------------
// Document CSS
// ---------------------------------------------------------------------------

const EXPORT_CSS = `
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #1a1a1a; margin: 0; padding: 0; }
  .export-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; margin-bottom: 16px; }
  .export-header h1 { font-size: 22px; margin: 0 0 4px; }
  .export-header .meta { font-size: 11px; color: #555; }

  .card { border: 1px solid #444; border-radius: 6px; padding: 10px; break-inside: avoid; page-break-inside: avoid; }
  .card .front { font-weight: 600; }
  .card .answer { border-top: 1px dashed #999; margin-top: 6px; padding-top: 6px; font-size: 0.92em; color: #333; }
  .card .answer .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #777; display: block; margin-bottom: 2px; }

  .layout-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, auto); gap: 10px; }
  .layout-grid .card { min-height: 72px; }
  .grid-page { page-break-after: always; }
  .grid-page:last-child { page-break-after: auto; }

  .layout-list .card { margin-bottom: 10px; }
  .layout-list .front { font-size: 1.02em; }

  .layout-compact { column-count: 2; column-gap: 14px; font-size: 0.86em; }
  .layout-compact .card { margin-bottom: 8px; }

  .answer-key { margin-top: 22px; border-top: 2px solid #1a1a1a; padding-top: 12px; }
  .answer-key h2 { font-size: 16px; margin: 0 0 10px; }
  .answer-key .key-item { margin-bottom: 8px; page-break-inside: avoid; break-inside: avoid; }
  .answer-key .key-q { font-weight: 600; }
  .answer-key .key-a { color: #333; }

  .note-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
  .note-block h2 { font-size: 15px; margin: 0 0 4px; }
  .note-block .note-meta { font-size: 10px; color: #666; margin-bottom: 6px; }
  .note-block ul, .note-block ol { margin: 4px 0; padding-left: 20px; }
  .code-block { background: #f4f4f4; border: 1px solid #ddd; padding: 8px; font-size: 0.85em; white-space: pre-wrap; }
  .math-block { text-align: center; margin: 8px 0; overflow-x: auto; }
  .math-inline { display: inline-block; }
  blockquote { border-left: 3px solid #bbb; margin: 6px 0; padding-left: 10px; color: #444; }
`;

const EPUB_CSS = `
  body { font-family: serif; line-height: 1.5; color: #1a1a1a; }
  h1 { font-size: 1.5em; }
  h2 { font-size: 1.2em; margin-top: 1.2em; }
  h3, h4 { font-size: 1em; }
  ul, ol { padding-left: 1.2em; }
  li { margin-bottom: 0.2em; }
  .card { border: 1px solid #666; border-radius: 4px; padding: 0.6em; margin-bottom: 0.8em; page-break-inside: avoid; }
  .card .front { font-weight: bold; }
  .card .answer { margin-top: 0.4em; padding-top: 0.4em; border-top: 1px dashed #999; }
  .card .answer .label { font-size: 0.75em; text-transform: uppercase; color: #777; }
  .math-block, .math-inline { font-family: monospace; }
  .math-block { text-align: center; margin: 0.5em 0; }
  .code-block { white-space: pre-wrap; font-family: monospace; font-size: 0.85em; background: #f4f4f4; }
  .note-block { margin-bottom: 1.2em; page-break-inside: avoid; }
  .note-meta { font-size: 0.8em; color: #666; }
`;

const epubEscapeXml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// ---------------------------------------------------------------------------
// Flashcard documents
// ---------------------------------------------------------------------------

function cardMarkup(card, index, layout) {
  const subject = card.subject || '';
  const topic = card.topic || '';
  const meta =
    layout !== 'compact'
      ? `<div class="answer"><span class="label">Answer</span>${textToHTMLForPDF(card.back)}</div>`
      : `<div class="answer"><span class="label">Answer · ${[subject, topic].filter(Boolean).join(' · ')}</span>${textToHTMLForPDF(card.back)}</div>`;
  return `<div class="card"><div class="front">${index + 1}. ${textToHTMLForPDF(card.front)}</div>${meta}</div>`;
}

function flashcardAnswerKey(cards) {
  const items = cards
    .map(
      (card, index) =>
        `<div class="key-item"><div class="key-q">${index + 1}. ${textToHTMLForPDF(card.front)}</div><div class="key-a">${textToHTMLForPDF(card.back)}</div></div>`
    )
    .join('');
  return `<div class="answer-key"><h2>Answer Key</h2>${items}</div>`;
}

/**
 * Build the PDF HTML document for a flashcard deck.
 */
export function buildFlashcardDocument({ cards = [], layout = 'grid', includeAnswerKey = false, title = 'Flashcard Deck' }) {
  const normalized = LAYOUTS.includes(layout) ? layout : 'grid';

  let body;
  if (normalized === 'grid') {
    const pages = [];
    for (let i = 0; i < cards.length; i += 8) {
      const chunk = cards.slice(i, i + 8);
      pages.push(
        `<div class="grid-page"><div class="layout-grid">${chunk
          .map((card, idx) => cardMarkup(card, i + idx, normalized))
          .join('')}</div></div>`
      );
    }
    body = pages.join('');
  } else if (normalized === 'list') {
    body = `<div class="layout-list">${cards.map((card, i) => cardMarkup(card, i, normalized)).join('')}</div>`;
  } else {
    body = `<div class="layout-compact">${cards.map((card, i) => cardMarkup(card, i, normalized)).join('')}</div>`;
  }

  if (includeAnswerKey && cards.length > 0) {
    body += flashcardAnswerKey(cards);
  }

  const meta = `${cards.length} cards · ${layoutLabel(layout)}${includeAnswerKey ? ' · includes answer key' : ''}`;
  return buildHTMLDocument(title, meta, body);
}

/**
 * Build EPUB chapters (array of { title, html }) for a flashcard deck.
 */
export function buildFlashcardChapters({ cards = [], layout = 'grid', includeAnswerKey = false, title = 'Flashcard Deck' }) {
  const normalized = LAYOUTS.includes(layout) ? layout : 'grid';
  const layoutClass = `layout-${normalized}`;

  const cardHtml = (card, index) =>
    `<div class="card"><div class="front">${index + 1}. ${textToHTMLForEPUB(card.front)}</div><div class="answer"><span class="label">Answer</span>${textToHTMLForEPUB(card.back)}</div></div>`;

  const chapters = [
    {
      title,
      html: `<h1>${escapeHtml(title)}</h1><p class="note-meta">${cards.length} cards</p><div class="${layoutClass}">${cards
        .map(cardHtml)
        .join('')}</div>`,
    },
  ];

  if (includeAnswerKey && cards.length > 0) {
    chapters.push({
      title: 'Answer Key',
      html: `<h1>Answer Key</h1>${cards
        .map(
          (card, index) =>
            `<div class="card"><div class="front">${index + 1}. ${textToHTMLForEPUB(card.front)}</div><div class="answer">${textToHTMLForEPUB(card.back)}</div></div>`
        )
        .join('')}`,
    });
  }

  return chapters;
}

// ---------------------------------------------------------------------------
// Notes documents
// ---------------------------------------------------------------------------

function noteMarkup(note, index) {
  const meta = [
    note.subject && typeof note.subject === 'object' ? note.subject.name : note.subject,
    note.category,
  ]
    .filter(Boolean)
    .join(' · ');
  return `<div class="note-block"><h2>${index + 1}. ${escapeHtml(note.title || 'Untitled Note')}</h2>${meta ? `<div class="note-meta">${escapeHtml(meta)}</div>` : ''}<div>${textToHTMLForPDF(note.content || '')}</div></div>`;
}

/**
 * Build the PDF HTML document for study notes.
 */
export function buildNotesDocument({ notes = [], layout = 'list', title = 'Study Notes' }) {
  const body = `<div class="layout-${layout === 'compact' ? 'compact' : 'list'}">${notes
    .map((note, i) => noteMarkup(note, i))
    .join('')}</div>`;
  const meta = `${notes.length} notes · ${layoutLabel(layout)}`;
  return buildHTMLDocument(title, meta, body);
}

/**
 * Build EPUB chapters for study notes.
 */
export function buildNotesChapters({ notes = [], title = 'Study Notes' }) {
  const html = notes
    .map((note, index) => {
      const meta = [
        note.subject && typeof note.subject === 'object' ? note.subject.name : note.subject,
        note.category,
      ]
        .filter(Boolean)
        .join(' · ');
      return `<div class="note-block"><h2>${index + 1}. ${escapeHtml(note.title || 'Untitled Note')}</h2>${meta ? `<div class="note-meta">${escapeHtml(meta)}</div>` : ''}<div>${textToHTMLForEPUB(note.content || '')}</div></div>`;
    })
    .join('');
  return [{ title, html: `<h1>${escapeHtml(title)}</h1>${html}` }];
}

// ---------------------------------------------------------------------------
// Shared document assembly
// ---------------------------------------------------------------------------

function layoutLabel(layout) {
  if (layout === 'grid') return 'Grid';
  if (layout === 'compact') return 'Compact';
  return 'List';
}

function buildHTMLDocument(title, meta, body) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)}</title>
<style>${katexCss}\n${EXPORT_CSS}</style>
</head>
<body>
<div class="export-header"><h1>${escapeHtml(title)}</h1>${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ''}</div>
${body}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// PDF / EPUB export
// ---------------------------------------------------------------------------

/**
 * Render an offscreen HTML element and save it as a PDF via html2pdf.
 */
export async function exportElementToPDF(element, filename) {
  const opt = {
    margin: 8,
    filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1100 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] },
  };
  await html2pdf().set(opt).from(element).save();
}

/** Append an HTML document string to the DOM offscreen and return the element. */
export function mountHTMLDocument(html) {
  const container = document.createElement('div');
  container.setAttribute('data-export-document', 'true');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '1100px';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

export function unmountHTMLDocument(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/** Build an EPUB 3.0 package and return the JSZip instance (useful for tests). */
export async function buildEPUBZip(title, chapters, author = 'OpenPrep AI') {
  const zip = new JSZip();
  const uid = `urn:uuid:${'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  })}`;

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  );

  const chapterFiles = chapters.map((chapter, index) => {
    const id = `chapter-${index + 1}`;
    const filename = `OEBPS/${id}.xhtml`;
    const title = chapter.title || `Chapter ${index + 1}`;
    zip.file(
      filename,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${epubEscapeXml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${chapter.html}</body>
</html>`
    );
    return { id, filename, title };
  });

  zip.file(
    'OEBPS/style.css',
    EPUB_CSS
  );

  const manifest = chapterFiles
    .map((ch) => `    <item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n');
  const spine = chapterFiles.map((ch) => `    <itemref idref="${ch.id}"/>`).join('\n');
  const navItems = chapterFiles
    .map((ch, index) => `      <li><a href="${ch.id}.xhtml">${epubEscapeXml(ch.title || `Chapter ${index + 1}`)}</a></li>`)
    .join('\n');

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="book-id">${epubEscapeXml(uid)}</dc:identifier>
    <dc:title>${epubEscapeXml(title)}</dc:title>
    <dc:creator>${epubEscapeXml(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
${manifest}
  </manifest>
  <spine>
${spine}
  </spine>
</package>`
  );

  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${epubEscapeXml(title)}</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>${epubEscapeXml(title)}</h1>
    <ol>
${navItems}
    </ol>
  </nav>
</body>
</html>`
  );

  return zip;
}

/** Build and download an EPUB file. */
export async function exportToEPUB({ title, chapters, author, filename }) {
  const zip = await buildEPUBZip(title, chapters, author);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  downloadBlob(blob, filename);
  return { blob, filename };
}

export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Build an offscreen element for a built document string and trigger PDF save. */
export async function exportHTMLToPDF(html, filename) {
  const element = mountHTMLDocument(html);
  try {
    await exportElementToPDF(element, filename);
  } finally {
    unmountHTMLDocument(element);
  }
}

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  markdownToHTML,
  textToHTMLForPDF,
  textToHTMLForEPUB,
  buildFlashcardDocument,
  buildFlashcardChapters,
  buildNotesDocument,
  buildNotesChapters,
  buildEPUBZip,
  downloadBlob,
} from './exportDocs';

vi.mock('html2pdf.js', () => ({
  default: vi.fn(() => ({
    set: vi.fn(() => ({
      from: vi.fn(() => ({ save: vi.fn(() => Promise.resolve()) })),
    })),
  })),
}));

vi.mock('katex/dist/katex.min.css?raw', () => ({
  default: '.katex { font-size: 1em; }',
}));

describe('markdownToHTML', () => {
  it('converts headings', () => {
    expect(markdownToHTML('# Title\n\n## Subtitle')).toBe(
      '<h1>Title</h1><h2>Subtitle</h2>'
    );
  });

  it('converts bold, italic, and inline code', () => {
    const html = markdownToHTML('**bold** and *italic* and `code`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
  });

  it('converts unordered and ordered lists', () => {
    expect(markdownToHTML('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(markdownToHTML('1. first\n2. second')).toBe('<ol><li>first</li><li>second</li></ol>');
  });

  it('converts fenced code blocks', () => {
    const html = markdownToHTML('```\nconst x = 1;\n```');
    expect(html).toContain('<pre class="code-block">');
    expect(html).toContain('const x = 1;');
  });

  it('converts blockquotes and horizontal rules', () => {
    expect(markdownToHTML('> a quote')).toBe('<blockquote>a quote</blockquote>');
    expect(markdownToHTML('---')).toBe('<hr/>');
  });

  it('escapes HTML in plain text', () => {
    const html = markdownToHTML('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('converts plain paragraphs', () => {
    expect(markdownToHTML('hello world')).toBe('<p>hello world</p>');
  });
});

describe('textToHTMLForPDF (KaTeX math)', () => {
  it('renders inline math with KaTeX', () => {
    const html = textToHTMLForPDF('Solve $x^2 + 1 = 0$ today');
    expect(html).toContain('math-inline');
    expect(html).toContain('katex');
  });

  it('renders block math with KaTeX', () => {
    const html = textToHTMLForPDF('Consider $$E = mc^2$$ below');
    expect(html).toContain('math-block');
    expect(html).toContain('katex');
  });

  it('keeps invalid LaTeX readable instead of throwing', () => {
    const html = textToHTMLForPDF('bad math $\\frac{}$');
    expect(html).toBeTruthy();
  });
});

describe('textToHTMLForEPUB', () => {
  it('keeps math as monospace code', () => {
    const html = textToHTMLForEPUB('Solve $x^2$ now');
    expect(html).toContain('math-inline');
    expect(html).toContain('<code>');
    expect(html).toContain('x^2');
  });
});

describe('buildFlashcardDocument', () => {
  const cards = Array.from({ length: 10 }, (_, i) => ({
    front: `Question ${i + 1}`,
    back: `Answer ${i + 1}`,
    subject: 'Math',
    topic: 'Algebra',
  }));

  it('paginates grid layout into chunks of 8 cards', () => {
    const html = buildFlashcardDocument({ cards, layout: 'grid' });
    expect(html).toContain('layout-grid');
    expect(html.match(/class="grid-page"/g)).toHaveLength(2);
    expect(html).toContain('Question 1');
    expect(html).toContain('Question 10');
  });

  it('renders list layout', () => {
    const html = buildFlashcardDocument({ cards, layout: 'list' });
    expect(html).toContain('layout-list');
  });

  it('renders compact layout', () => {
    const html = buildFlashcardDocument({ cards, layout: 'compact' });
    expect(html).toContain('layout-compact');
  });

  it('includes an answer key when requested', () => {
    const html = buildFlashcardDocument({ cards, layout: 'list', includeAnswerKey: true });
    expect(html).toContain('Answer Key');
  });

  it('omits answer key when not requested', () => {
    const html = buildFlashcardDocument({ cards, layout: 'list', includeAnswerKey: false });
    expect(html).not.toContain('Answer Key');
  });

  it('falls back to grid layout for unknown layouts', () => {
    const html = buildFlashcardDocument({ cards, layout: 'bogus' });
    expect(html).toContain('layout-grid');
  });

  it('embeds KaTeX stylesheet in the document head', () => {
    const html = buildFlashcardDocument({ cards, layout: 'list' });
    expect(html).toContain('.katex');
  });
});

describe('buildFlashcardChapters', () => {
  const cards = [
    { front: 'Q1', back: 'A1', subject: 'Math', topic: null },
    { front: 'Q2', back: 'A2', subject: null, topic: 'Physics' },
  ];

  it('builds a single deck chapter with all cards', () => {
    const chapters = buildFlashcardChapters({ cards, title: 'My Deck' });
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe('My Deck');
    expect(chapters[0].html).toContain('Q1');
    expect(chapters[0].html).toContain('A2');
  });

  it('appends an answer key chapter when requested', () => {
    const chapters = buildFlashcardChapters({ cards, includeAnswerKey: true });
    expect(chapters).toHaveLength(2);
    expect(chapters[1].title).toBe('Answer Key');
  });
});

describe('buildNotesDocument', () => {
  it('renders note titles, subjects, and content', () => {
    const notes = [
      { title: 'Kinematics', content: '## Key\n\n- v = u + at', subject: 'Physics', category: 'Revision' },
    ];
    const html = buildNotesDocument({ notes });
    expect(html).toContain('Kinematics');
    expect(html).toContain('Physics');
    expect(html).toContain('layout-list');
  });

  it('supports compact layout', () => {
    const notes = [{ title: 'Note', content: 'body', subject: null, category: null }];
    const html = buildNotesDocument({ notes, layout: 'compact' });
    expect(html).toContain('layout-compact');
  });

  it('falls back to list layout for grid selection', () => {
    const notes = [{ title: 'Note', content: 'body', subject: null, category: null }];
    const html = buildNotesDocument({ notes, layout: 'grid' });
    expect(html).toContain('layout-list');
  });
});

describe('buildNotesChapters', () => {
  it('builds a single chapter containing all notes', () => {
    const notes = [
      { title: 'Note A', content: 'content A', subject: 'Math', category: 'Lecture' },
    ];
    const chapters = buildNotesChapters({ notes, title: 'My Notes' });
    expect(chapters).toHaveLength(1);
    expect(chapters[0].title).toBe('My Notes');
    expect(chapters[0].html).toContain('Note A');
    expect(chapters[0].html).toContain('content A');
  });
});

describe('buildEPUBZip', () => {
  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it('creates a valid EPUB 3 package structure', async () => {
    const zip = await buildEPUBZip(
      'Deck',
      [
        { title: 'Chapter 1', html: '<p>hello</p>' },
        { title: 'Answer Key', html: '<p>key</p>' },
      ],
      'OpenPrep AI'
    );

    const filenames = Object.keys(zip.files);
    expect(filenames).toContain('mimetype');
    expect(filenames).toContain('META-INF/container.xml');
    expect(filenames).toContain('OEBPS/content.opf');
    expect(filenames).toContain('OEBPS/nav.xhtml');
    expect(filenames).toContain('OEBPS/chapter-1.xhtml');
    expect(filenames).toContain('OEBPS/chapter-2.xhtml');
    expect(filenames).toContain('OEBPS/style.css');

    const contentOpf = await zip.file('OEBPS/content.opf').async('string');
    expect(contentOpf).toContain('version="3.0"');
    expect(contentOpf).toContain('chapter-1.xhtml');
  });

  it('stores the mimetype file uncompressed', async () => {
    const zip = await buildEPUBZip('Deck', [{ title: 'C1', html: '<p>x</p>' }]);
    expect(zip.file('mimetype').options.compression).toBe('STORE');
  });

  it('downloads the generated epub blob', async () => {
    const zip = await buildEPUBZip('Deck', [{ title: 'C1', html: '<p>x</p>' }]);
    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
    downloadBlob(blob, 'deck.epub');
    expect(globalThis.URL.createObjectURL).toHaveBeenCalledWith(blob);
  });
});

const axios = require('axios');

class CitationService {
  constructor() {
    this.crossRefBaseUrl = 'https://api.crossref.org/works';
    this.openAlexBaseUrl = 'https://api.openalex.org/works';
    this.cache = new Map();
  }

  /**
   * Resolves a DOI into normalized citation metadata
   */
  async resolveDOI(doi) {
    const cleanDoi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    if (this.cache.has(cleanDoi)) {
      return this.cache.get(cleanDoi);
    }

    try {
      const response = await axios.get(`${this.crossRefBaseUrl}/${encodeURIComponent(cleanDoi)}`, {
        headers: {
          'User-Agent': 'OpenPrepAI-CitationService/1.0 (mailto:support@openprep.ai)',
        },
        timeout: 8000,
      });

      const work = response.data?.message;
      if (!work) throw new Error('No metadata found for DOI');

      const metadata = this.normalizeCrossRefWork(work, cleanDoi);
      this.cache.set(cleanDoi, metadata);
      return metadata;
    } catch (error) {
      // Fallback to OpenAlex if CrossRef fails
      return this.resolveOpenAlex(cleanDoi);
    }
  }

  /**
   * Fallback resolver via OpenAlex API
   */
  async resolveOpenAlex(cleanDoi) {
    try {
      const response = await axios.get(`${this.openAlexBaseUrl}/https://doi.org/${encodeURIComponent(cleanDoi)}`, {
        timeout: 8000,
      });

      const work = response.data;
      if (!work) throw new Error('DOI could not be resolved via OpenAlex');

      const authors = (work.authorships || []).map((a) => a.author?.display_name).filter(Boolean);

      return {
        doi: cleanDoi,
        title: work.title || 'Untitled Work',
        authors: authors.length > 0 ? authors : ['Unknown Author'],
        journal: work.primary_location?.source?.display_name || '',
        publisher: work.primary_location?.source?.host_organization_name || '',
        year: work.publication_year || new Date().getFullYear(),
        volume: work.biblio?.volume || '',
        issue: work.biblio?.issue || '',
        pages: work.biblio?.first_page ? `${work.biblio.first_page}-${work.biblio.last_page || ''}` : '',
        url: work.doi || `https://doi.org/${cleanDoi}`,
      };
    } catch (err) {
      throw new Error(`Failed to resolve DOI ${cleanDoi}: ${err.message}`);
    }
  }

  /**
   * Normalizes CrossRef API payload
   */
  normalizeCrossRefWork(work, cleanDoi) {
    const authors = (work.author || []).map((a) => {
      if (a.given && a.family) return `${a.family}, ${a.given}`;
      if (a.family) return a.family;
      if (a.name) return a.name;
      return 'Unknown';
    });

    const year = work.published?.['date-parts']?.[0]?.[0] ||
      work['published-print']?.['date-parts']?.[0]?.[0] ||
      work['published-online']?.['date-parts']?.[0]?.[0] ||
      new Date().getFullYear();

    return {
      doi: cleanDoi,
      title: Array.isArray(work.title) ? work.title[0] : (work.title || 'Untitled Publication'),
      authors: authors.length > 0 ? authors : ['Unknown Author'],
      journal: Array.isArray(work['container-title']) ? work['container-title'][0] : (work['container-title'] || ''),
      publisher: work.publisher || '',
      year: parseInt(year, 10),
      volume: work.volume || '',
      issue: work.issue || '',
      pages: work.page || '',
      url: work.URL || `https://doi.org/${cleanDoi}`,
    };
  }

  /**
   * Formats metadata into APA 7th style
   */
  formatAPA(meta) {
    const authorStr = this.formatAuthorsAPA(meta.authors);
    const yearStr = meta.year ? `(${meta.year}).` : '(n.d.).';
    const titleStr = meta.title ? `${meta.title}.` : '';
    const journalStr = meta.journal ? `*${meta.journal}*` : '';
    const volStr = meta.volume ? `, *${meta.volume}*` : '';
    const issueStr = meta.issue ? `(${meta.issue})` : '';
    const pageStr = meta.pages ? `, ${meta.pages}.` : '.';
    const doiStr = meta.doi ? ` https://doi.org/${meta.doi}` : (meta.url ? ` ${meta.url}` : '');

    return `${authorStr} ${yearStr} ${titleStr} ${journalStr}${volStr}${issueStr}${pageStr}${doiStr}`.replace(/\s+/g, ' ').trim();
  }

  /**
   * Formats metadata into IEEE style
   */
  formatIEEE(meta) {
    const authorStr = this.formatAuthorsIEEE(meta.authors);
    const titleStr = meta.title ? `"${meta.title},"` : '';
    const journalStr = meta.journal ? `*${meta.journal}*` : '';
    const volStr = meta.volume ? `, vol. ${meta.volume}` : '';
    const issueStr = meta.issue ? `, no. ${meta.issue}` : '';
    const pageStr = meta.pages ? `, pp. ${meta.pages}` : '';
    const yearStr = meta.year ? `, ${meta.year}.` : '.';
    const doiStr = meta.doi ? ` doi: ${meta.doi}.` : '';

    return `${authorStr}, ${titleStr} ${journalStr}${volStr}${issueStr}${pageStr}${yearStr}${doiStr}`.replace(/\s+/g, ' ').trim();
  }

  /**
   * Formats metadata into MLA 9th style
   */
  formatMLA(meta) {
    const authorStr = this.formatAuthorsMLA(meta.authors);
    const titleStr = meta.title ? `"${meta.title}."` : '';
    const journalStr = meta.journal ? `*${meta.journal}*,` : '';
    const volStr = meta.volume ? ` vol. ${meta.volume},` : '';
    const issueStr = meta.issue ? ` no. ${meta.issue},` : '';
    const yearStr = meta.year ? ` ${meta.year}` : '';
    const pageStr = meta.pages ? `, pp. ${meta.pages}.` : '.';
    const urlStr = meta.doi ? ` https://doi.org/${meta.doi}.` : '';

    return `${authorStr} ${titleStr} ${journalStr}${volStr}${issueStr}${yearStr}${pageStr}${urlStr}`.replace(/\s+/g, ' ').trim();
  }

  /**
   * Formats metadata into BibTeX style
   */
  formatBibTeX(meta) {
    const firstAuthorFamily = (meta.authors[0] || 'Author').split(',')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
    const citeKey = `${firstAuthorFamily}${meta.year || 'year'}`;

    return `@article{${citeKey},
  author    = {${meta.authors.join(' and ')}},
  title     = {{${meta.title}}},
  journal   = {${meta.journal || ''}},
  year      = {${meta.year || ''}},
  volume    = {${meta.volume || ''}},
  number    = {${meta.issue || ''}},
  pages     = {${meta.pages || ''}},
  doi       = {${meta.doi || ''}},
  url       = {${meta.url || ''}}
}`;
  }

  formatAuthorsAPA(authors = []) {
    if (!authors || authors.length === 0) return 'Unknown Author.';
    if (authors.length === 1) return `${authors[0]}.`;
    if (authors.length === 2) return `${authors[0]}, & ${authors[1]}.`;
    return `${authors[0]}, et al.`;
  }

  formatAuthorsIEEE(authors = []) {
    if (!authors || authors.length === 0) return 'Unknown Author';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
    return `${authors[0]} *et al.*`;
  }

  formatAuthorsMLA(authors = []) {
    if (!authors || authors.length === 0) return 'Unknown Author.';
    if (authors.length === 1) return `${authors[0]}.`;
    if (authors.length === 2) return `${authors[0]}, and ${authors[1]}.`;
    return `${authors[0]}, et al.`;
  }

  /**
   * Formats all supported citation styles
   */
  formatAllStyles(meta) {
    return {
      apa: this.formatAPA(meta),
      ieee: this.formatIEEE(meta),
      mla: this.formatMLA(meta),
      bibtex: this.formatBibTeX(meta),
      inTextAPA: `(${meta.authors?.[0]?.split(',')?.[0] || 'Author'}, ${meta.year || 'n.d.'})`,
      inTextIEEE: `[${meta.id ? meta.id.substring(0, 2) : '1'}]`,
    };
  }

  /**
   * Generates RIS format stream
   */
  generateRIS(citations = []) {
    let ris = [];
    citations.forEach((c) => {
      ris.push('TY  - JOUR');
      ris.push(`TI  - ${c.title || ''}`);
      (c.authors || []).forEach((a) => ris.push(`AU  - ${a}`));
      if (c.journal) ris.push(`JO  - ${c.journal}`);
      if (c.year) ris.push(`PY  - ${c.year}`);
      if (c.volume) ris.push(`VL  - ${c.volume}`);
      if (c.issue) ris.push(`IS  - ${c.issue}`);
      if (c.pages) ris.push(`SP  - ${c.pages}`);
      if (c.doi) ris.push(`DO  - ${c.doi}`);
      if (c.url) ris.push(`UR  - ${c.url}`);
      ris.push('ER  - ');
    });
    return ris.join('\r\n');
  }
}

module.exports = new CitationService();

import { describe, it, expect } from 'vitest';
import citationService from '../../services/citationService';

describe('CitationService Unit Tests', () => {
  const sampleMeta = {
    doi: '10.1145/3318464.3389700',
    title: 'Spaced Repetition in Online Learning Platforms',
    authors: ['Turing, Alan', 'Knuth, Donald'],
    journal: 'ACM Transactions on Computer Systems',
    year: 2024,
    volume: '42',
    issue: '3',
    pages: '101-118',
    url: 'https://doi.org/10.1145/3318464.3389700',
  };

  it('should format valid APA 7th citation', () => {
    const apa = citationService.formatAPA(sampleMeta);
    expect(apa).toContain('Turing, Alan, & Knuth, Donald. (2024).');
    expect(apa).toContain('Spaced Repetition in Online Learning Platforms.');
    expect(apa).toContain('*ACM Transactions on Computer Systems*');
    expect(apa).toContain('https://doi.org/10.1145/3318464.3389700');
  });

  it('should format valid IEEE citation', () => {
    const ieee = citationService.formatIEEE(sampleMeta);
    expect(ieee).toContain('Turing, Alan and Knuth, Donald');
    expect(ieee).toContain('"Spaced Repetition in Online Learning Platforms,"');
    expect(ieee).toContain('*ACM Transactions on Computer Systems*');
    expect(ieee).toContain('doi: 10.1145/3318464.3389700.');
  });

  it('should format valid MLA 9th citation', () => {
    const mla = citationService.formatMLA(sampleMeta);
    expect(mla).toContain('Turing, Alan, and Knuth, Donald.');
    expect(mla).toContain('"Spaced Repetition in Online Learning Platforms."');
    expect(mla).toContain('*ACM Transactions on Computer Systems*');
  });

  it('should generate valid BibTeX bibliography entry', () => {
    const bibtex = citationService.formatBibTeX(sampleMeta);
    expect(bibtex).toContain('@article{turing2024,');
    expect(bibtex).toContain('author    = {Turing, Alan and Knuth, Donald}');
    expect(bibtex).toContain('title     = {{Spaced Repetition in Online Learning Platforms}}');
    expect(bibtex).toContain('journal   = {ACM Transactions on Computer Systems}');
  });

  it('should generate valid RIS stream for multiple citations', () => {
    const ris = citationService.generateRIS([sampleMeta]);
    expect(ris).toContain('TY  - JOUR');
    expect(ris).toContain('TI  - Spaced Repetition in Online Learning Platforms');
    expect(ris).toContain('AU  - Turing, Alan');
    expect(ris).toContain('DO  - 10.1145/3318464.3389700');
    expect(ris).toContain('ER  - ');
  });
});

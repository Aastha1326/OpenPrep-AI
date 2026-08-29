import { describe, it, expect } from 'vitest';
import conjugationService from '../../services/conjugationService';
import grammarTreeService from '../../services/grammarTreeService';

describe('Conjugation & Grammar Tree Unit Tests', () => {
  it('should accurately return Spanish present tense conjugations', () => {
    const hablar = conjugationService.getConjugation('spanish', 'hablar', 'present');
    expect(hablar.yo).toBe('hablo');
    expect(hablar.tu).toBe('hablas');
    expect(hablar.nosotros).toBe('hablamos');

    const comer = conjugationService.getConjugation('spanish', 'comer', 'present');
    expect(comer.yo).toBe('como');
    expect(comer.ellos).toBe('comen');
  });

  it('should verify answer with Levenshtein distance metric', () => {
    const perfect = conjugationService.verifyAnswer('hablo', 'hablo');
    expect(perfect.isCorrect).toBe(true);
    expect(perfect.levenshteinDistance).toBe(0);

    const typo = conjugationService.verifyAnswer('hablamos', 'hablamas');
    expect(typo.isCorrect).toBe(false);
    expect(typo.levenshteinDistance).toBe(1);
  });

  it('should parse sentence into POS tree nodes and edges', () => {
    const tree = grammarTreeService.parseSentenceStructure('El perro come comida', 'spanish');
    expect(tree.tokenCount).toBe(4);
    expect(tree.nodes.length).toBe(4);
    expect(tree.edges.length).toBe(3);
    expect(tree.nodes[0].pos).toBe('ARTICLE');
  });
});

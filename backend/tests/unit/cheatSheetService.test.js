import { describe, it, expect } from 'vitest';
import cheatSheetService from '../../services/cheatSheetService';

describe('CheatSheetService & LaTeX Validator Unit Tests', () => {
  it('should return default preloaded template catalog', () => {
    const templates = cheatSheetService.getTemplateCatalog();
    expect(templates.length).toBeGreaterThanOrEqual(2);
    expect(templates[0]).toHaveProperty('sections');
  });

  it('should accurately validate balanced LaTeX braces', () => {
    const validLaTeX = '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';
    expect(cheatSheetService.validateLaTeX(validLaTeX).valid).toBe(true);

    const unbalancedClosing = '\\frac{a}{b}}';
    expect(cheatSheetService.validateLaTeX(unbalancedClosing).valid).toBe(false);

    const unclosedOpening = '\\frac{a}{b';
    expect(cheatSheetService.validateLaTeX(unclosedOpening).valid).toBe(false);
  });
});

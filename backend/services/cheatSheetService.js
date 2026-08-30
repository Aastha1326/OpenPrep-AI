class CheatSheetService {
  constructor() {
    this.templateCatalog = [
      {
        subject: 'Calculus & Analysis',
        title: 'Essential Calculus Cheat Sheet',
        columns: 2,
        sections: [
          {
            title: 'Common Derivatives',
            color: '#10B981',
            items: [
              { label: 'Power Rule', latex: '\\frac{d}{dx}[x^n] = n x^{n-1}' },
              { label: 'Exponential', latex: '\\frac{d}{dx}[e^{ax}] = a e^{ax}' },
              { label: 'Trigonometric', latex: '\\frac{d}{dx}[\\sin x] = \\cos x, \\quad \\frac{d}{dx}[\\cos x] = -\\sin x' },
              { label: 'Product Rule', latex: '(uv)\' = u\'v + uv\'' },
            ],
          },
          {
            title: 'Fundamental Integrals',
            color: '#3B82F6',
            items: [
              { label: 'Power Integral', latex: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C \\; (n \\neq -1)' },
              { label: 'Natural Log', latex: '\\int \\frac{1}{x} dx = \\ln|x| + C' },
              { label: 'Integration by Parts', latex: '\\int u \\, dv = uv - \\int v \\, du' },
            ],
          },
        ],
      },
      {
        subject: 'Computer Science',
        title: 'Data Structures & Complexity Master Sheet',
        columns: 2,
        sections: [
          {
            title: 'Big-O Complexities',
            color: '#8B5CF6',
            items: [
              { label: 'QuickSort', latex: 'O(N \\log N) \\text{ avg}, \\; O(N^2) \\text{ worst}' },
              { label: 'Binary Search', latex: 'O(\\log N)' },
              { label: 'Hash Table Lookup', latex: 'O(1) \\text{ avg}, \\; O(N) \\text{ worst}' },
              { label: 'Master Theorem', latex: 'T(n) = aT(n/b) + f(n)' },
            ],
          },
          {
            title: 'Graph Algorithms',
            color: '#EC4899',
            items: [
              { label: 'Dijkstra', latex: 'O((V + E) \\log V)' },
              { label: 'Bellman-Ford', latex: 'O(V \\cdot E)' },
              { label: 'Floyd-Warshall', latex: 'O(V^3)' },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Returns pre-populated templates for instant quick-start
   */
  getTemplateCatalog() {
    return this.templateCatalog;
  }

  /**
   * Validates LaTeX balance and syntax
   */
  validateLaTeX(latexString) {
    if (!latexString || typeof latexString !== 'string') return { valid: false, error: 'Empty expression' };

    // Check brace matching
    let depth = 0;
    for (const char of latexString) {
      if (char === '{') depth++;
      else if (char === '}') depth--;
      if (depth < 0) return { valid: false, error: 'Unmatched closing brace `}`' };
    }

    if (depth !== 0) return { valid: false, error: 'Unclosed opening brace `{`' };

    return { valid: true };
  }
}

module.exports = new CheatSheetService();

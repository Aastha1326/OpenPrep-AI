class ASTAnalysisService {
  /**
   * Tokenizes and abstracts identifiers from source code for robust structural analysis
   */
  abstractTokens(code, language = 'javascript') {
    if (!code || typeof code !== 'string') return [];

    // Strip single line and multi-line comments
    const stripped = code
      .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '')
      .replace(/#.*$/gm, ''); // Python comments

    // Normalize strings and numerical literals
    const normalizedLiterals = stripped
      .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, 'STR_LIT')
      .replace(/\b\d+(\.\d+)?\b/g, 'NUM_LIT');

    // Split into structural tokens
    const rawTokens = normalizedLiterals
      .split(/([{}()[\];,.<>+\-*/%=!&|^~?: \t\r\n]+)/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const identifierMap = new Map();
    let idCounter = 1;

    const keywords = new Set([
      'function', 'return', 'if', 'else', 'for', 'while', 'const', 'let', 'var',
      'switch', 'case', 'break', 'continue', 'class', 'import', 'from', 'export',
      'async', 'await', 'try', 'catch', 'throw', 'def', 'elif', 'in', 'is', 'not',
      'and', 'or', 'lambda', 'self', 'public', 'private', 'static', 'void', 'int',
    ]);

    const abstracted = rawTokens.map((token) => {
      if (keywords.has(token)) return `KW_${token.toUpperCase()}`;
      if (token === 'STR_LIT' || token === 'NUM_LIT') return token;
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(token)) {
        if (!identifierMap.has(token)) {
          identifierMap.set(token, `ID_${idCounter++}`);
        }
        return identifierMap.get(token);
      }
      return token; // Operators & punctuation
    });

    return abstracted;
  }

  /**
   * Computes approximate Cyclomatic Complexity (M = E - N + 2P) based on decision points
   */
  calculateCyclomaticComplexity(code) {
    if (!code) return 1;
    const decisionKeywords = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\belif\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&/g,
      /\|\|/g,
      /\?/g,
    ];

    let complexity = 1;
    decisionKeywords.forEach((regex) => {
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  /**
   * Computes Halstead Program Volume & Effort estimation
   */
  calculateHalsteadMetrics(tokens = []) {
    if (tokens.length === 0) return { volume: 0, vocabulary: 0, length: 0 };

    const uniqueTokens = new Set(tokens);
    const N = tokens.length; // Total length
    const n = uniqueTokens.size; // Vocabulary

    const volume = parseFloat((N * (Math.log2(Math.max(2, n)))).toFixed(2));

    return {
      length: N,
      vocabulary: n,
      volume,
    };
  }
}

module.exports = new ASTAnalysisService();

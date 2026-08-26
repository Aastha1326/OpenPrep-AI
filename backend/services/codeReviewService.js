const astAnalysisService = require('./astAnalysisService');
const plagiarismService = require('./plagiarismService');

class CodeReviewService {
  /**
   * Evaluates code quality, time/space complexity, and stylistic suggestions
   */
  async reviewCode(code, language = 'javascript', problemTitle = '') {
    const tokens = astAnalysisService.abstractTokens(code, language);
    const cyclomaticComplexity = astAnalysisService.calculateCyclomaticComplexity(code);
    const halstead = astAnalysisService.calculateHalsteadMetrics(tokens);

    // Structural rule checks
    const suggestions = [];

    if (cyclomaticComplexity > 10) {
      suggestions.push({
        type: 'COMPLEXITY',
        severity: 'WARNING',
        message: `High cyclomatic complexity (${cyclomaticComplexity}). Consider breaking down nested conditionals or extracting helper methods.`,
      });
    }

    if (code.includes('var ')) {
      suggestions.push({
        type: 'STYLE',
        severity: 'INFO',
        message: 'Use `const` or `let` instead of `var` to enforce block scoping.',
      });
    }

    if (code.includes('console.log')) {
      suggestions.push({
        type: 'CLEANLINESS',
        severity: 'INFO',
        message: 'Remove debug `console.log` statements before final submission.',
      });
    }

    // Estimate time & space complexity based on AST constructs
    let estimatedTimeComplexity = 'O(1)';
    let estimatedSpaceComplexity = 'O(1)';

    const loops = (code.match(/\b(for|while)\b/g) || []).length;
    if (loops === 1) estimatedTimeComplexity = 'O(N)';
    else if (loops === 2) estimatedTimeComplexity = 'O(N^2)';
    else if (loops >= 3) estimatedTimeComplexity = 'O(N^3)';

    if (code.includes('new Array') || code.includes('[]') || code.includes('new Map') || code.includes('new Set')) {
      estimatedSpaceComplexity = loops > 0 ? 'O(N)' : 'O(1)';
    }

    return {
      metrics: {
        cyclomaticComplexity,
        halsteadVolume: halstead.volume,
        tokenCount: tokens.length,
        estimatedTimeComplexity,
        estimatedSpaceComplexity,
      },
      suggestions: suggestions.length > 0 ? suggestions : [
        { type: 'OPTIMIZATION', severity: 'SUCCESS', message: 'Clean implementation with balanced complexity!' },
      ],
      qualityScore: Math.max(30, Math.min(100, 100 - (cyclomaticComplexity * 4))),
    };
  }
}

module.exports = new CodeReviewService();

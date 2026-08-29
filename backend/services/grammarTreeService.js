class GrammarTreeService {
  /**
   * Tokenizes and creates a syntax dependency tree for foreign language sentences
   */
  parseSentenceStructure(sentence = '', language = 'spanish') {
    if (!sentence) return { nodes: [], edges: [] };

    const words = sentence.trim().split(/\s+/);
    const nodes = [];
    const edges = [];

    // Basic Rule-based POS tagger
    const posRules = {
      spanish: {
        articles: new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas']),
        pronouns: new Set(['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'usted']),
        prepositions: new Set(['a', 'de', 'en', 'por', 'para', 'con', 'sin', 'sobre']),
      },
    };

    const rules = posRules[language] || posRules.spanish;

    words.forEach((word, index) => {
      const lower = word.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
      let pos = 'NOUN';

      if (rules.articles.has(lower)) pos = 'ARTICLE';
      else if (rules.pronouns.has(lower)) pos = 'PRONOUN';
      else if (rules.prepositions.has(lower)) pos = 'PREP';
      else if (index === 1 || lower.endsWith('o') || lower.endsWith('as') || lower.endsWith('a') || lower.endsWith('e')) {
        pos = index === 0 ? 'NOUN' : 'VERB';
      }

      nodes.push({
        id: `w_${index}`,
        label: word,
        pos,
        index,
      });

      if (index > 0) {
        edges.push({
          from: `w_${index - 1}`,
          to: `w_${index}`,
          relation: index === 1 ? 'predicate' : 'object/modifier',
        });
      }
    });

    return {
      sentence,
      language,
      tokenCount: words.length,
      nodes,
      edges,
    };
  }
}

module.exports = new GrammarTreeService();

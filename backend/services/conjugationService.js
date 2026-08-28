class ConjugationService {
  constructor() {
    this.verbsDatabase = {
      spanish: {
        hablar: {
          present: { yo: 'hablo', tu: 'hablas', el: 'habla', nosotros: 'hablamos', vosotros: 'habláis', ellos: 'hablan' },
          preterite: { yo: 'hablé', tu: 'hablaste', el: 'habló', nosotros: 'hablamos', vosotros: 'hablasteis', ellos: 'hablaron' },
          imperfect: { yo: 'hablaba', tu: 'hablabas', el: 'hablaba', nosotros: 'hablábamos', vosotros: 'hablabais', ellos: 'hablaban' },
        },
        comer: {
          present: { yo: 'como', tu: 'comes', el: 'come', nosotros: 'comemos', vosotros: 'coméis', ellos: 'comen' },
          preterite: { yo: 'comí', tu: 'comiste', el: 'comió', nosotros: 'comimos', vosotros: 'comisteis', ellos: 'comieron' },
          imperfect: { yo: 'comía', tu: 'comías', el: 'comía', nosotros: 'comíamos', vosotros: 'comíais', ellos: 'comían' },
        },
        vivir: {
          present: { yo: 'vivo', tu: 'vives', el: 'vive', nosotros: 'vivimos', vosotros: 'vivís', ellos: 'viven' },
          preterite: { yo: 'viví', tu: 'viviste', el: 'vivió', nosotros: 'vivimos', vosotros: 'vivisteis', ellos: 'vivieron' },
          imperfect: { yo: 'vivía', tu: 'vivías', el: 'vivía', nosotros: 'vivíamos', vosotros: 'vivíais', ellos: 'vivían' },
        },
      },
      french: {
        parler: {
          present: { je: 'parle', tu: 'parles', il: 'parle', nous: 'parlons', vous: 'parlez', ils: 'parlent' },
          imparfait: { je: 'parlais', tu: 'parlais', il: 'parlait', nous: 'parlions', vous: 'parliez', ils: 'parlaient' },
        },
      },
    };
  }

  /**
   * Returns conjugation matrix for a verb
   */
  getConjugation(language = 'spanish', verb = 'hablar', tense = 'present') {
    const langKey = language.toLowerCase();
    const verbKey = verb.toLowerCase().trim();

    const langDb = this.verbsDatabase[langKey];
    if (langDb && langDb[verbKey] && langDb[verbKey][tense]) {
      return langDb[verbKey][tense];
    }

    // Algorithmic regular conjugation fallback for Spanish
    if (langKey === 'spanish') {
      return this.conjugateRegularSpanish(verbKey, tense);
    }

    return { error: `Verb ${verb} not found in rules dictionary` };
  }

  /**
   * Regular Spanish verb stem conjugation algorithm
   */
  conjugateRegularSpanish(verb, tense) {
    const ending = verb.slice(-2);
    const stem = verb.slice(0, -2);

    if (ending === 'ar') {
      return {
        yo: `${stem}o`,
        tu: `${stem}as`,
        el: `${stem}a`,
        nosotros: `${stem}amos`,
        vosotros: `${stem}áis`,
        ellos: `${stem}an`,
      };
    }
    if (ending === 'er' || ending === 'ir') {
      return {
        yo: `${stem}o`,
        tu: `${stem}es`,
        el: `${stem}e`,
        nosotros: ending === 'er' ? `${stem}emos` : `${stem}imos`,
        vosotros: ending === 'er' ? `${stem}éis` : `${stem}ís`,
        ellos: `${stem}en`,
      };
    }
    return {};
  }

  /**
   * Validates user answer with precise character difference detection
   */
  verifyAnswer(correctAnswer, userAnswer) {
    const cleanCorrect = (correctAnswer || '').trim().toLowerCase();
    const cleanUser = (userAnswer || '').trim().toLowerCase();

    const isMatch = cleanCorrect === cleanUser;
    return {
      isCorrect: isMatch,
      expected: cleanCorrect,
      received: cleanUser,
      levenshteinDistance: this.calculateLevenshtein(cleanCorrect, cleanUser),
    };
  }

  calculateLevenshtein(a, b) {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[a.length][b.length];
  }
}

module.exports = new ConjugationService();

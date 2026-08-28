/**
 * Item Response Theory (IRT 3PL) Guessing Parameter & Standard Error Utilities
 */

export interface Irt3PlMetrics {
  itemProbability: number;
  standardErrorOfMeasurement: number;
  itemInformation: number;
}

/**
 * Calculates 3PL IRT probability including pseudo-guessing parameter (c).
 * P(theta) = c + (1 - c) / (1 + e^(-a * (theta - b)))
 */
export function calculate3PLIrtProbability(
  theta: number,
  difficultyB: number,
  discriminationA: number,
  guessingC = 0.20
): Irt3PlMetrics {
  const exponent = -discriminationA * (theta - difficultyB);
  const p2pl = 1.0 / (1.0 + Math.exp(exponent));
  const p3pl = guessingC + (1.0 - guessingC) * p2pl;

  const info = Math.pow(discriminationA, 2) * ((p3pl - guessingC) / (1 - guessingC)) * Math.pow((1 - p3pl) / p3pl, 2);
  const sem = info > 0 ? Math.round((1.0 / Math.sqrt(info)) * 100) / 100 : 0.5;

  return {
    itemProbability: Math.round(p3pl * 1000) / 1000,
    standardErrorOfMeasurement: sem,
    itemInformation: Math.round(info * 100) / 100,
  };
}

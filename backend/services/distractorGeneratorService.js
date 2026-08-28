const geminiService = require('./geminiService');

const normalize = (value) => String(value || '').trim().toLocaleLowerCase().replace(/\s+/g, ' ');

const tokenSet = (value) => new Set(normalize(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean));

const semanticDistance = (left, right) => {
  const a = tokenSet(left);
  const b = tokenSet(right);
  const union = new Set([...a, ...b]).size;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return union ? 1 - overlap / union : 1;
};

const validateDistractors = (distractors, correctAnswer) => {
  const seen = new Set([normalize(correctAnswer)]);
  return (Array.isArray(distractors) ? distractors : []).filter((item) => {
    const text = normalize(item?.text);
    if (!text || seen.has(text)) return false;
    seen.add(text);
    return semanticDistance(text, correctAnswer) >= 0.08;
  }).slice(0, 3);
};

async function generateDistractors({ question, correctAnswer, context, language }) {
  if (!question || !correctAnswer) {
    const error = new Error('Question and correctAnswer are required.');
    error.status = 400;
    throw error;
  }

  const response = await geminiService.generateDistractors({ question, correctAnswer, context, language });
  const distractors = validateDistractors(response.distractors, correctAnswer);
  if (distractors.length !== 3) {
    const error = new Error('The generator did not return three unique distractors.');
    error.status = 502;
    throw error;
  }

  return {
    question,
    correctAnswer,
    distractors: distractors.map((item, index) => ({
      id: index,
      text: String(item.text).trim(),
      misconception: String(item.misconception || 'Plausible misconception.').trim(),
      semanticDistance: Number(semanticDistance(item.text, correctAnswer).toFixed(3)),
    })),
  };
}

module.exports = { generateDistractors, semanticDistance, validateDistractors };

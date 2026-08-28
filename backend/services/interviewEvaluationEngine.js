const EvaluationVersion = require('../models/EvaluationVersion');

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, Math.round(value)));

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

function calculateEvaluation(transcript = [], confidenceMetrics = [], version) {
  const userResponses = transcript.filter(
    (message) => message.role === 'user'
  );

  const responseCount = userResponses.length;

  const averageWords = responseCount
    ? average(
        userResponses.map((message) =>
          String(message.text || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length
        )
      )
    : 0;

  const technical = clamp(
    version.rubric.technical.baseScore +
      responseCount * version.rubric.technical.responseCountBonus +
      averageWords * version.rubric.technical.averageWordsBonus,
    version.rules.minScore,
    version.rules.maxScore
  );

  const communication = clamp(
    version.rubric.communication.baseScore +
      averageWords * version.rubric.communication.averageWordsBonus,
    version.rules.minScore,
    version.rules.maxScore
  );

  const confidence = clamp(
    confidenceMetrics.length
      ? average(confidenceMetrics)
      : version.rubric.confidence.fallbackScore,
    version.rules.minScore,
    version.rules.maxScore
  );

  const overallScore = clamp(
    technical * version.weights.technical +
      communication * version.weights.communication +
      confidence * version.weights.confidence,
    version.rules.minScore,
    version.rules.maxScore
  );

  return {
    overallScore,
    technicalScore: technical,
    communicationScore: communication,
    confidenceScore: confidence,
    feedbackSummary: version.rules.feedback,
  };
}

async function getActiveEvaluationVersion() {
  const version = await EvaluationVersion.findOne({
    where: { isActive: true },
    order: [['createdAt', 'DESC']],
  });

  if (!version) {
    throw new Error('No active evaluation version configured');
  }

  return version;
}

async function getEvaluationVersion(version) {
  const evaluationVersion = await EvaluationVersion.findOne({
    where: { version },
  });

  if (!evaluationVersion) {
    throw new Error(`Evaluation version ${version} not found`);
  }

  return evaluationVersion;
}

async function evaluateInterview(transcript, confidenceMetrics, version) {
  return calculateEvaluation(
    transcript,
    confidenceMetrics,
    version
  );
}

module.exports = {
  getActiveEvaluationVersion,
  getEvaluationVersion,
  evaluateInterview,
};
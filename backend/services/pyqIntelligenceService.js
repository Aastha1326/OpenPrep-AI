const { Op, fn, col, literal } = require('sequelize');
const { PYQ, PYQAnalysis, PYQQuestion, Subject, Quiz } = require('../models');

/**
 * PYQ Intelligence Engine
 * Provides frequency analysis, trend detection, question repeat detection,
 * and smart study recommendations based on historical PYQ data.
 */

/**
 * Frequency Analysis — how often each chapter/topic appears across all years.
 * Returns frequency counts, year distribution, and marks distribution.
 */
exports.analyzeFrequency = async (userId, subjectId) => {
  const questions = await PYQQuestion.findAll({
    include: [
      {
        model: PYQAnalysis,
        where: { userId, subjectId },
        attributes: ['id', 'yearRange'],
      },
    ],
    attributes: ['chapterName', 'topicName', 'marks', 'year', 'questionText'],
  });

  if (questions.length === 0) {
    return { chapters: [], topics: [], totalQuestions: 0, yearSpan: 0 };
  }

  // Chapter frequency
  const chapterMap = {};
  const topicMap = {};
  const yearSet = new Set();

  for (const q of questions) {
    const year = q.year;
    yearSet.add(year);

    // Chapter aggregation
    const ch = q.chapterName || 'General';
    if (!chapterMap[ch]) {
      chapterMap[ch] = { name: ch, totalAppearances: 0, totalMarks: 0, yearDistribution: {}, topicSet: new Set() };
    }
    chapterMap[ch].totalAppearances += 1;
    chapterMap[ch].totalMarks += q.marks || 5;
    chapterMap[ch].yearDistribution[year] = (chapterMap[ch].yearDistribution[year] || 0) + 1;
    chapterMap[ch].topicSet.add(q.topicName);

    // Topic aggregation
    const tp = q.topicName || 'General';
    const topicKey = `${ch}::${tp}`;
    if (!topicMap[topicKey]) {
      topicMap[topicKey] = { chapter: ch, name: tp, totalAppearances: 0, totalMarks: 0, years: [], marksHistory: {} };
    }
    topicMap[topicKey].totalAppearances += 1;
    topicMap[topicKey].totalMarks += q.marks || 5;
    topicMap[topicKey].years.push(year);
    topicMap[topicKey].marksHistory[year] = (topicMap[topicKey].marksHistory[year] || 0) + (q.marks || 5);
  }

  const sortedChapters = Object.values(chapterMap)
    .map((ch) => ({
      name: ch.name,
      totalAppearances: ch.totalAppearances,
      totalMarks: ch.totalMarks,
      avgMarksPerAppearance: Math.round((ch.totalMarks / ch.totalAppearances) * 10) / 10,
      yearDistribution: ch.yearDistribution,
      uniqueTopics: ch.topicSet.size,
      frequencyScore: Math.round((ch.totalAppearances / questions.length) * 100),
    }))
    .sort((a, b) => b.totalAppearances - a.totalAppearances);

  const sortedTopics = Object.values(topicMap)
    .map((tp) => ({
      chapter: tp.chapter,
      name: tp.name,
      totalAppearances: tp.totalAppearances,
      totalMarks: tp.totalMarks,
      years: [...new Set(tp.years)].sort(),
      marksHistory: tp.marksHistory,
    }))
    .sort((a, b) => b.totalAppearances - a.totalAppearances);

  const yearArr = [...yearSet].sort();
  const yearSpan = yearArr.length > 1 ? yearArr[yearArr.length - 1] - yearArr[0] + 1 : 1;

  return {
    chapters: sortedChapters,
    topics: sortedTopics,
    totalQuestions: questions.length,
    yearSpan,
    yearRange: yearArr.length > 0 ? `${yearArr[0]}-${yearArr[yearArr.length - 1]}` : 'N/A',
  };
};

/**
 * Trend Detection — identifies which chapters are increasing, decreasing,
 * or stable in weightage over time.
 */
exports.detectTrends = async (userId, subjectId) => {
  const questions = await PYQQuestion.findAll({
    include: [
      {
        model: PYQAnalysis,
        where: { userId, subjectId },
        attributes: ['id'],
      },
    ],
    attributes: ['chapterName', 'marks', 'year'],
  });

  if (questions.length < 2) {
    return { trends: [], insight: 'Not enough data to detect trends. Upload more PYQ papers.' };
  }

  // Group by year -> chapter -> total marks
  const yearChapterMap = {};
  for (const q of questions) {
    const year = q.year;
    const ch = q.chapterName || 'General';
    if (!yearChapterMap[year]) yearChapterMap[year] = {};
    yearChapterMap[year][ch] = (yearChapterMap[year][ch] || 0) + (q.marks || 5);
  }

  const years = Object.keys(yearChapterMap).map(Number).sort();
  const allChapters = [...new Set(questions.map((q) => q.chapterName || 'General'))];

  const trends = [];

  for (const chapter of allChapters) {
    const yearData = years.map((y) => ({
      year: y,
      marks: yearChapterMap[y]?.[chapter] || 0,
    }));

    // Calculate trend direction via linear regression
    const n = yearData.length;
    const xMean = (n - 1) / 2;
    const yValues = yearData.map((d) => d.marks);
    const yMean = yValues.reduce((a, b) => a + b, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xMean) * (yValues[i] - yMean);
      den += (i - xMean) ** 2;
    }
    const slope = den !== 0 ? num / den : 0;

    // Normalize to percentage change
    const firstYear = yearData[0]?.marks || 0;
    const lastYear = yearData[n - 1]?.marks || 0;
    const pctChange = firstYear > 0 ? Math.round(((lastYear - firstYear) / firstYear) * 100) : lastYear > 0 ? 100 : 0;

    let direction = 'stable';
    if (slope > 1) direction = 'increasing';
    else if (slope < -1) direction = 'decreasing';

    trends.push({
      chapter,
      direction,
      slope: Math.round(slope * 100) / 100,
      pctChange,
      yearData,
      currentWeight: lastYear,
      firstWeight: firstYear,
    });
  }

  trends.sort((a, b) => Math.abs(b.slope) - Math.abs(a.slope));

  const increasing = trends.filter((t) => t.direction === 'increasing');
  const decreasing = trends.filter((t) => t.direction === 'decreasing');

  let insight = 'Chapter weightages are relatively stable across years.';
  if (increasing.length > 0 && decreasing.length > 0) {
    insight = `${increasing[0].chapter} is trending UP (+${increasing[0].pctChange}%), while ${decreasing[0].chapter} is trending DOWN (${decreasing[0].pctChange}%).`;
  } else if (increasing.length > 0) {
    insight = `${increasing.map((t) => `${t.chapter} (+${t.pctChange}%)`).join(', ')} ${increasing.length === 1 ? 'is' : 'are'} gaining weightage over the years.`;
  } else if (decreasing.length > 0) {
    insight = `${decreasing.map((t) => `${t.chapter} (${t.pctChange}%)`).join(', ')} ${decreasing.length === 1 ? 'is' : 'are'} losing weightage.`;
  }

  return { trends, insight, yearRange: `${years[0]}-${years[years.length - 1]}` };
};

/**
 * Repeat Detection — finds questions that appear across multiple years
 * with near-duplicate text matching.
 */
exports.detectRepeats = async (userId, subjectId) => {
  const questions = await PYQQuestion.findAll({
    include: [
      {
        model: PYQAnalysis,
        where: { userId, subjectId },
        attributes: ['id'],
      },
    ],
    attributes: ['id', 'chapterName', 'topicName', 'questionText', 'marks', 'year'],
    order: [['year', 'ASC']],
  });

  if (questions.length < 2) {
    return { repeatedGroups: [], summary: { totalRepeats: 0, mostRepeated: null } };
  }

  // Simple similarity: normalize text and compare keyword overlap
  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const similarity = (a, b) => {
    const wordsA = new Set(normalize(a));
    const wordsB = new Set(normalize(b));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
    return intersection / Math.max(wordsA.size, wordsB.size);
  };

  // Group similar questions
  const used = new Set();
  const groups = [];

  for (let i = 0; i < questions.length; i++) {
    if (used.has(i)) continue;
    const group = [questions[i]];
    used.add(i);

    for (let j = i + 1; j < questions.length; j++) {
      if (used.has(j)) continue;
      const sim = similarity(questions[i].questionText, questions[j].questionText);
      if (sim > 0.5) {
        group.push(questions[j]);
        used.add(j);
      }
    }

    if (group.length > 1) {
      const years = [...new Set(group.map((q) => q.year))].sort();
      groups.push({
        chapterName: group[0].chapterName,
        topicName: group[0].topicName,
        questionText: group[0].questionText,
        marks: group[0].marks,
        appearances: group.length,
        years,
        confidence: Math.round(
          (group.reduce((sum, q, idx) => {
            if (idx === 0) return sum;
            return sum + similarity(group[0].questionText, q.questionText);
          }, 0) / (group.length - 1)) * 100
        ),
      });
    }
  }

  groups.sort((a, b) => b.appearances - a.appearances);

  const mostRepeated = groups.length > 0 ? groups[0] : null;

  return {
    repeatedGroups: groups,
    summary: {
      totalRepeats: groups.length,
      mostRepeated: mostRepeated
        ? {
            question: mostRepeated.questionText.substring(0, 100) + '...',
            appearances: mostRepeated.appearances,
            years: mostRepeated.years,
          }
        : null,
    },
  };
};

/**
 * Smart Recommendations — combines frequency, trend, and repeat data
 * to generate prioritized study recommendations.
 */
exports.generateSmartRecommendations = async (userId, subjectId) => {
  const [frequency, trends, repeats] = await Promise.all([
    exports.analyzeFrequency(userId, subjectId),
    exports.detectTrends(userId, subjectId),
    exports.detectRepeats(userId, subjectId),
  ]);

  const recommendations = [];

  // High-frequency chapters (appear in > 40% of years)
  for (const ch of frequency.chapters) {
    if (ch.frequencyScore > 40) {
      recommendations.push({
        type: 'high-frequency',
        priority: 'high',
        chapter: ch.name,
        title: `High-yield: ${ch.name}`,
        description: `Appears in ${ch.frequencyScore}% of all PYQ papers with ${ch.totalAppearances} questions totaling ${ch.totalMarks} marks. This chapter is consistently tested.`,
        estimatedMarks: ch.totalMarks,
        frequencyScore: ch.frequencyScore,
      });
    }
  }

  // Increasing trends
  for (const trend of trends.trends) {
    if (trend.direction === 'increasing' && trend.pctChange > 20) {
      recommendations.push({
        type: 'trending-up',
        priority: 'high',
        chapter: trend.chapter,
        title: `Rising importance: ${trend.chapter}`,
        description: `Weightage has increased by ${trend.pctChange}% over the years. This chapter is becoming more important in recent exams.`,
        pctChange: trend.pctChange,
      });
    }
  }

  // Repeated questions
  for (const group of repeats.repeatedGroups) {
    if (group.appearances >= 2) {
      recommendations.push({
        type: 'repeated-question',
        priority: group.appearances >= 3 ? 'high' : 'medium',
        chapter: group.chapterName,
        title: `Repeated: ${group.topicName}`,
        description: `This question has appeared ${group.appearances} times across years ${group.years.join(', ')}. Highly likely to appear again.`,
        appearances: group.appearances,
        years: group.years,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1));

  return {
    recommendations,
    frequencySummary: {
      totalChapters: frequency.chapters.length,
      totalTopics: frequency.topics.length,
      totalQuestions: frequency.totalQuestions,
      yearRange: frequency.yearRange,
    },
    trendSummary: trends.insight,
    repeatSummary: repeats.summary,
  };
};

/**
 * Year-over-Year comparison — compare chapter weightage between two year ranges.
 */
exports.compareYearRanges = async (userId, subjectId, range1Start, range1End, range2Start, range2End) => {
  const questions = await PYQQuestion.findAll({
    include: [
      {
        model: PYQAnalysis,
        where: { userId, subjectId },
        attributes: ['id'],
      },
    ],
    attributes: ['chapterName', 'marks', 'year'],
  });

  const getWeightageForRange = (start, end) => {
    const filtered = questions.filter((q) => q.year >= start && q.year <= end);
    const total = filtered.reduce((sum, q) => sum + (q.marks || 5), 0);
    const chapterMap = {};
    for (const q of filtered) {
      const ch = q.chapterName || 'General';
      chapterMap[ch] = (chapterMap[ch] || 0) + (q.marks || 5);
    }
    return Object.entries(chapterMap).map(([name, marks]) => ({
      name,
      marks,
      percentage: total > 0 ? Math.round((marks / total) * 1000) / 10 : 0,
      count: filtered.filter((q) => (q.chapterName || 'General') === name).length,
    }));
  };

  const range1 = getWeightageForRange(range1Start, range1End);
  const range2 = getWeightageForRange(range2Start, range2End);

  // Merge into comparison view
  const allChapters = [...new Set([...range1.map((r) => r.name), ...range2.map((r) => r.name)])];
  const comparison = allChapters.map((ch) => {
    const r1 = range1.find((r) => r.name === ch) || { marks: 0, percentage: 0, count: 0 };
    const r2 = range2.find((r) => r.name === ch) || { marks: 0, percentage: 0, count: 0 };
    return {
      chapter: ch,
      range1: r1,
      range2: r2,
      change: Math.round((r2.percentage - r1.percentage) * 10) / 10,
    };
  });

  comparison.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return {
    range1Label: `${range1Start}-${range1End}`,
    range2Label: `${range2Start}-${range2End}`,
    comparison,
  };
};

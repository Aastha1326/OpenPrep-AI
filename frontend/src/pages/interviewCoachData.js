import {
  INTERVIEW_TYPES,
  DIFFICULTY_LEVELS,
  FEEDBACK_CATEGORIES,
  QUESTION_CATEGORIES,
  STRENGTH_AREAS,
  IMPROVEMENT_AREAS,
} from './interviewCoachTypes';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomSubset = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const MOCK_QUESTIONS = [
  { id: 'q1', text: 'Explain the difference between a stack and a queue. When would you use each?', category: 'dsa', type: 'technical', difficulty: 'easy' },
  { id: 'q2', text: 'Design a URL shortener like bit.ly. How would you handle billions of URLs?', category: 'system_design', type: 'system_design', difficulty: 'hard' },
  { id: 'q3', text: 'Tell me about a time you had to deal with a difficult team member.', category: 'behavioral', type: 'behavioral', difficulty: 'medium' },
  { id: 'q4', text: 'Implement a function to find the longest palindromic substring.', category: 'dsa', type: 'coding', difficulty: 'medium' },
  { id: 'q5', text: 'How does a hash table handle collisions? Discuss chaining vs open addressing.', category: 'dsa', type: 'technical', difficulty: 'medium' },
  { id: 'q6', text: 'Design a real-time chat application. Consider scalability and message ordering.', category: 'system_design', type: 'system_design', difficulty: 'hard' },
  { id: 'q7', text: 'Describe a project where you had to learn a new technology quickly.', category: 'behavioral', type: 'behavioral', difficulty: 'easy' },
  { id: 'q8', text: 'Explain the CAP theorem and its implications for distributed systems.', category: 'system_design', type: 'technical', difficulty: 'hard' },
  { id: 'q9', text: 'How do you handle deadlock in operating systems? Give prevention strategies.', category: 'os', type: 'technical', difficulty: 'medium' },
  { id: 'q10', text: 'Explain database normalization up to BCNF with examples.', category: 'dbms', type: 'technical', difficulty: 'medium' },
  { id: 'q11', text: 'Describe the TCP three-way handshake and why it matters.', category: 'cn', type: 'technical', difficulty: 'easy' },
  { id: 'q12', text: 'Tell me about a time you failed. What did you learn?', category: 'behavioral', type: 'behavioral', difficulty: 'easy' },
  { id: 'q13', text: 'Design a notification system that handles millions of users.', category: 'system_design', type: 'system_design', difficulty: 'expert' },
  { id: 'q14', text: 'Write code to detect a cycle in a linked list.', category: 'dsa', type: 'coding', difficulty: 'medium' },
  { id: 'q15', text: 'Explain gradient descent and its variants. When would you use each?', category: 'ml', type: 'technical', difficulty: 'hard' },
  { id: 'q16', text: 'How would you optimize a slow SQL query? Walk through your approach.', category: 'dbms', type: 'technical', difficulty: 'medium' },
  { id: 'q17', text: 'Describe your approach to debugging a production issue.', category: 'web', type: 'technical', difficulty: 'medium' },
  { id: 'q18', text: 'Tell me about a time you had to make a decision with incomplete information.', category: 'leadership', type: 'behavioral', difficulty: 'medium' },
  { id: 'q19', text: 'How do you prioritize tasks when everything seems urgent?', category: 'leadership', type: 'behavioral', difficulty: 'easy' },
  { id: 'q20', text: 'Design a rate limiter. Discuss different algorithms and their trade-offs.', category: 'system_design', type: 'system_design', difficulty: 'hard' },
];

export const generateMockQuestions = (count = 10) => {
  return MOCK_QUESTIONS.slice(0, count).map(q => ({
    ...q,
    difficulty: DIFFICULTY_LEVELS[q.difficulty],
    timeLimit: q.type === 'coding' ? 1800 : q.type === 'system_design' ? 2400 : 1200,
    expectedDuration: q.type === 'coding' ? 900 : q.type === 'system_design' ? 1800 : 600,
    hints: getHintsForQuestion(q.id),
    sampleAnswer: getSampleAnswer(q.id),
    keyPoints: getKeyPoints(q.id),
  }));
};

const getHintsForQuestion = (id) => {
  const hints = {
    q1: ['Think about LIFO vs FIFO', 'Consider real-world scenarios like undo/redo'],
    q2: ['Consider hash functions and key generation', 'Think about storage and caching strategies'],
    q3: ['Use the STAR method', 'Focus on resolution, not just the conflict'],
    q4: ['Consider dynamic programming or expand from center', 'Think about time complexity requirements'],
    q5: ['Hash function quality matters', 'Discuss load factor and rehashing'],
    q6: ['Think about WebSocket vs long polling', 'Consider message persistence and delivery guarantees'],
    q7: ['Highlight the learning process', 'Mention the outcome and what you built'],
    q8: ['Consistency, Availability, Partition tolerance', 'You can only guarantee two at a time'],
    q9: ['Four conditions must hold for deadlock', 'Think about resource allocation graphs'],
    q10: ['Start from 1NF, progress through 2NF, 3NF', 'BCNF eliminates all transitive dependencies'],
    q11: ['SYN, SYN-ACK, ACK', 'Why not just a two-way handshake?'],
    q12: ['Show self-awareness and growth', 'Connect it to a concrete lesson'],
    q13: ['Consider priority queues and throttling', 'Think about multi-channel delivery'],
    q14: ['Floyd\'s cycle detection is elegant', 'Consider the time and space complexity'],
    q15: ['Batch gradient descent vs stochastic', 'Learning rate scheduling is key'],
    q16: ['EXPLAIN plan is your friend', 'Think about indexes and query rewriting'],
    q17: ['Reproduce first, then isolate', 'Check logs, metrics, and recent changes'],
    q18: ['Show your reasoning process', 'Demonstrate risk assessment skills'],
    q19: ['Eisenhower matrix can help', 'Talk about communication with stakeholders'],
    q20: ['Token bucket, sliding window, fixed window', 'Discuss memory vs accuracy trade-offs'],
  };
  return hints[id] || ['Think step by step', 'Consider edge cases'];
};

const getSampleAnswer = (id) => {
  const answers = {
    q1: 'A stack follows LIFO (Last In First Out) - like a plate stack. A queue follows FIFO (First In First First) - like a line. Use stacks for undo/redo, function calls, and DFS. Use queues for BFS, task scheduling, and buffering.',
    q2: 'Key components: hash function for URL mapping, database for storage (NoSQL for scale), cache layer (Redis) for hot URLs, analytics service. Handle uniqueness with base62 encoding of auto-incrementing IDs or MD5 hash.',
    q3: 'STAR: Situation - worked with a team member who missed deadlines. Task - needed to maintain project timeline. Action - had a private conversation, discovered workload issues, redistributed tasks. Result - delivered on time, improved team dynamics.',
    q4: 'Approach: Expand around center for each character. For odd-length, center is one char. For even-length, center is between two chars. Time: O(n²), Space: O(1). Alternative: Manacher\'s algorithm for O(n).',
    q5: 'Hash table maps keys to indices via hash function. Collisions happen when two keys hash to same index. Chaining: each slot holds a linked list. Open addressing: probe for next empty slot (linear, quadratic, or double hashing). Chaining is simpler; open addressing is cache-friendly.',
  };
  return answers[id] || 'A comprehensive answer addressing all aspects of the question with specific examples and clear structure.';
};

const getKeyPoints = (id) => {
  const points = {
    q1: ['LIFO vs FIFO definition', 'Real-world use cases', 'Time complexity O(1) for both', 'Implementation examples'],
    q2: ['Hash function design', 'Database schema', 'Caching strategy', 'Analytics and metrics', 'Scalability considerations'],
    q3: ['Clear STAR structure', 'Specific situation described', 'Concrete actions taken', 'Positive outcome with metrics'],
    q4: ['Correct algorithm choice', 'Working code implementation', 'Time/space complexity analysis', 'Edge case handling'],
    q5: ['Hash function explanation', 'Collision handling methods', 'Load factor discussion', 'Performance characteristics'],
  };
  return points[id] || ['Clear explanation', 'Specific examples', 'Edge cases considered', 'Trade-offs discussed'];
};

export const generateInterviewSession = () => {
  const sessionId = `session-${Date.now()}`;
  const questionCount = randomInt(5, 10);
  const questions = generateMockQuestions(questionCount);
  const interviewType = randomChoice(Object.keys(INTERVIEW_TYPES));

  const responses = questions.map((q, idx) => {
    const score = randomFloat(40, 98);
    const duration = randomInt(120, q.timeLimit);
    const feedbackScores = {};
    Object.keys(FEEDBACK_CATEGORIES).forEach(cat => {
      feedbackScores[cat] = randomFloat(40, 98);
    });

    return {
      questionId: q.id,
      question: q.text,
      category: q.category,
      interviewType: q.type,
      difficulty: q.difficulty,
      score,
      duration,
      feedbackScores,
      aiFeedback: generateAIFeedback(score, q.category),
      keyPointsHit: randomSubset(q.keyPoints, randomInt(1, q.keyPoints.length)),
      keyPointsMissed: q.keyPoints.filter(p => !randomSubset(q.keyPoints, q.keyPoints.length - 1).includes(p)),
      strengths: randomSubset(STRENGTH_AREAS, randomInt(1, 3)),
      improvements: randomSubset(IMPROVEMENT_AREAS, randomInt(1, 3)),
    };
  });

  const overallScore = parseFloat(
    (responses.reduce((sum, r) => sum + r.score, 0) / responses.length).toFixed(1)
  );

  return {
    sessionId,
    interviewType,
    ...INTERVIEW_TYPES[interviewType],
    date: new Date().toISOString().split('T')[0],
    totalQuestions: questionCount,
    completedQuestions: responses.length,
    overallScore,
    duration: responses.reduce((sum, r) => sum + r.duration, 0),
    responses,
    overallFeedback: generateOverallFeedback(overallScore),
    strengths: [...new Set(responses.flatMap(r => r.strengths))].slice(0, 5),
    improvements: [...new Set(responses.flatMap(r => r.improvements))].slice(0, 5),
  };
};

const generateAIFeedback = (score, category) => {
  if (score >= 85) return `Excellent response! You demonstrated strong knowledge of ${category} with clear, structured explanations. Your examples were relevant and showed deep understanding.`;
  if (score >= 70) return `Good response on ${category}. You covered the main points well but could improve by adding more specific examples and discussing edge cases.`;
  if (score >= 50) return `Decent attempt. Your response touched on key ${category} concepts but lacked depth. Try structuring your answer more clearly and providing concrete examples.`;
  return `This area needs more practice. Review the fundamentals of ${category} and practice explaining concepts out loud. Consider using a structured approach like STAR for behavioral questions.`;
};

const generateOverallFeedback = (score) => {
  if (score >= 85) return 'Outstanding performance! You\'re well-prepared for interviews. Focus on maintaining consistency and handling increasingly difficult questions.';
  if (score >= 70) return 'Good progress! You have solid fundamentals. Work on adding more depth to your explanations and practicing under time pressure.';
  if (score >= 50) return 'Room for improvement. Focus on core concepts and practice structured answering. Consider mock interviews with peers.';
  return 'Keep practicing! Start with fundamentals and gradually increase difficulty. Use flashcards for key concepts and practice daily.';
};

export const generatePerformanceHistory = (sessions = 12) => {
  const history = [];
  const now = new Date();

  for (let i = sessions - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * randomInt(2, 5));
    const type = randomChoice(Object.keys(INTERVIEW_TYPES));
    const score = randomFloat(45, 95);

    history.push({
      sessionId: `hist-${i}`,
      date: date.toISOString().split('T')[0],
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      interviewType: type,
      ...INTERVIEW_TYPES[type],
      overallScore: score,
      questionsAnswered: randomInt(5, 10),
      avgDuration: randomInt(120, 600),
      topStrength: randomChoice(STRENGTH_AREAS),
      topImprovement: randomChoice(IMPROVEMENT_AREAS),
    });
  }

  return history.sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const generateSkillRadar = () => {
  return Object.keys(FEEDBACK_CATEGORIES).map(cat => ({
    skill: FEEDBACK_CATEGORIES[cat].label,
    score: randomFloat(50, 95),
    benchmark: randomFloat(60, 80),
    icon: FEEDBACK_CATEGORIES[cat].icon,
  }));
};

export const generateCategoryPerformance = () => {
  return QUESTION_CATEGORIES.slice(0, 8).map(cat => ({
    ...cat,
    questionsAttempted: randomInt(5, 30),
    avgScore: randomFloat(45, 92),
    bestScore: randomFloat(80, 100),
    worstScore: randomFloat(20, 60),
    trend: randomChoice(['improving', 'stable', 'declining']),
    recentScores: Array.from({ length: 8 }, () => randomFloat(40, 95)),
  }));
};

export const generateWeeklyGoal = () => ({
  targetSessions: randomInt(5, 10),
  completedSessions: randomInt(2, 8),
  targetQuestions: randomInt(50, 100),
  completedQuestions: randomInt(20, 80),
  targetAccuracy: randomInt(70, 85),
  currentAccuracy: randomFloat(55, 88),
  targetHours: randomInt(5, 15),
  completedHours: randomFloat(2, 12),
});

export const generateInterviewTips = () => [
  { id: 't1', title: 'Think Out Loud', category: 'technical', tip: 'Explain your thought process as you solve problems. Interviewers want to see how you approach challenges, not just the final answer.', priority: 'high' },
  { id: 't2', title: 'Use STAR Method', category: 'behavioral', tip: 'Structure behavioral answers with Situation, Task, Action, Result. Keep each part concise with specific details.', priority: 'high' },
  { id: 't3', title: 'Ask Clarifying Questions', category: 'technical', tip: 'Before jumping into a solution, ask questions to understand requirements and constraints. This shows maturity.', priority: 'high' },
  { id: 't4', title: 'Time Management', category: 'general', tip: 'Practice answering within time limits. Spend 30 seconds planning, then execute. If stuck for 3 minutes, try a different approach.', priority: 'medium' },
  { id: 't5', title: 'Review Complexity', category: 'technical', tip: 'Always state the time and space complexity of your solution. Compare it with alternatives briefly.', priority: 'high' },
  { id: 't6', title: 'Practice Daily', category: 'general', tip: 'Consistency beats intensity. Solve 2-3 problems daily rather than 15 on weekends.', priority: 'medium' },
  { id: 't7', title: 'Mock Interviews', category: 'general', tip: 'Practice with peers or AI coaches weekly. Real-time feedback accelerates improvement more than solo practice.', priority: 'high' },
  { id: 't8', title: 'Know Your Resume', category: 'behavioral', tip: 'Be ready to deep-dive into any project on your resume. Use metrics and specific outcomes.', priority: 'medium' },
];

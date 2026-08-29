const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const ChatMessage = require('../models/ChatMessage');
const { geminiService } = require('./geminiService');

/** Gather context about the student for personalized responses. */
async function gatherStudentContext(userId) {
  const { sequelize } = require('../config/db');
  const User = require('../models/User');
  const user = await User.findByPk(userId);
  const [quizResult] = await sequelize.query(
    `SELECT COUNT(*) as cnt, AVG("score") as avg FROM "QuizAttempts" WHERE "user" = :userId`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );
  return {
    name: user?.name || 'Student',
    totalQuizzes: parseInt(quizResult?.cnt || '0', 10),
    avgScore: Math.round(parseFloat(quizResult?.avg || '0')),
    xp: user?.xp || 0,
  };
}

/** Build the system prompt with student context. */
function buildSystemPrompt(ctx) {
  return `You are a friendly, knowledgeable study companion for ${ctx.name}. You help with study questions, explain concepts clearly, provide exam tips, and keep students motivated.

Student Profile:
- Total quizzes taken: ${ctx.totalQuizzes}
- Average quiz score: ${ctx.avgScore}%
- XP earned: ${ctx.xp}

Guidelines:
- Be encouraging but honest about weaknesses
- Keep explanations concise and clear (2-4 sentences max unless asked for detail)
- Use examples when explaining concepts
- If you don't know something, say so honestly
- Suggest related topics or practice when relevant
- Format responses with markdown when helpful (bold, lists)
- End with a follow-up question or suggestion to keep the conversation going`;
}

/** Generate AI response using Gemini or fallback. */
async function generateResponse(userId, sessionId, userMessage, conversationHistory = []) {
  const ctx = await gatherStudentContext(userId);
  const systemPrompt = buildSystemPrompt(ctx);

  // Build conversation context
  const contextWindow = conversationHistory.slice(-10); // Last 10 messages
  const fullPrompt = `${systemPrompt}\n\nConversation:\n${contextWindow.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nuser: ${userMessage}`;

  let responseText;
  let messageType = 'general';

  // Detect message type from keywords
  const lower = userMessage.toLowerCase();
  if (lower.includes('explain') || lower.includes('what is') || lower.includes('define') || lower.includes('how does')) messageType = 'explanation';
  else if (lower.includes('tip') || lower.includes('advice') || lower.includes('suggest') || lower.includes('how to improve')) messageType = 'tip';
  else if (lower.includes('summarize') || lower.includes('summary') || lower.includes('review')) messageType = 'summary';
  else if (lower.includes('?')) messageType = 'question';

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(fullPrompt);
    responseText = result.response.text();
  } catch (err) {
    console.warn('[StudyCompanion] Gemini unavailable, using fallback:', err.message);
    responseText = buildFallbackResponse(userMessage, ctx, messageType);
  }

  // Save user message
  await ChatMessage.create({
    user: userId, sessionId, role: 'user', content: userMessage,
    messageType: 'general', tokenCount: Math.ceil(userMessage.length / 4),
  });

  // Save assistant response
  const assistantMsg = await ChatMessage.create({
    user: userId, sessionId, role: 'assistant', content: responseText,
    messageType, tokenCount: Math.ceil(responseText.length / 4),
  });

  return assistantMsg;
}

/** Build a deterministic fallback response. */
function buildFallbackResponse(message, ctx, type) {
  const lower = message.toLowerCase();
  if (type === 'tip') {
    return `Here are some study tips for you, ${ctx.name}:\n\n1. **Active Recall**: Test yourself instead of re-reading\n2. **Spaced Repetition**: Review at increasing intervals (1, 3, 7 days)\n3. **Pomodoro Technique**: Study 25 min, break 5 min\n4. **Teach Others**: Explaining concepts solidifies understanding\n\nWith your ${ctx.avgScore}% average across ${ctx.totalQuizzes} quizzes, focusing on active recall could help push your scores even higher!\n\nWhat specific topic would you like help with?`;
  }
  if (type === 'explanation') {
    return `Great question! Let me help you understand this concept.\n\nTo explain this clearly, I'd break it down into these key points:\n\n1. **Core Concept**: Every topic has a fundamental principle — understanding that first makes everything else click\n2. **Key Relationships**: How this connects to related topics you've already learned\n3. **Practical Application**: Where this shows up in exams and real scenarios\n\nCould you tell me which specific part you'd like me to dive deeper into? I can provide examples or analogies to make it clearer.`;
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hey ${ctx.name}! 👋 I'm your study companion. I can help you with:\n\n- 📚 **Explaining concepts** you're studying\n- 💡 **Study tips** and techniques\n- 📝 **Quiz preparation** advice\n- 🎯 **Exam strategy** suggestions\n- 💪 **Motivation** when you need it\n\nWith ${ctx.totalQuizzes} quizzes completed and a ${ctx.avgScore}% average, you're making solid progress! What would you like to work on today?`;
  }
  return `Thanks for your message, ${ctx.name}! That's an interesting question.\n\nHere's what I can share:\n\nI'd be happy to help you explore this topic further. To give you the most relevant answer, could you provide a bit more detail about what specifically you'd like to know?\n\nIn the meantime, remember that consistent practice (${ctx.avgScore}% average is a great foundation!) and active recall are the most effective study strategies.\n\nWhat would you like to focus on?`;
}

/** Create a new chat session. */
function createSession() { return uuidv4(); }

/** Get chat history for a session. */
async function getSessionHistory(userId, sessionId, limit = 50) {
  return ChatMessage.findAll({
    where: { user: userId, sessionId },
    order: [['createdAt', 'ASC']],
    limit,
  });
}

/** Get all sessions for a user (grouped by sessionId). */
async function getUserSessions(userId) {
  const messages = await ChatMessage.findAll({
    where: { user: userId },
    attributes: ['sessionId', 'createdAt', 'content', 'role'],
    order: [['createdAt', 'DESC']],
    limit: 200,
  });
  const sessions = {};
  messages.forEach((m) => {
    if (!sessions[m.sessionId]) {
      sessions[m.sessionId] = { sessionId: m.sessionId, lastMessage: '', lastAt: m.createdAt, messageCount: 0 };
    }
    sessions[m.sessionId].messageCount++;
    if (m.role === 'user' && !sessions[m.sessionId].lastMessage) {
      sessions[m.sessionId].lastMessage = m.content.slice(0, 80);
    }
    if (m.createdAt > sessions[m.sessionId].lastAt) sessions[m.sessionId].lastAt = m.createdAt;
  });
  return Object.values(sessions).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

/** Rate a message as helpful/not helpful. */
async function rateMessage(messageId, userId, helpful) {
  const msg = await ChatMessage.findOne({ where: { id: messageId, user: userId, role: 'assistant' } });
  if (!msg) return null;
  msg.helpful = helpful;
  await msg.save();
  return msg;
}

/** Get chat stats. */
async function getChatStats(userId) {
  const { sequelize } = require('../config/db');
  const [result] = await sequelize.query(
    `SELECT COUNT(*) as totalMessages, COUNT(DISTINCT "sessionId") as totalSessions, AVG(CASE WHEN "helpful" = true THEN 1 WHEN "helpful" = false THEN 0 END) * 100 as helpfulPct FROM "ChatMessages" WHERE "user" = :userId`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );
  const [typeResult] = await sequelize.query(
    `SELECT "messageType", COUNT(*) as cnt FROM "ChatMessages" WHERE "user" = :userId AND "role" = 'assistant' GROUP BY "messageType"`,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );
  return {
    totalMessages: parseInt(result?.totalMessages || '0', 10),
    totalSessions: parseInt(result?.totalSessions || '0', 10),
    helpfulPct: Math.round(parseFloat(result?.helpfulPct || '0')),
    byType: typeResult || [],
  };
}

module.exports = { createSession, generateResponse, getSessionHistory, getUserSessions, rateMessage, getChatStats };

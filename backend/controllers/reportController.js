const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const QuizAttempt = require('../models/QuizAttempt');
const StudyPlan = require('../models/StudyPlan');
const Progress = require('../models/Progress');

exports.generateStudySummary = async (req, res, next) => {
  try {
    const range = req.query.range || '30d'; // 7d, 30d, all
    const userId = req.user.id;
    
    let dateFilter = {};
    const now = new Date();
    if (range === '7d') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { [Op.gte]: past7 } };
    } else if (range === '30d') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      dateFilter = { createdAt: { [Op.gte]: past30 } };
    }

    const attempts = await QuizAttempt.findAll({
      where: { userId, ...dateFilter }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Study_Summary_${range}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(24).text('Study Performance Report', { align: 'center' });
    doc.moveDown();
    
    if (attempts.length === 0) {
      doc.fontSize(14).text('No activity logged during this period.', { align: 'center' });
      doc.end();
      return;
    }

    const totalAttempts = attempts.length;
    let totalScore = 0;
    let totalTime = 0;

    attempts.forEach(a => {
      totalScore += (a.score || 0);
      totalTime += (a.timeSpent || 0);
    });

    const avgScore = (totalScore / totalAttempts).toFixed(2);
    const avgTime = (totalTime / totalAttempts).toFixed(2);

    doc.fontSize(16).text('Executive Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Quizzes Attempted: ${totalAttempts}`);
    doc.text(`Average Score: ${avgScore}`);
    doc.text(`Average Response Time: ${avgTime}s`);
    
    doc.moveDown();
    doc.fontSize(16).text('Weak Topic Breakdown', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text('Analytics data goes here...');

    doc.end();
  } catch (error) {
    next(error);
  }
};

exports.generateCertificate = async (req, res, next) => {
  try {
    const { planId } = req.query;
    if (!planId) {
      return res.status(400).json({ success: false, error: 'planId is required' });
    }

    const plan = await StudyPlan.findOne({ where: { id: planId, user: req.user.id } });
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Study plan not found' });
    }

    let isComplete = plan.status === 'completed';
    if (!isComplete && plan.dailyGoals && plan.dailyGoals.length > 0) {
      const totalGoals = plan.dailyGoals.length;
      const completedGoals = plan.dailyGoals.filter(g => g.completed).length;
      if (totalGoals === completedGoals) {
        isComplete = true;
      }
    }

    if (!isComplete) {
       return res.status(403).json({ success: false, error: 'Cannot generate certificate for an incomplete study plan.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${planId}.pdf`);

    const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
    doc.pipe(res);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fff');
    doc.fillColor('#000');
    
    doc.fontSize(40).text('Certificate of Achievement', { align: 'center', margin: 50 });
    doc.moveDown();
    doc.fontSize(20).text(`This certifies that ${req.user.name || 'Student'}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(`has successfully completed the study plan`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

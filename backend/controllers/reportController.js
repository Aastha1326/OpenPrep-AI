const PDFDocument = require('pdfkit');
const { Op } = require('sequelize');
const QuizAttempt = require('../models/QuizAttempt');
const StudyPlan = require('../models/StudyPlan');
const Progress = require('../models/Progress');
const certificateService = require('../services/certificateService');

/**
 * Generate PDF Study Performance Summary Report
 * @route GET /api/reports/study-summary
 */
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
    const { planId, template } = req.query;
    
    if (!planId) {
      return res.status(400).json({ success: false, error: 'planId is required' });
    }

    // Use the certificate service for enhanced generation
    const templateName = template || 'default';
    const { certificateData, pdfBuffer } = await certificateService.generateCertificate(
      planId, 
      req.user.id, 
      templateName
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certificateData.certificateNumber}.pdf`);
    
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

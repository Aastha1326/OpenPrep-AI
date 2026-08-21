const fs = require('fs');
let content = fs.readFileSync('controllers/progressController.js', 'utf8');

const exportFunc = `
// @desc    Export analytics data (CSV)
// @route   GET /api/progress/export
// @access  Private
exports.exportAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { timeframe } = req.query; // e.g., '7days', '30days', 'all'
    
    let dateFilter = {};
    if (timeframe === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      dateFilter = { updatedAt: { [Op.gte]: d } };
    } else if (timeframe === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      dateFilter = { updatedAt: { [Op.gte]: d } };
    }

    const attempts = await QuizAttempt.findAll({
      where: { user: userId, ...dateFilter },
      include: [
        {
          model: Quiz,
          as: 'quizRef',
          include: [{ model: Subject, as: 'subjectRef' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    let csv = 'Quiz Title,Date,Subject,Score,Time Spent,Accuracy\\n';
    attempts.forEach(att => {
      const quizTitle = att.quizRef ? att.quizRef.title : 'Unknown Quiz';
      const dateStr = new Date(att.createdAt).toLocaleDateString();
      const subjectName = (att.quizRef && att.quizRef.subjectRef) ? att.quizRef.subjectRef.name : 'Unknown Subject';
      const score = att.score || 0;
      const timeSpent = att.timeSpent || 0;
      const accuracy = att.score ? att.score + '%' : '0%';
      
      // Escape commas in strings just in case
      const escapeCsv = (str) => '"' + String(str).replace(/"/g, '""') + '"';
      
      csv += \`\${escapeCsv(quizTitle)},\${dateStr},\${escapeCsv(subjectName)},\${score},\${timeSpent},\${accuracy}\\n\`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
`;

content += '\n' + exportFunc;
fs.writeFileSync('controllers/progressController.js', content, 'utf8');

// Update routes
let routesContent = fs.readFileSync('routes/progressRoutes.js', 'utf8');
routesContent = routesContent.replace(
  '  getActivityFeed,\n} = require(',
  '  getActivityFeed,\n  exportAnalytics,\n} = require('
);
routesContent = routesContent.replace(
  'module.exports = router;',
  'router.get(\'/export\', protect, exportAnalytics);\n\nmodule.exports = router;'
);
fs.writeFileSync('routes/progressRoutes.js', routesContent, 'utf8');

console.log('Backend changes for export complete.');

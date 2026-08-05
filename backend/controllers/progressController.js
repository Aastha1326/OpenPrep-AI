const { Op, fn, col } = require('sequelize');
const PDFDocument = require('pdfkit');
const Progress = require('../models/Progress');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const QuizAttempt = require('../models/QuizAttempt');
const Subject = require('../models/Subject');
const Exam = require('../models/Exam');
const FocusSession = require('../models/FocusSession');
// @desc    Get dashboard metrics & activity feed
// @route   GET /api/progress/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. User profile stats (streak & study hours)
    const streak = req.user.streakCount || 0;
    const totalStudyHours = req.user.studyHours || 0;

    // 2. Topic statistics breakdown (Strong, Medium, Weak counts) via aggregation
    const totalTopicsCount = await Topic.count({ where: { user: userId } });

    const topicStats = await Topic.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'count']],
      where: { user: userId },
      group: ['status'],
      raw: true,
    });

    let strongCount = 0;
    let mediumCount = 0;
    let weakCount = 0;

    topicStats.forEach((t) => {
      const count = parseInt(t.count, 10) || 0;
      if (t.status === 'Strong') strongCount = count;
      else if (t.status === 'Medium') mediumCount = count;
      else if (t.status === 'Weak') weakCount = count;
    });

    // Calculate syllabus progress percentage via aggregation
    const [totalCompletionResult] = await Progress.findAll({
      attributes: [[fn('SUM', col('completionPercentage')), 'totalCompletion']],
      where: { user: userId },
      raw: true,
    });
    const totalCompletionSum = parseFloat(totalCompletionResult?.totalCompletion) || 0;
    const syllabusProgress =
      totalTopicsCount > 0 ? Math.round(totalCompletionSum / totalTopicsCount) : 0;

    // 3. Quiz attempts summaries
    const attemptsCount = await QuizAttempt.count({ where: { user: userId } });

    // 4. Study Hours Chart Data (weekly progression over last 7 calendar days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const progressHistory = await Progress.findAll({
      attributes: [
        [fn('DATE', col('updatedAt')), 'date'],
        [fn('SUM', col('studyHours')), 'totalStudyHours'],
        [fn('AVG', col('completionPercentage')), 'avgCompletion'],
      ],
      where: {
        user: userId,
        updatedAt: { [Op.gte]: sevenDaysAgo },
      },
      group: [fn('DATE', col('updatedAt'))],
      order: [[fn('DATE', col('updatedAt')), 'ASC']],
      raw: true,
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      const record = progressHistory.find((r) => r.date === dateStr);
      weeklyChartData.push({
        day: dayNames[date.getDay()],
        hours: record ? parseFloat(record.totalStudyHours) || 0 : 0,
        completion: record ? Math.round(parseFloat(record.avgCompletion)) || 0 : 0,
      });
    }

    // 5. Recent activity logs
    const activities = await ActivityLog.findAll({
      where: { user: userId },
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    res.status(200).json({
      success: true,
      data: {
        streak,
        totalStudyHours,
        syllabusProgress,
        topicsBreakdown: {
          total: totalTopicsCount,
          strong: strongCount,
          medium: mediumCount,
          weak: weakCount,
        },
        attemptsCount,
        weeklyChartData,
        recentActivity: activities,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed subject-wise performance breakdown
// @route   GET /api/progress/subjects
// @access  Private
exports.getSubjectBreakdown = async (req, res, next) => {
  try {
    // Aggregate progress stats per subject directly in PostgreSQL
    const breakdown = await Progress.findAll({
      where: { user: req.user.id },
      attributes: [
        [fn('COUNT', col('topic')), 'topicsCount'],
        [fn('SUM', col('completionPercentage')), 'totalCompletion'],
        [fn('SUM', col('studyHours')), 'totalHours'],
        [fn('SUM', col('flashcardsMastered')), 'flashcardsMastered'],
      ],
      include: [{ model: Subject, as: 'subjectRef', attributes: ['name'] }],
      group: ['subjectRef.id'],
      raw: true,
    });

    const result = breakdown
      .filter((b) => b['subjectRef.name'])
      .map((b) => ({
        subjectName: b['subjectRef.name'],
        progressPercentage:
          parseInt(b.topicsCount, 10) > 0
            ? Math.round(parseFloat(b.totalCompletion) / parseInt(b.topicsCount, 10))
            : 0,
        studyHours: parseFloat(b.totalHours) || 0,
        flashcardsMastered: parseInt(b.flashcardsMastered, 10) || 0,
      }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Target Exam Composite Bundle Overview with cumulative weighted syllabus progress
// @route   GET /api/progress/composite-overview
// @access  Private
exports.getCompositeBundleOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { examId } = req.query;

    let exam;
    if (examId) {
      exam = await Exam.findOne({ where: { id: examId, user: userId } });
    } else {
      exam = await Exam.findOne({
        where: { user: userId, isBundle: true },
        order: [['createdAt', 'DESC']],
      });
      if (!exam) {
        exam = await Exam.findOne({
          where: { user: userId },
          order: [['date', 'ASC']],
        });
      }
    }

    if (!exam) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const subjects = await Subject.findAll({ where: { exam: exam.id, user: userId } });
    let totalWeightedProgress = 0;
    let totalWeightage = 0;
    const subjectBreakdown = [];

    for (const sub of subjects) {
      const topics = await Topic.findAll({ where: { subject: sub.id, user: userId } });
      const topicCount = topics.length;

      let subProgress = 0;
      if (topicCount > 0) {
        const topicIds = topics.map((t) => t.id);
        const [sumResult] = await Progress.findAll({
          attributes: [[fn('SUM', col('completionPercentage')), 'totalCompletion']],
          where: { user: userId, topic: { [Op.in]: topicIds } },
          raw: true,
        });
        const sum = parseFloat(sumResult?.totalCompletion) || 0;
        subProgress = Math.round(sum / topicCount);
      }

      const weightage = sub.weightage || (subjects.length > 0 ? 100 / subjects.length : 0);
      totalWeightedProgress += subProgress * weightage;
      totalWeightage += weightage;

      subjectBreakdown.push({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        weightage: Math.round(weightage * 10) / 10,
        topicCount,
        progressPercentage: subProgress,
      });
    }

    const cumulativeProgress = totalWeightage > 0 ? Math.round(totalWeightedProgress / totalWeightage) : 0;

    res.status(200).json({
      success: true,
      data: {
        examId: exam.id,
        examName: exam.name,
        description: exam.description,
        examDate: exam.date,
        isBundle: exam.isBundle || false,
        targetExamType: exam.targetExamType || 'Custom',
        cumulativeProgress,
        totalSubjects: subjects.length,
        subjects: subjectBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get study hours tracking data
// @route   GET /api/progress/study-hours
// @access  Private
exports.getStudyHours = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const totalStudyHours = req.user.studyHours || 0;

    // Weekly study hours from Progress records (last 7 calendar days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const progressHistory = await Progress.findAll({
      attributes: [
        [fn('DATE', col('updatedAt')), 'date'],
        [fn('SUM', col('studyHours')), 'totalStudyHours'],
      ],
      where: {
        user: userId,
        updatedAt: { [Op.gte]: sevenDaysAgo },
      },
      group: [fn('DATE', col('updatedAt'))],
      order: [[fn('DATE', col('updatedAt')), 'ASC']],
      raw: true,
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      const record = progressHistory.find((r) => r.date === dateStr);
      weeklyData.push({
        day: dayNames[date.getDay()],
        hours: record ? parseFloat(record.totalStudyHours) || 0 : 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalStudyHours,
        weeklyData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log study time for a topic/subject
// @route   POST /api/progress/track
// @access  Private
exports.trackStudyTime = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { studyHours, subjectId, topicId, description } = req.body;

    if (studyHours == null || studyHours <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide valid study hours (must be greater than 0)',
      });
    }

    // If a topic is specified, update or create a Progress record
    if (topicId && subjectId) {
      const [progress, created] = await Progress.findOrCreate({
        where: { user: userId, topic: topicId },
        defaults: {
          user: userId,
          subject: subjectId,
          topic: topicId,
          studyHours: parseFloat(studyHours),
          completionPercentage: 0,
        },
      });
      if (!created) {
        progress.studyHours = (progress.studyHours || 0) + parseFloat(studyHours);
        await progress.save();
      }
    } else if (subjectId) {
      // If only subject is specified, update or create a Progress record for that subject
      const [progress, created] = await Progress.findOrCreate({
        where: { user: userId, subject: subjectId, topic: null },
        defaults: {
          user: userId,
          subject: subjectId,
          topic: null,
          studyHours: parseFloat(studyHours),
          completionPercentage: 0,
        },
      });
      if (!created) {
        progress.studyHours = (progress.studyHours || 0) + parseFloat(studyHours);
        await progress.save();
      }
    }

    // Log activity
    await ActivityLog.create({
      user: userId,
      activityType: 'study_plan_create',
      description: description || `Studied for ${studyHours} hour${studyHours !== 1 ? 's' : ''}`,
    });

    // Accumulate total study hours on the user record AFTER progress + activity succeed
    req.user.studyHours = (req.user.studyHours || 0) + parseFloat(studyHours);
    await req.user.save();

    res.status(200).json({
      success: true,
      data: {
        totalStudyHours: req.user.studyHours,
        hoursLogged: parseFloat(studyHours),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update topic progress (completion, flashcards, quiz scores)
// @route   PUT /api/progress/topic/:id
// @access  Private
exports.updateTopicProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const topicId = req.params.id;

    const topic = await Topic.findOne({ where: { id: topicId, user: userId } });
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const { completionPercentage, studyHours, flashcardsMastered, quizScores } = req.body;

    // Find or create a Progress record for this topic
    const subjectId = topic.subject;
    const [progress, created] = await Progress.findOrCreate({
      where: { user: userId, topic: topicId },
      defaults: {
        user: userId,
        subject: subjectId,
        topic: topicId,
        completionPercentage: completionPercentage ?? 0,
        studyHours: studyHours ?? 0,
        flashcardsMastered: flashcardsMastered ?? 0,
        quizScores: quizScores ?? [],
      },
    });

    if (!created) {
      if (completionPercentage !== undefined) progress.completionPercentage = completionPercentage;
      if (studyHours !== undefined) progress.studyHours = studyHours;
      if (flashcardsMastered !== undefined) progress.flashcardsMastered = flashcardsMastered;
      if (quizScores !== undefined) progress.quizScores = quizScores;
      await progress.save();
    }

    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity feed
// @route   GET /api/progress/activity
// @access  Private
exports.getActivityFeed = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const activities = await ActivityLog.findAll({
      where: { user: userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
    });

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// ── Helper: build export rows from user's progress data ──
async function buildExportRows(userId) {
  const subjects = await Subject.findAll({
    where: { user: userId },
    include: [{ model: Exam, as: 'examRef', attributes: ['name'] }],
    raw: true,
    nest: true,
  });

  const topics = await Topic.findAll({
    where: { user: userId },
    raw: true,
  });

  const progressRecords = await Progress.findAll({
    where: { user: userId },
    raw: true,
  });

  const quizAttempts = await QuizAttempt.findAll({
    where: { user: userId },
    attributes: ['score', 'totalQuestions', 'createdAt'],
    order: [['createdAt', 'DESC']],
    raw: true,
  });

  // Build a lookup: topicId -> progress
  const progressByTopic = {};
  const progressBySubject = {};
  for (const p of progressRecords) {
    if (p.topic) {
      progressByTopic[p.topic] = p;
    } else {
      progressBySubject[p.subject] = p;
    }
  }

  // Build a lookup: subjectId -> subject
  const subjectMap = {};
  for (const s of subjects) {
    subjectMap[s.id] = s;
  }

  const rows = [];

  for (const topic of topics) {
    const subject = subjectMap[topic.subject];
    const prog = progressByTopic[topic.id] || progressBySubject[topic.subject] || {};
    rows.push({
      examName: subject?.examRef?.name || 'N/A',
      subjectName: subject?.name || 'N/A',
      topicName: topic.name,
      topicStatus: topic.status || 'Medium',
      completionPercentage: prog.completionPercentage ?? 0,
      studyHours: prog.studyHours ?? 0,
      flashcardsMastered: prog.flashcardsMastered ?? 0,
    });
  }

  // Include subjects without topics
  for (const subject of subjects) {
    const hasTopics = topics.some((t) => t.subject === subject.id);
    if (!hasTopics) {
      const prog = progressBySubject[subject.id] || {};
      rows.push({
        examName: subject.examRef?.name || 'N/A',
        subjectName: subject.name,
        topicName: '(No topics)',
        topicStatus: 'N/A',
        completionPercentage: prog.completionPercentage ?? 0,
        studyHours: prog.studyHours ?? 0,
        flashcardsMastered: prog.flashcardsMastered ?? 0,
      });
    }
  }

  return { rows, quizAttempts };
}

// @desc    Export progress report as CSV
// @route   GET /api/progress/export/csv
// @access  Private
exports.exportCSV = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows, quizAttempts } = await buildExportRows(userId);

    const headers = [
      'Exam',
      'Subject',
      'Topic',
      'Status',
      'Completion %',
      'Study Hours',
      'Flashcards Mastered',
    ];

    const escapeCSV = (val) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    let csv = headers.join(',') + '\n';
    for (const row of rows) {
      csv += [
        escapeCSV(row.examName),
        escapeCSV(row.subjectName),
        escapeCSV(row.topicName),
        escapeCSV(row.topicStatus),
        row.completionPercentage,
        row.studyHours,
        row.flashcardsMastered,
      ].join(',') + '\n';
    }

    // Append quiz attempts summary
    csv += '\n';
    csv += 'Quiz Attempts Summary\n';
    csv += 'Score,Total Questions,Percentage,Date\n';
    for (const attempt of quizAttempts.slice(0, 50)) {
      const pct = attempt.totalQuestions > 0
        ? Math.round((attempt.score / attempt.totalQuestions) * 100)
        : 0;
      csv += [
        attempt.score,
        attempt.totalQuestions,
        `${pct}%`,
        escapeCSV(new Date(attempt.createdAt).toLocaleDateString()),
      ].join(',') + '\n';
    }

    const filename = `progress_report_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Export progress report data as JSON (for frontend PDF generation)
// @route   GET /api/progress/export/pdf-data
// @access  Private
exports.exportPDFData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows, quizAttempts } = await buildExportRows(userId);

    const totalStudyHours = req.user.studyHours || 0;
    const streak = req.user.streakCount || 0;

    const totalTopics = await Topic.count({ where: { user: userId } });
    const [completionResult] = await Progress.findAll({
      attributes: [[fn('SUM', col('completionPercentage')), 'totalCompletion']],
      where: { user: userId },
      raw: true,
    });
    const syllabusProgress = totalTopics > 0
      ? Math.round((parseFloat(completionResult?.totalCompletion) || 0) / totalTopics)
      : 0;

    res.status(200).json({
      rows,
      quizAttempts,
      totalStudyHours,
      streak,
      totalTopics,
      syllabusProgress,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export progress report as PDF certificate/report card using pdfkit
// @route   GET /api/progress/export/pdf
// @access  Private
exports.exportPDF = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rows, quizAttempts } = await buildExportRows(userId);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const filename = `progress_report_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Title / Header
    doc.fillColor('#1a365d').fontSize(22).text('OpenPrep AI - Student Progress Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#4a5568').fontSize(11).text(`Student Name: ${req.user.name || 'Scholar'}`, { align: 'center' });
    doc.text(`Generated On: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1.2);

    // Summary Section Box
    doc.fillColor('#2b6cb0').fontSize(14).text('Academic Summary', { underline: true });
    doc.moveDown(0.4);
    doc.fillColor('#2d3748').fontSize(10);
    doc.text(`• Total Study Hours Logged: ${(req.user.studyHours || 0).toFixed(1)} hours`);
    doc.text(`• Study Streak: ${req.user.streakCount || 0} Days`);
    doc.text(`• Total Topics Tracked: ${rows.length}`);
    doc.text(`• Total Quiz Attempts: ${quizAttempts.length}`);
    doc.moveDown(1.2);

    // Topic & Subject Breakdown Table Header
    doc.fillColor('#2b6cb0').fontSize(14).text('Topic & Subject Mastery Breakdown', { underline: true });
    doc.moveDown(0.6);

    // Table Header
    doc.fillColor('#1a202c').fontSize(9).font('Helvetica-Bold');
    const startY = doc.y;
    doc.text('Subject', 50, startY, { width: 120 });
    doc.text('Topic', 170, startY, { width: 150 });
    doc.text('Status', 320, startY, { width: 70 });
    doc.text('Completion', 390, startY, { width: 80 });
    doc.text('Hours', 470, startY, { width: 60 });
    doc.moveDown(0.4);

    doc.font('Helvetica').fontSize(9).fillColor('#4a5568');
    if (rows.length === 0) {
      doc.text('No subject or topic progress data recorded yet.');
    } else {
      for (const row of rows.slice(0, 35)) {
        if (doc.y > 720) {
          doc.addPage();
        }
        const currentY = doc.y;
        doc.text(row.subjectName.substring(0, 22), 50, currentY, { width: 120 });
        doc.text(row.topicName.substring(0, 28), 170, currentY, { width: 150 });
        doc.text(row.topicStatus, 320, currentY, { width: 70 });
        doc.text(`${row.completionPercentage}%`, 390, currentY, { width: 80 });
        doc.text(`${row.studyHours}h`, 470, currentY, { width: 60 });
        doc.moveDown(0.3);
      }
    }

    doc.moveDown(1.5);
    doc.fillColor('#718096').fontSize(8).text('Generated by OpenPrep AI Learning Platform', { align: 'center' });

doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Log a Pomodoro focus session (active time, pauses, interruptions)
// @route   POST /api/progress/focus-session
// @access  Private
exports.logFocusSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { activeSeconds, pausedSeconds = 0, interruptions = 0, subjectId } = req.body;

    const totalSeconds = activeSeconds + pausedSeconds;
    const focusScore = totalSeconds > 0 ? Math.round((activeSeconds / totalSeconds) * 100) : 0;

    const session = await FocusSession.create({
      user: userId,
      subject: subjectId || null,
      activeSeconds,
      pausedSeconds,
      interruptions,
      focusScore,
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly focus efficiency percentage for the dashboard chart
// @route   GET /api/progress/focus-session/weekly
// @access  Private
exports.getWeeklyFocusEfficiency = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const sessions = await FocusSession.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('AVG', col('focusScore')), 'avgFocusScore'],
      ],
      where: { user: userId, createdAt: { [Op.gte]: sevenDaysAgo } },
      group: [fn('DATE', col('createdAt'))],
      raw: true,
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyFocusData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      const record = sessions.find((s) => s.date === dateStr);
      weeklyFocusData.push({
        day: dayNames[date.getDay()],
        focusEfficiency: record ? Math.round(parseFloat(record.avgFocusScore)) || 0 : 0,
      });
    }

    res.status(200).json({ success: true, data: weeklyFocusData });
  } catch (error) {
    next(error);
  }
};

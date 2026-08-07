const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Flashcard = require('../models/Flashcard');
const Note = require('../models/Note');
const Progress = require('../models/Progress');
const StudyPlan = require('../models/StudyPlan');
const PYQ = require('../models/PYQ');
const ActivityLog = require('../models/ActivityLog');
const {
  validateSyllabusPayload,
  readFile,
  cleanupUploadedFile,
  readJSONSync,
  extractPdfText,
  parseSyllabusPdfWithAI,
  normalizeSyllabusPayload,
} = require('../services/syllabusParserService');

// ==========================================
// EXAMS CONTROLLER
// ==========================================

exports.createExam = async (req, res, next) => {
  try {
    const { name, description, date, isBundle, targetExamType } = req.body;
    const exam = await Exam.create({
      name,
      description,
      date,
      isBundle: isBundle || false,
      targetExamType: targetExamType || 'Custom',
      user: req.user.id,
    });
    res.status(201).json({ success: true, data: exam });
  } catch (error) {
    next(error);
  }
};

exports.getExams = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count: total, rows: exams } = await Exam.findAndCountAll({
      where: { user: req.user.id },
      order: [['date', 'ASC']],
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      count: exams.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteExam = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const exam = await Exam.findOne({
      where: { id: req.params.id, user: req.user.id },
      transaction: t,
    });

    if (!exam) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    // Collect all subject IDs for this exam
    const subjects = await Subject.findAll({ where: { exam: exam.id }, transaction: t });
    const subjectIds = subjects.map((sub) => sub.id);

    let topicIds = [];
    if (subjectIds.length > 0) {
      // Collect all topics for these subjects
      const topics = await Topic.findAll({
        where: { subject: { [Op.in]: subjectIds } },
        transaction: t,
      });
      topicIds = topics.map((top) => top.id);
    }

    // Build OR conditions only when IDs exist to avoid invalid Op.in: [] queries
    const quizOrConditions = [];
    if (subjectIds.length > 0) quizOrConditions.push({ subject: { [Op.in]: subjectIds } });
    if (topicIds.length > 0) quizOrConditions.push({ topic: { [Op.in]: topicIds } });

    if (quizOrConditions.length > 0) {
      // 1. Delete QuizAttempts for quizzes under these subjects and topics
      const quizzes = await Quiz.findAll({
        where: { [Op.or]: quizOrConditions },
        transaction: t,
      });
      const quizIds = quizzes.map((q) => q.id);

      if (quizIds.length > 0) {
        await QuizAttempt.destroy({ where: { quiz: { [Op.in]: quizIds } }, transaction: t });
      }

      // 2. Delete quizzes
      await Quiz.destroy({ where: { [Op.or]: quizOrConditions }, transaction: t });
    }

    await StudyPlan.destroy({ where: { exam: exam.id }, transaction: t });

    if (subjectIds.length > 0) {
      await PYQ.destroy({
        where: { [Op.or]: [{ exam: exam.id }, { subject: { [Op.in]: subjectIds } }] },
        transaction: t,
        individualHooks: true,
      });
      await Note.destroy({ where: { subject: { [Op.in]: subjectIds } }, transaction: t });
      await Flashcard.destroy({ where: { subject: { [Op.in]: subjectIds } }, transaction: t });
    } else {
      await PYQ.destroy({ where: { exam: exam.id }, transaction: t, individualHooks: true });
    }

    const progressOrConditions = [];
    if (subjectIds.length > 0) progressOrConditions.push({ subject: { [Op.in]: subjectIds } });
    if (topicIds.length > 0) progressOrConditions.push({ topic: { [Op.in]: topicIds } });

    if (progressOrConditions.length > 0) {
      await Progress.destroy({ where: { [Op.or]: progressOrConditions }, transaction: t });
    }

    // 3. Ensure child Topic records are deleted BEFORE parent Subject records
    if (subjectIds.length > 0) {
      await Topic.destroy({ where: { subject: { [Op.in]: subjectIds } }, transaction: t });
    }
    await Subject.destroy({ where: { exam: exam.id }, transaction: t });

    // 4. Delete the exam itself
    await exam.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// SUBJECTS CONTROLLER
// ==========================================

exports.createSubject = async (req, res, next) => {
  try {
    const { name, description, examId, weightage } = req.body;
    const examExists = await Exam.findOne({
      where: { id: examId, user: req.user.id },
    });
    if (!examExists) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    const subject = await Subject.create({
      name,
      description,
      exam: examId,
      weightage: weightage !== undefined ? parseFloat(weightage) : 0,
      user: req.user.id,
    });
    res.status(201).json({ success: true, data: subject });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// COMPOSITE EXAM BUNDLES CONTROLLER
// ==========================================

exports.createCompositeBundle = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, date, targetExamType, subjects } = req.body;

    if (!name || !date) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'Please provide exam name and date' });
    }

    // Create the master composite Exam
    const exam = await Exam.create(
      {
        name,
        description,
        date,
        isBundle: true,
        targetExamType: targetExamType || 'Custom',
        user: req.user.id,
      },
      { transaction: t }
    );

    // Create subjects with percentage weightages if provided
    const createdSubjects = [];
    if (Array.isArray(subjects) && subjects.length > 0) {
      for (const sub of subjects) {
        const newSub = await Subject.create(
          {
            name: sub.name,
            description: sub.description || '',
            weightage:
              sub.weightage !== undefined
                ? parseFloat(sub.weightage)
                : Math.round(100 / subjects.length),
            exam: exam.id,
            user: req.user.id,
          },
          { transaction: t }
        );
        createdSubjects.push(newSub);
      }
    }

    await t.commit();

    res.status(201).json({
      success: true,
      data: {
        exam,
        subjects: createdSubjects,
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.updateSubjectWeightages = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { examId } = req.params;
    const { subjectWeightages } = req.body; // Array of { id: subjectId, weightage: number }

    const exam = await Exam.findOne({ where: { id: examId, user: req.user.id }, transaction: t });
    if (!exam) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    if (!Array.isArray(subjectWeightages)) {
      await t.rollback();
      return res.status(400).json({ success: false, error: 'subjectWeightages must be an array' });
    }

    const updatedSubjects = [];
    for (const item of subjectWeightages) {
      const subject = await Subject.findOne({
        where: { id: item.id, exam: examId, user: req.user.id },
        transaction: t,
      });

      if (subject) {
        subject.weightage = parseFloat(item.weightage) || 0;
        await subject.save({ transaction: t });
        updatedSubjects.push(subject);
      }
    }

    await t.commit();

    res.status(200).json({
      success: true,
      data: updatedSubjects,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const filter = { user: req.user.id };
    if (examId) filter.exam = examId;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const { count: total, rows: subjects } = await Subject.findAndCountAll({
      where: filter,
      limit,
      offset,
    });

    res.status(200).json({
      success: true,
      count: subjects.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubject = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const subject = await Subject.findOne({
      where: { id: req.params.id, user: req.user.id },
      transaction: t,
    });

    if (!subject) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    // 1. Delete QuizAttempts for quizzes under this subject
    const quizzes = await Quiz.findAll({ where: { subject: subject.id }, transaction: t });
    const quizIds = quizzes.map((q) => q.id);
    if (quizIds.length > 0) {
      await QuizAttempt.destroy({ where: { quiz: { [Op.in]: quizIds } }, transaction: t });
    }

    // 2. Delete child records that reference this subject
    await Progress.destroy({ where: { subject: subject.id }, transaction: t });
    await Flashcard.destroy({ where: { subject: subject.id }, transaction: t });
    await Note.destroy({ where: { subject: subject.id }, transaction: t });

    // 3. Delete quizzes
    await Quiz.destroy({ where: { subject: subject.id }, transaction: t });

    // 4. Delete topics
    await Topic.destroy({ where: { subject: subject.id }, transaction: t });

    // 5. Delete PYQs for this subject
    await PYQ.destroy({ where: { subject: subject.id }, transaction: t, individualHooks: true });

    // 6. Delete the subject itself
    await subject.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// TOPICS CONTROLLER
// ==========================================

exports.createTopic = async (req, res, next) => {
  try {
    const { name, description, subjectId, status, weightage } = req.body;
    const subjectExists = await Subject.findOne({
      where: { id: subjectId, user: req.user.id },
    });
    if (!subjectExists) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    const topic = await Topic.create({
      name,
      description,
      subject: subjectId,
      status: status || 'Medium',
      weightage: weightage || 0,
      user: req.user.id,
    });
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

exports.getTopics = async (req, res, next) => {
  try {
    const { subjectId } = req.query;
    const filter = { user: req.user.id };
    if (subjectId) filter.subject = subjectId;

    const topics = await Topic.findAll({
      where: filter,
      order: [['weightage', 'DESC']],
    });
    res.status(200).json({ success: true, count: topics.length, data: topics });
  } catch (error) {
    next(error);
  }
};

exports.updateTopic = async (req, res, next) => {
  try {
    const { status, weightage, name, description } = req.body;
    let topic = await Topic.findOne({
      where: { id: req.params.id, user: req.user.id },
    });

    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    if (status) topic.status = status;
    if (weightage !== undefined) topic.weightage = weightage;
    if (name) topic.name = name;
    if (description) topic.description = description;

    await topic.save();
    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    next(error);
  }
};

exports.deleteTopic = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const topic = await Topic.findOne({
      where: { id: req.params.id, user: req.user.id },
      transaction: t,
    });

    if (!topic) {
      await t.rollback();
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    // 1. Delete child records that reference this topic
    await Progress.destroy({ where: { topic: topic.id }, transaction: t });
    await Flashcard.destroy({ where: { topic: topic.id }, transaction: t });
    await Note.destroy({ where: { topic: topic.id }, transaction: t });

    // 2. Nullify topic reference on quizzes (quiz itself is preserved)
    await Quiz.update({ topic: null }, { where: { topic: topic.id }, transaction: t });

    // 3. Delete the topic itself
    await topic.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ==========================================
// SYLLABUS FILE IMPORTER
// ==========================================

exports.importSyllabus = async (req, res, next) => {
  let cleanup = true;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please attach a syllabus file (.pdf or .json).',
      });
    }

    const originalName = (req.file.originalname || '').toLowerCase();
    const isJSON = originalName.endsWith('.json') || req.file.mimetype === 'application/json';
    const isPDF = originalName.endsWith('.pdf') || req.file.mimetype === 'application/pdf';

    if (!isJSON && !isPDF) {
      cleanupUploadedFile(req.file);
      cleanup = false;
      return res.status(400).json({
        success: false,
        error:
          'Unsupported file type. Please upload either a .pdf syllabus or a .json file matching the bulk import schema.',
      });
    }

    const buffer = await readFile(req.file);
    let parsedPayload;
    let importSource = 'upload';
    let extractedText = null;

    if (isJSON) {
      parsedPayload = readJSONSync(buffer, req.file.originalname);
      importSource = 'json';
    } else {
      extractedText = await extractPdfText(buffer);
      parsedPayload = await parseSyllabusPdfWithAI(extractedText, true);
      importSource = parsedPayload?._mock ? 'pdf_mock' : 'pdf_ai';
    }

    const { valid, errors } = validateSyllabusPayload(parsedPayload);
    if (!valid) {
      cleanupUploadedFile(req.file);
      cleanup = false;
      return res.status(400).json({
        success: false,
        error: 'Syllabus validation failed',
        details: errors,
      });
    }

    parsedPayload.importSource = importSource;
    const normalized = normalizeSyllabusPayload(parsedPayload);

    // Run the whole creation inside a transaction so partial failures roll back
    const t = await sequelize.transaction();
    try {
      const exam = await Exam.create(
        {
          name: normalized.examName,
          description: normalized.description,
          date: normalized.examDate,
          isBundle: true,
          targetExamType: 'University Syllabus Import',
          user: req.user.id,
        },
        { transaction: t }
      );

      const createdSubjects = [];
      let totalTopics = 0;
      const subjectWeightage =
        normalized.subjects.length > 0
          ? Math.max(1, Math.round(100 / normalized.subjects.length))
          : 0;

      for (const sub of normalized.subjects) {
        const subWeightage = Number(sub.weightage) || subjectWeightage;
        const subject = await Subject.create(
          {
            name: sub.name,
            description: sub.description,
            exam: exam.id,
            weightage: subWeightage,
            user: req.user.id,
          },
          { transaction: t }
        );

        const createdTopics = [];
        const topicWeightage =
          sub.topics.length > 0 ? Math.max(1, Math.round(100 / sub.topics.length)) : 0;
        for (const topicName of sub.topics) {
          const topic = await Topic.create(
            {
              name: topicName,
              description: '',
              subject: subject.id,
              status: 'Medium',
              weightage: topicWeightage,
              user: req.user.id,
            },
            { transaction: t }
          );
          createdTopics.push(topic);
          totalTopics += 1;
        }

        createdSubjects.push({
          id: subject.id,
          name: subject.name,
          description: subject.description,
          weightage: subject.weightage,
          topicsCount: createdTopics.length,
          topics: createdTopics.map((tp) => ({ id: tp.id, name: tp.name })),
        });
      }

      await ActivityLog.create(
        {
          user: req.user.id,
          activityType: 'syllabus_import',
          description: `Imported syllabus ${normalized.examName} (${importSource}) — ${createdSubjects.length} subjects, ${totalTopics} topics`,
        },
        { transaction: t }
      );

      await t.commit();

      if (cleanup) cleanupUploadedFile(req.file);

      const prefill = {
        examId: exam.id,
        examName: exam.name,
        examDate: exam.date ? new Date(exam.date).toISOString().split('T')[0] : null,
        subjects: createdSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          topics: s.topics.map((tp) => tp.name),
        })),
      };

      return res.status(201).json({
        success: true,
        message: `Syllabus imported successfully: ${createdSubjects.length} subjects, ${totalTopics} topics.`,
        importSource,
        summary: {
          subjects: createdSubjects.length,
          topics: totalTopics,
          exams: 1,
        },
        prefill,
        data: {
          exam: {
            id: exam.id,
            name: exam.name,
            description: exam.description,
            date: exam.date,
            isBundle: exam.isBundle,
            targetExamType: exam.targetExamType,
          },
          subjects: createdSubjects,
        },
      });
    } catch (innerErr) {
      await t.rollback();
      if (cleanup) cleanupUploadedFile(req.file);
      throw innerErr;
    }
  } catch (error) {
    if (cleanup && req?.file) cleanupUploadedFile(req.file);
    next(error);
  }
};

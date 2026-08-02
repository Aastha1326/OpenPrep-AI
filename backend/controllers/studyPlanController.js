const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const StudyPlan = require('../models/StudyPlan');
const Exam = require('../models/Exam');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

// @desc    Generate AI Study Plan
// @route   POST /api/study-plans/generate-ai
// @access  Private
exports.generateAIPlan = async (req, res, next) => {
  try {
    const { examId, startDate, endDate, studyHoursPerDay } = req.body;

    const exam = await Exam.findOne({ where: { id: examId, user: req.user.id } });
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    // Retrieve subjects and topics to construct syllabus payload
    const subjects = await Subject.findAll({ where: { exam: examId, user: req.user.id } });
    const syllabus = [];

    for (const sub of subjects) {
      const topics = await Topic.findAll({ where: { subject: sub.id, user: req.user.id } });
      syllabus.push({
        subjectName: sub.name,
        topics: topics.map((t) => t.name),
      });
    }

    if (syllabus.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please add subjects and topics to your syllabus before generating a plan.',
      });
    }

    // Call Gemini API to structure plan
    const generatedGoals = await geminiService.generateStudyPlan(
      exam.name,
      syllabus,
      startDate,
      endDate,
      studyHoursPerDay || 3,
      req.query.refresh === 'true'
    );

    // Format goals for database insertion (resolve Topic UUIDs if names match)
    const formattedGoals = [];
    for (const day of generatedGoals) {
      const tasks = [];
      for (const t of day.tasks) {
        // Try finding matching Topic using case-insensitive PostgreSQL iLike matching
        let matchedTopic;
        try {
          matchedTopic = await Topic.findOne({
            where: {
              name: { [Op.iLike]: t.topicName.trim() },
              user: req.user.id,
            },
          });
        } catch (dbErr) {
          const userTopics = await Topic.findAll({ where: { user: req.user.id } });
          matchedTopic = userTopics.find((tp) => tp.name.trim().toLowerCase() === t.topicName.trim().toLowerCase());
        }

        tasks.push({
          _id: uuidv4(), // Assign a stable UUID virtual _id to mimic Mongoose subdocument id
          title: t.title,
          duration: t.duration || 60,
          completed: false,
          topic: matchedTopic ? matchedTopic.id : null,
        });
      }
      formattedGoals.push({
        date: new Date(day.date),
        tasks,
      });
    }

    // Archive previous active plans
    await StudyPlan.update(
      { status: 'archived' },
      { where: { user: req.user.id, exam: examId, status: 'active' } }
    );

    const studyPlan = await StudyPlan.create({
      exam: examId,
      user: req.user.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      dailyGoals: formattedGoals,
      status: 'active',
    });

    // Log Activity
    await ActivityLog.create({
      user: req.user.id,
      activityType: 'study_plan_create',
      description: `Generated AI Study Plan for exam: ${exam.name}`,
    });

    res.status(201).json({
      success: true,
      data: studyPlan,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Active Study Plan
// @route   GET /api/study-plans/active
// @access  Private
exports.getActivePlan = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const filter = { user: req.user.id, status: 'active' };
    if (examId) filter.exam = examId;

    const plan = await StudyPlan.findOne({
      where: filter,
      include: [{ model: Exam, as: 'examRef' }],
    });

    if (!plan) {
      return res.status(200).json({ success: true, data: null });
    }

    // Extract topic IDs referenced in dailyGoals
    const topicIds = new Set();
    plan.dailyGoals.forEach((goal) => {
      goal.tasks.forEach((task) => {
        if (task.topic) topicIds.add(task.topic);
      });
    });

    // Fetch only the referenced topics for the in-memory join
    const topics = await Topic.findAll({
      where: {
        id: { [Op.in]: Array.from(topicIds) },
        user: req.user.id,
      },
    });

    const topicMap = {};
    topics.forEach((t) => {
      topicMap[t.id] = t;
    });

    const resolvedGoals = plan.dailyGoals.map((goal) => ({
      ...goal,
      tasks: goal.tasks.map((task) => ({
        ...task,
        topic: task.topic ? topicMap[task.topic] || null : null,
      })),
    }));

    const planJson = plan.toJSON();
    planJson.exam = planJson.examRef; // populate parity
    planJson.dailyGoals = resolvedGoals;

    res.status(200).json({ success: true, data: planJson });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Task Completion Status
// @route   PUT /api/study-plans/:planId/tasks/:taskId
// @access  Private
exports.toggleTaskCompletion = async (req, res, next) => {
  try {
    const { planId, taskId } = req.params;
    const { completed, studyTimeMinutes } = req.body;

    const plan = await StudyPlan.findOne({ where: { id: planId, user: req.user.id } });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Study plan not found' });
    }

    // Find and update task inside JSONB dailyGoals
    let taskFound = false;
    let wasCompleted = false;
    const dailyGoals = JSON.parse(JSON.stringify(plan.dailyGoals));
    for (const goal of dailyGoals) {
      const task = goal.tasks.find((t) => t._id === taskId || t.id === taskId);
      if (task) {
        wasCompleted = task.completed; // Capture previous state BEFORE modifying
        task.completed = completed;
        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return res.status(404).json({ success: false, error: 'Task not found in plan' });
    }

    plan.dailyGoals = dailyGoals;
    await plan.save();

    // Adjust study hours based on task state transition
    //   false -> true : add hours (task was just completed)
    //   true  -> false: subtract hours (task was unmarked)
    //   same state    : no change (prevents double-counting)
    if (studyTimeMinutes) {
      const hours = studyTimeMinutes / 60;

      if (completed && !wasCompleted) {
        // Task transitioned from incomplete -> complete: add hours
        const user = await User.findByPk(req.user.id);
        if (user) {
          user.studyHours = Number((user.studyHours + hours).toFixed(2));
          await user.save();
        }
      } else if (!completed && wasCompleted) {
        // Task transitioned from complete -> incomplete: subtract hours
        const user = await User.findByPk(req.user.id);
        if (user) {
          user.studyHours = Number(Math.max(0, user.studyHours - hours).toFixed(2));
          await user.save();
        }
      }
      // If state unchanged (completed === wasCompleted), do nothing
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Study Plans
// @route   GET /api/study-plans/plans
// @access  Private
exports.getPlans = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page - 1) * limit;

    const { count: totalItems, rows: plans } = await StudyPlan.findAndCountAll({
      where: { user: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: Exam, as: 'examRef' }],
      offset,
      limit,
    });

    res.status(200).json({
      success: true,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      currentPage: page,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule Overdue Tasks
// @route   POST /api/study-plans/:id/reschedule
// @access  Private
exports.rescheduleOverdueTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { useAIRebalance } = req.body;

    const plan = await StudyPlan.findOne({ 
      where: { id, user: req.user.id },
      include: [{ model: Exam, as: 'examRef' }]
    });
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Study plan not found' });
    }

    const exam = plan.examRef;
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Associated exam not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(exam.date);
    const daysUntilExam = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));

    // Check if AI re-balance should be used (exam < 7 days away)
    const shouldUseAI = useAIRebalance || daysUntilExam < 7;

    if (shouldUseAI) {
      // Use AI to re-balance the entire plan
      const subjects = await Subject.findAll({ where: { exam: plan.exam, user: req.user.id } });
      const syllabus = [];

      for (const sub of subjects) {
        const topics = await Topic.findAll({ where: { subject: sub.id, user: req.user.id } });
        syllabus.push({
          subjectName: sub.name,
          topics: topics.map((t) => t.name),
        });
      }

      if (syllabus.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No subjects and topics found for AI re-balancing',
        });
      }

      // Generate new plan with AI
      const generatedGoals = await geminiService.generateStudyPlan(
        exam.name,
        syllabus,
        today.toISOString().split('T')[0],
        examDate.toISOString().split('T')[0],
        3, // Default 3 hours per day
        true // Force refresh
      );

      // Format goals for database
      const formattedGoals = [];
      for (const day of generatedGoals) {
        const tasks = [];
        for (const t of day.tasks) {
          let matchedTopic;
          try {
            matchedTopic = await Topic.findOne({
              where: {
                name: { [Op.iLike]: t.topicName.trim() },
                user: req.user.id,
              },
            });
          } catch (dbErr) {
            const userTopics = await Topic.findAll({ where: { user: req.user.id } });
            matchedTopic = userTopics.find((tp) => tp.name.trim().toLowerCase() === t.topicName.trim().toLowerCase());
          }

          tasks.push({
            _id: uuidv4(),
            title: t.title,
            duration: t.duration || 60,
            completed: false,
            topic: matchedTopic ? matchedTopic.id : null,
          });
        }
        formattedGoals.push({
          date: new Date(day.date),
          tasks,
        });
      }

      plan.dailyGoals = formattedGoals;
      await plan.save();

      await ActivityLog.create({
        user: req.user.id,
        activityType: 'study_plan_reschedule',
        description: `AI Re-balanced study plan for exam: ${exam.name}`,
      });

      return res.status(200).json({
        success: true,
        data: plan,
        message: 'Study plan re-balanced using AI',
      });
    }

    // Manual rescheduling logic for overdue tasks
    const dailyGoals = JSON.parse(JSON.stringify(plan.dailyGoals));
    const overdueTasks = [];
    const futureGoals = [];

    // Separate overdue incomplete tasks from future goals
    for (const goal of dailyGoals) {
      const goalDate = new Date(goal.date);
      goalDate.setHours(0, 0, 0, 0);

      if (goalDate < today) {
        // This is a past date - collect incomplete tasks
        for (const task of goal.tasks) {
          if (!task.completed) {
            overdueTasks.push(task);
          }
        }
      } else {
        // This is a future date - keep as is
        futureGoals.push(goal);
      }
    }

    if (overdueTasks.length === 0) {
      return res.status(200).json({
        success: true,
        data: plan,
        message: 'No overdue tasks to reschedule',
      });
    }

    // Calculate daily capacity (assuming 3 hours = 180 minutes per day)
    const dailyCapacityMinutes = 180;
    const rescheduledGoals = [];

    // Distribute overdue tasks across future days with capacity
    let taskIndex = 0;
    for (const goal of futureGoals) {
      const currentTotalDuration = goal.tasks.reduce((sum, t) => sum + (t.duration || 60), 0);
      const remainingCapacity = dailyCapacityMinutes - currentTotalDuration;

      if (remainingCapacity > 0 && taskIndex < overdueTasks.length) {
        const tasksToAdd = [];
        let usedCapacity = 0;

        while (taskIndex < overdueTasks.length && usedCapacity < remainingCapacity) {
          const task = overdueTasks[taskIndex];
          const taskDuration = task.duration || 60;

          if (usedCapacity + taskDuration <= remainingCapacity) {
            tasksToAdd.push({ ...task, _id: uuidv4() });
            usedCapacity += taskDuration;
            taskIndex++;
          } else {
            break;
          }
        }

        if (tasksToAdd.length > 0) {
          goal.tasks = [...goal.tasks, ...tasksToAdd];
        }
      }

      rescheduledGoals.push(goal);
    }

    // If there are still tasks left, add them to the last available day
    if (taskIndex < overdueTasks.length) {
      const lastGoal = rescheduledGoals[rescheduledGoals.length - 1];
      if (lastGoal) {
        const remainingTasks = overdueTasks.slice(taskIndex);
        lastGoal.tasks = [
          ...lastGoal.tasks,
          ...remainingTasks.map(t => ({ ...t, _id: uuidv4() }))
        ];
      }
    }

    // Rebuild dailyGoals with today's date onwards
    const todayGoals = dailyGoals.filter(g => {
      const goalDate = new Date(g.date);
      goalDate.setHours(0, 0, 0, 0);
      return goalDate >= today;
    });

    plan.dailyGoals = [...todayGoals, ...rescheduledGoals];
    await plan.save();

    await ActivityLog.create({
      user: req.user.id,
      activityType: 'study_plan_reschedule',
      description: `Rescheduled ${overdueTasks.length} overdue tasks for exam: ${exam.name}`,
    });

    res.status(200).json({
      success: true,
      data: plan,
      message: `Successfully rescheduled ${overdueTasks.length} overdue tasks`,
    });
  } catch (error) {
    next(error);
  }
};

const classroomService = require('../services/classroomAssignmentService');

// @desc    Create a new multi-tenant classroom
// @route   POST /api/classrooms
// @access  Private (EDUCATOR, INSTITUTION_ADMIN, SUPER_ADMIN)
exports.createClassroom = async (req, res, next) => {
  try {
    const { name, subject, institutionName } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Classroom name is required.' });
    }

    const classroom = classroomService.createClassroom(
      req.user.id,
      name,
      subject || 'General Study',
      institutionName || 'OpenPrep Academy'
    );

    res.status(201).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student enrolls into classroom via 6-character join code
// @route   POST /api/classrooms/join
// @access  Private
exports.joinClassroom = async (req, res, next) => {
  try {
    const { joinCode } = req.body;
    if (!joinCode) {
      return res.status(400).json({ success: false, error: 'Classroom joinCode is required.' });
    }

    const result = classroomService.joinClassroom(
      req.user.id,
      req.user.email || 'student@openprep.ai',
      req.user.name || 'Student',
      joinCode
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('Invalid classroom')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Bulk roster CSV file/string import for educators
// @route   POST /api/classrooms/:id/roster/import-csv
// @access  Private (EDUCATOR, INSTITUTION_ADMIN, SUPER_ADMIN)
exports.importRosterCsv = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({ success: false, error: 'csvContent string is required.' });
    }

    const result = classroomService.importRosterFromCsv(id, csvContent);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Dispatch assignment / quiz to classroom cohort
// @route   POST /api/classrooms/:id/assignments
// @access  Private (EDUCATOR, INSTITUTION_ADMIN, SUPER_ADMIN)
exports.dispatchAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, type, targetId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Assignment title is required.' });
    }

    const assignment = classroomService.dispatchAssignment(id, title, type, targetId, dueDate);

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get aggregated class-wide topic mastery heatmap matrix
// @route   GET /api/classrooms/:id/mastery-heatmap
// @access  Private
exports.getClassroomMasteryHeatmap = async (req, res, next) => {
  try {
    const { id } = req.params;
    const heatmap = classroomService.getClassroomMasteryHeatmap(id);

    res.status(200).json({
      success: true,
      data: heatmap,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};

// @desc    Get classroom details by ID
// @route   GET /api/classrooms/:id
// @access  Private
exports.getClassroomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classroom = classroomService.getClassroomById(id);

    if (!classroom) {
      return res.status(404).json({ success: false, error: 'Classroom not found.' });
    }

    res.status(200).json({
      success: true,
      data: classroom,
    });
  } catch (error) {
    next(error);
  }
};

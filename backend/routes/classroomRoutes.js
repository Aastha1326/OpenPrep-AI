const express = require('express');
const {
  createClassroom,
  joinClassroom,
  importRosterCsv,
  dispatchAssignment,
  getClassroomMasteryHeatmap,
  getClassroomById,
} = require('../controllers/classroomController');
const { protect } = require('../middleware/auth');
const { authorizeRoles, ROLES } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.post(
  '/',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.EDUCATOR),
  createClassroom
);

router.post('/join', protect, joinClassroom);

router.get('/:id', protect, getClassroomById);

router.post(
  '/:id/roster/import-csv',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.EDUCATOR, ROLES.TEACHING_ASSISTANT),
  importRosterCsv
);

router.post(
  '/:id/assignments',
  protect,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.INSTITUTION_ADMIN, ROLES.EDUCATOR, ROLES.TEACHING_ASSISTANT),
  dispatchAssignment
);

router.get('/:id/mastery-heatmap', protect, getClassroomMasteryHeatmap);

module.exports = router;

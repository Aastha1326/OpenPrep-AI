const {
  createClassroom,
  joinClassroom,
  importRosterFromCsv,
  dispatchAssignment,
  getClassroomMasteryHeatmap,
} = require('../../services/classroomAssignmentService');
const { authorizeRoles, ROLES } = require('../../middleware/rbacMiddleware');

describe('Granular RBAC & Multi-Tenant Classroom Management Unit Tests', () => {
  describe('RBAC Middleware', () => {
    it('allows users with authorized roles', () => {
      const middleware = authorizeRoles(ROLES.EDUCATOR, ROLES.SUPER_ADMIN);
      const req = { user: { role: 'EDUCATOR' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('denies access with 403 Forbidden for unauthorized roles', () => {
      const middleware = authorizeRoles(ROLES.EDUCATOR, ROLES.SUPER_ADMIN);
      const req = { user: { role: 'STUDENT' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Classroom Operations Service', () => {
    it('creates classroom with a 6-character join code', () => {
      const classroom = createClassroom('edu-1', 'Physics 101', 'Physics', 'OpenPrep Tech');
      expect(classroom).toHaveProperty('id');
      expect(classroom).toHaveProperty('joinCode');
      expect(classroom.joinCode).toHaveLength(6);
    });

    it('enrolls student via valid join code', () => {
      const classroom = createClassroom('edu-2', 'Chemistry 201', 'Chemistry');
      const result = joinClassroom('stu-1', 'student1@openprep.ai', 'Student 1', classroom.joinCode);

      expect(result.alreadyEnrolled).toBe(false);
      expect(result.classroom.roster).toHaveLength(1);
      expect(result.classroom.roster[0].email).toBe('student1@openprep.ai');
    });

    it('imports bulk student roster from CSV', () => {
      const classroom = createClassroom('edu-3', 'Calculus 301', 'Math');
      const csv = `email,name\nalice@openprep.ai,Alice\nbob@openprep.ai,Bob`;

      const result = importRosterFromCsv(classroom.id, csv);
      expect(result.importedCount).toBe(2);
      expect(result.totalRosterSize).toBe(2);
    });

    it('dispatches assignment and generates topic mastery heatmap', () => {
      const classroom = createClassroom('edu-4', 'Biology 101', 'Biology');
      joinClassroom('stu-2', 'stu2@openprep.ai', 'Student 2', classroom.joinCode);

      const assignment = dispatchAssignment(classroom.id, 'Unit 1 Quiz', 'QUIZ', 'q-101');
      expect(assignment).toHaveProperty('id');
      expect(assignment.title).toBe('Unit 1 Quiz');

      const heatmap = getClassroomMasteryHeatmap(classroom.id);
      expect(heatmap).toHaveProperty('heatmap');
      expect(heatmap.heatmap.length).toBeGreaterThan(0);
    });
  });
});

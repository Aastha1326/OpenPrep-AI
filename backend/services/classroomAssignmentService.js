const { v4: uuidv4 } = require('uuid');

/**
 * Multi-Tenant Classroom Management & Assignment Dispatcher Service
 */

// In-memory classrooms data store
const classroomsStore = new Map();
const joinCodeMap = new Map();

// Helper 6-character alphanumeric join code generator
const generateJoinCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Create a new multi-tenant classroom cohort
 */
const createClassroom = (educatorId, name, subject = 'General Study', institutionName = 'OpenPrep Academy') => {
  const id = uuidv4();
  let joinCode = generateJoinCode();
  while (joinCodeMap.has(joinCode)) {
    joinCode = generateJoinCode();
  }

  const classroom = {
    id,
    name,
    subject,
    institutionName,
    educatorId,
    joinCode,
    qrInviteUrl: `https://openprep.ai/classrooms/join?code=${joinCode}`,
    roster: [],
    assignments: [],
    createdAt: new Date(),
  };

  classroomsStore.set(id, classroom);
  joinCodeMap.set(joinCode, id);
  return classroom;
};

/**
 * Student enrolls in classroom via 6-character join code
 */
const joinClassroom = (studentId, studentEmail, studentName, joinCode) => {
  const cleanCode = (joinCode || '').toUpperCase().trim();
  const classroomId = joinCodeMap.get(cleanCode);

  if (!classroomId || !classroomsStore.has(classroomId)) {
    throw new Error('Invalid classroom join code.');
  }

  const classroom = classroomsStore.get(classroomId);

  // Check if student already enrolled
  const existing = classroom.roster.find((s) => s.studentId === studentId || s.email === studentEmail);
  if (existing) {
    return { alreadyEnrolled: true, classroom };
  }

  const newStudent = {
    studentId,
    email: studentEmail,
    name: studentName || 'Student',
    enrolledAt: new Date(),
    progressPct: 0,
  };

  classroom.roster.push(newStudent);
  return { alreadyEnrolled: false, classroom };
};

/**
 * Bulk import roster from CSV string (email, name)
 */
const importRosterFromCsv = (classroomId, csvContent) => {
  const classroom = classroomsStore.get(classroomId);
  if (!classroom) {
    throw new Error('Classroom not found.');
  }

  const lines = (csvContent || '').split('\n');
  let importedCount = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('email')) return; // Skip header/empty

    const [email, name] = trimmed.split(',').map((s) => s.trim());
    if (email && email.includes('@')) {
      const exists = classroom.roster.some((s) => s.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        classroom.roster.push({
          studentId: `imported-${uuidv4().substring(0, 8)}`,
          email,
          name: name || email.split('@')[0],
          enrolledAt: new Date(),
          progressPct: 0,
        });
        importedCount++;
      }
    }
  });

  return { importedCount, totalRosterSize: classroom.roster.length };
};

/**
 * Dispatch study plan / quiz assignment to classroom
 */
const dispatchAssignment = (classroomId, title, type, targetId, dueDate) => {
  const classroom = classroomsStore.get(classroomId);
  if (!classroom) {
    throw new Error('Classroom not found.');
  }

  const assignment = {
    id: `assign-${uuidv4().substring(0, 8)}`,
    title,
    type: type || 'QUIZ', // QUIZ, STUDY_PLAN, PYQ_SET
    targetId,
    dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    dispatchedAt: new Date(),
    completedCount: 0,
    totalEnrolled: classroom.roster.length,
  };

  classroom.assignments.push(assignment);
  return assignment;
};

/**
 * Get aggregated class-wide topic mastery heatmap matrix
 */
const getClassroomMasteryHeatmap = (classroomId) => {
  const classroom = classroomsStore.get(classroomId);
  if (!classroom) {
    throw new Error('Classroom not found.');
  }

  const topics = [
    'Modern History 1857-1947',
    'Thermodynamics & Heat',
    'Organic Chemistry Mechanisms',
    'Calculus & Integration',
    'Electrostatics & Magnetism',
  ];

  const heatmap = topics.map((t, idx) => {
    // Generate class average mastery percentage (55% to 92%)
    const avgMastery = Math.min(95, Math.max(45, Math.round(60 + (idx * 7) + (classroom.roster.length * 2))));
    const status = avgMastery >= 85 ? 'HIGH_MASTERY' : avgMastery >= 70 ? 'MODERATE' : 'CRITICAL_WEAKNESS';

    return {
      topic: t,
      avgMastery,
      status,
      studentsAssessedCount: classroom.roster.length,
    };
  });

  return {
    classroomId: classroom.id,
    classroomName: classroom.name,
    totalStudents: classroom.roster.length,
    heatmap,
  };
};

const getClassroomById = (id) => classroomsStore.get(id);

module.exports = {
  createClassroom,
  joinClassroom,
  importRosterFromCsv,
  dispatchAssignment,
  getClassroomMasteryHeatmap,
  getClassroomById,
};

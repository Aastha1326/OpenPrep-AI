/**
 * Granular Role-Based Access Control (RBAC) Middleware & Permissions Matrix
 */

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  INSTITUTION_ADMIN: 'INSTITUTION_ADMIN',
  EDUCATOR: 'EDUCATOR',
  TEACHING_ASSISTANT: 'TEACHING_ASSISTANT',
  STUDENT: 'STUDENT',
};

const PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['*'],
  [ROLES.INSTITUTION_ADMIN]: [
    'canManageInstitution',
    'canCreateClassroom',
    'canManageRoster',
    'canAssignQuiz',
    'canViewAnalytics',
    'canDispatchAssignment',
  ],
  [ROLES.EDUCATOR]: [
    'canCreateClassroom',
    'canManageRoster',
    'canAssignQuiz',
    'canViewAnalytics',
    'canDispatchAssignment',
  ],
  [ROLES.TEACHING_ASSISTANT]: [
    'canManageRoster',
    'canViewAnalytics',
    'canDispatchAssignment',
    'canGradeAssignment',
  ],
  [ROLES.STUDENT]: [
    'canEnrollClassroom',
    'canSubmitAssignment',
    'canViewOwnAnalytics',
  ],
};

/**
 * Authorize user based on one or more allowed roles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const userRole = (req.user.role || ROLES.STUDENT).toUpperCase();

    // SUPER_ADMIN has access to all role-restricted routes
    if (userRole === ROLES.SUPER_ADMIN || allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Forbidden: Role '${userRole}' does not have access to this resource. Required roles: ${allowedRoles.join(', ')}`,
    });
  };
};

/**
 * Require specific granular permission for endpoint
 */
const requirePermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const userRole = (req.user.role || ROLES.STUDENT).toUpperCase();
    const userPermissions = PERMISSIONS[userRole] || [];

    if (userRole === ROLES.SUPER_ADMIN || userPermissions.includes('*') || userPermissions.includes(permissionName)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Forbidden: Missing required permission '${permissionName}'.`,
    });
  };
};

module.exports = {
  ROLES,
  PERMISSIONS,
  authorizeRoles,
  requirePermission,
};

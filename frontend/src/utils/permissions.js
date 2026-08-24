/**
 * Centralized Role-Based Access Control (RBAC) Map
 */

export const ROLE_PERMISSIONS = {
  Admin: [
    'admin.access',
    'user.view',
    'user.create',
    'user.edit',
    'user.delete',
    'project.view',
    'project.create',
    'project.edit',
    'project.delete',
    'bug.view',
    'bug.create',
    'bug.edit',
    'bug.delete',
    'bug.assign',
    'bug.status',
    'testcase.view',
    'testcase.create',
    'testcase.edit',
    'testcase.delete',
    'testcase.execute',
    'report.view',
    'report.export',
  ],
  'QA Manager': [
    'user.view',
    'project.view',
    'project.create',
    'project.edit',
    'bug.view',
    'bug.create',
    'bug.edit',
    'bug.delete',
    'bug.assign',
    'bug.status',
    'testcase.view',
    'testcase.create',
    'testcase.edit',
    'testcase.delete',
    'testcase.execute',
    'report.view',
    'report.export',
  ],
  Tester: [
    'user.view',
    'project.view',
    'bug.view',
    'bug.create',
    'bug.edit',
    'bug.status',
    'testcase.view',
    'testcase.create',
    'testcase.edit',
    'testcase.execute',
    'report.view',
    'report.export',
  ],
  Developer: [
    'user.view',
    'project.view',
    'bug.view',
    'bug.edit',
    'bug.status',
    'testcase.view',
    'report.view',
  ],
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

export default hasPermission;

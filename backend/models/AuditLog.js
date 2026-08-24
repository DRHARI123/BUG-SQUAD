const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
    userRole: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['User', 'Project', 'Module', 'Bug', 'TestCase', 'Report', 'System'],
      default: 'System',
    },
    entityId: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

let memoryAuditLogs = [
  {
    _id: 'audit_101',
    userName: 'Alex Rivera',
    userRole: 'Admin',
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: 'usr_new',
    description: "Created new user 'Sarah Connor' with role 'QA Manager'",
    createdAt: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
  },
  {
    _id: 'audit_102',
    userName: 'Sarah Connor',
    userRole: 'QA Manager',
    action: 'BUG_CREATED',
    entityType: 'Bug',
    entityId: 'BUG-0001',
    description: "Submitted defect report 'BUG-0001: Token Expiration Loop'",
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
  {
    _id: 'audit_103',
    userName: 'John Doe',
    userRole: 'Tester',
    action: 'TEST_EXECUTED',
    entityType: 'TestCase',
    entityId: 'TC-0001',
    description: "Executed test case 'TC-0001' with verdict 'Passed'",
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
];

const logAudit = async ({ userId, userName, userRole, action, entityType, entityId, description, ipAddress }) => {
  try {
    if (mongoose.connection.readyState === 1) {
      await AuditLog.create({
        user: userId || null,
        userName: userName || 'System',
        userRole: userRole || 'System',
        action,
        entityType: entityType || 'System',
        entityId: entityId || '',
        description,
        ipAddress: ipAddress || '127.0.0.1',
      });
    } else {
      memoryAuditLogs.unshift({
        _id: 'audit_' + Date.now(),
        user: userId || null,
        userName: userName || 'System',
        userRole: userRole || 'System',
        action,
        entityType: entityType || 'System',
        entityId: entityId || '',
        description,
        ipAddress: ipAddress || '127.0.0.1',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[AUDIT LOG ERROR]:', err);
  }
};

module.exports = { AuditLog, logAudit, memoryAuditLogs };

const AuditLog = require('../models/AuditLog');

const logAudit = async ({ actorId, actorRole, action, metadata = {} }) => {
  return AuditLog.create({ actorId, actorRole, action, metadata });
};

module.exports = { logAudit };

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

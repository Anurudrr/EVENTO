import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    role: {
      type: String,
      default: 'system',
      trim: true,
      maxlength: [40, 'Audit role cannot be more than 40 characters'],
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Audit action cannot be more than 120 characters'],
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: [80, 'Entity type cannot be more than 80 characters'],
      index: true,
    },
    entityId: {
      type: String,
      default: '',
      trim: true,
      maxlength: [120, 'Entity id cannot be more than 120 characters'],
      index: true,
    },
    status: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
      index: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      maxlength: [240, 'Audit summary cannot be more than 240 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AuditLog: mongoose.Model<any> = (mongoose.models.AuditLog as mongoose.Model<any>)
  || (mongoose.model<any>('AuditLog', auditLogSchema) as mongoose.Model<any>);

export default AuditLog;

import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userFullName: string;
  userRole: string;
  action: 'create' | 'update' | 'delete' | 'generate' | 'import' | 'bulk_update' | 'status_change';
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  details?: string;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userFullName: { type: String, required: true },
  userRole: { type: String, required: true },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'generate', 'import', 'bulk_update', 'status_change'],
    required: true
  },
  entityType: { type: String, required: true },
  entityId: { type: String, required: true },
  entityName: { type: String, default: '' },
  changes: [{
    field: { type: String },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed }
  }],
  details: { type: String }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ entityType: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema, 'audit_logs');

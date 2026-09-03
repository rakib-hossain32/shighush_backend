import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
	userId: Types.ObjectId;
	action: string;
	targetType: 'report' | 'user' | 'institution' | 'appeal' | 'flag' | 'person';
	targetId: string;
	details?: Record<string, any>;
	ipAddress?: string;
	userAgent?: string;
	createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		action: { type: String, required: true },
		targetType: { 
			type: String, 
			enum: ['report', 'user', 'institution', 'appeal', 'flag', 'person'], 
			required: true 
		},
		targetId: { type: String, required: true },
		details: { type: Schema.Types.Mixed },
		ipAddress: { type: String },
		userAgent: { type: String },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;

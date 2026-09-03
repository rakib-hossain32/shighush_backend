import { Schema, model, Document, Types } from 'mongoose';

export interface IAppeal extends Document {
	reportId: Types.ObjectId;
	caseId: string;
	reason: 'incorrect_info' | 'privacy_violation' | 'institutional_response' | 'other';
	description: string;
	status: 'received' | 'in_review' | 'resolved' | 'rejected';
	resolution?: string;
	resolvedBy?: Types.ObjectId;
	resolvedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const appealSchema = new Schema<IAppeal>(
	{
		reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
		caseId: { type: String, required: true },
		reason: { 
			type: String, 
			enum: ['incorrect_info', 'privacy_violation', 'institutional_response', 'other'], 
			required: true 
		},
		description: { type: String, required: true },
		status: { 
			type: String, 
			enum: ['received', 'in_review', 'resolved', 'rejected'], 
			default: 'received' 
		},
		resolution: { type: String },
		resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		resolvedAt: { type: Date },
	},
	{ timestamps: true }
);

appealSchema.index({ reportId: 1 });
appealSchema.index({ status: 1, createdAt: -1 });

const Appeal = model<IAppeal>('Appeal', appealSchema);
export default Appeal;

import { Schema, model, Document, Types } from 'mongoose';

export interface IFlag extends Document {
	reportId: Types.ObjectId;
	reason: 'pii_present' | 'false_info' | 'spam' | 'duplicate' | 'inappropriate' | 'other';
	details?: string;
	status: 'open' | 'reviewed' | 'actioned' | 'dismissed';
	reviewedBy?: Types.ObjectId;
	reviewNotes?: string;
	createdAt: Date;
	updatedAt: Date;
}

const flagSchema = new Schema<IFlag>(
	{
		reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
		reason: { 
			type: String, 
			enum: ['pii_present', 'false_info', 'spam', 'duplicate', 'inappropriate', 'other'], 
			required: true 
		},
		details: { type: String },
		status: { 
			type: String, 
			enum: ['open', 'reviewed', 'actioned', 'dismissed'], 
			default: 'open' 
		},
		reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		reviewNotes: { type: String },
	},
	{ timestamps: true }
);

flagSchema.index({ reportId: 1 });
flagSchema.index({ status: 1, createdAt: -1 });

const Flag = model<IFlag>('Flag', flagSchema);
export default Flag;

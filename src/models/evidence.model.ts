import { Schema, model, Document, Types } from 'mongoose';

export interface IEvidence extends Document {
	reportId: Types.ObjectId;
	type: 'document' | 'image' | 'audio' | 'video';
	url: string;
	filename: string;
	originalFilename: string;
	fileSize: number;
	mimeType: string;
	verified: boolean;
	verifiedBy?: Types.ObjectId;
	verifiedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

const evidenceSchema = new Schema<IEvidence>(
	{
		reportId: { type: Schema.Types.ObjectId, ref: 'Report', required: true },
		type: { 
			type: String, 
			enum: ['document', 'image', 'audio', 'video'], 
			required: true 
		},
		url: { type: String, required: true },
		filename: { type: String, required: true },
		originalFilename: { type: String, required: true },
		fileSize: { type: Number, required: true },
		mimeType: { type: String, required: true },
		verified: { type: Boolean, default: false },
		verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		verifiedAt: { type: Date },
	},
	{ timestamps: true }
);

evidenceSchema.index({ reportId: 1 });
evidenceSchema.index({ verified: 1 });

const Evidence = model<IEvidence>('Evidence', evidenceSchema);
export default Evidence;

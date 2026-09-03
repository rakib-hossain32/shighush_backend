import { Schema, model, Document } from 'mongoose';

export interface IInstitution extends Document {
	slug: string;
	nameBn: string;
	nameEn?: string;
	category: string;
	type: string;
	area: string;
	address?: string;
	description?: string;
	reportCount: number;
	verifiedReportCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const institutionSchema = new Schema<IInstitution>(
	{
		slug: { type: String, required: true, unique: true },
		nameBn: { type: String, required: true },
		nameEn: { type: String },
		category: { type: String, required: true },
		type: { type: String, required: true },
		area: { type: String, required: true },
		address: { type: String },
		description: { type: String },
		reportCount: { type: Number, default: 0 },
		verifiedReportCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

// slug index is already created by unique: true, no need to duplicate
institutionSchema.index({ area: 1, category: 1 });

const Institution = model<IInstitution>('Institution', institutionSchema);
export default Institution;

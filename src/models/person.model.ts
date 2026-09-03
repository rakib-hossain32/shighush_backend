import { Schema, model, Document } from 'mongoose';

export interface IPerson extends Document {
	slug: string;
	name: string;
	designation?: string;
	nameVisibility: 'hidden' | 'published' | 'redacted';
	reportCount: number;
	verifiedCount: number;
	createdAt: Date;
	updatedAt: Date;
}

const personSchema = new Schema<IPerson>(
	{
		slug: { type: String, required: true, unique: true },
		name: { type: String, required: true },
		designation: { type: String },
		nameVisibility: { 
			type: String, 
			enum: ['hidden', 'published', 'redacted'], 
			default: 'hidden' 
		},
		reportCount: { type: Number, default: 0 },
		verifiedCount: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

// slug index is already created by unique: true, no need to duplicate
personSchema.index({ nameVisibility: 1 });

const Person = model<IPerson>('Person', personSchema);
export default Person;

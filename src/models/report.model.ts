import { Schema, model, Document, Types } from 'mongoose';

export interface IReport extends Document {
	caseId: string;
	institutionName: string;
	institutionId?: Types.ObjectId;
	category: 'bribery' | 'extortion' | 'service_denial' | 'harassment' | 'abuse_of_power' | 'procurement_irregularity' | 'fraud' | 'other';
	area: string;
	officeName?: string;
	incidentDate: Date;
	incidentDatePrecision: 'exact' | 'approximate' | 'month_only' | 'year_only';
	narrative: string;
	moneyAmount?: number;
	moneyType?: 'requested' | 'paid' | 'unknown';
	officialFee?: number;
	accusedName?: string;
	accusedDesignation?: string;
	serviceName?: string;
	referenceNumber?: string;
	enableAnonymousInbox: boolean;
	status: 'received' | 'under_review' | 'awaiting_redaction' | 'published' | 'archived' | 'removed';
	verificationLevel: 'unverified' | 'evidence_attached' | 'corroborated' | 'official_record';
	publishedAt?: Date;
	reviewedBy?: Types.ObjectId;
	piiFindings: string[];
	createdAt: Date;
	updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
	{
		caseId: { type: String, required: true, unique: true },
		institutionName: { type: String, required: true },
		institutionId: { type: Schema.Types.ObjectId, ref: 'Institution' },
		category: { 
			type: String, 
			enum: ['bribery', 'extortion', 'service_denial', 'harassment', 'abuse_of_power', 'procurement_irregularity', 'fraud', 'other'], 
			required: true 
		},
		area: { type: String, required: true },
		officeName: { type: String },
		incidentDate: { type: Date, required: true },
		incidentDatePrecision: { 
			type: String, 
			enum: ['exact', 'approximate', 'month_only', 'year_only'], 
			default: 'exact' 
		},
		narrative: { type: String, required: true },
		moneyAmount: { type: Number },
		moneyType: { type: String, enum: ['requested', 'paid', 'unknown'], default: 'unknown' },
		officialFee: { type: Number },
		accusedName: { type: String },
		accusedDesignation: { type: String },
		serviceName: { type: String },
		referenceNumber: { type: String },
		enableAnonymousInbox: { type: Boolean, default: false },
		status: { 
			type: String, 
			enum: ['received', 'under_review', 'awaiting_redaction', 'published', 'archived', 'removed'], 
			default: 'received' 
		},
		verificationLevel: { 
			type: String, 
			enum: ['unverified', 'evidence_attached', 'corroborated', 'official_record'], 
			default: 'unverified' 
		},
		publishedAt: { type: Date },
		reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		piiFindings: { type: [String], default: [] },
	},
	{ timestamps: true }
);

// Index for efficient queries
reportSchema.index({ status: 1, createdAt: -1 });
// caseId index is already created by unique: true, no need to duplicate
reportSchema.index({ publishedAt: -1 });
reportSchema.index({ area: 1, status: 1 });

const Report = model<IReport>('Report', reportSchema);
export default Report;

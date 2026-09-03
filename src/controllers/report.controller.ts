import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Report from '@/models/report.model';
import AuditLog from '@/models/auditLog.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';
import { detectPii, summarisePii } from '@/utils/piiDetection';
import { generateCaseId } from '@/utils/caseId';

// Validation schema matching frontend
const createReportSchema = z.object({
	institutionName: z.string().min(3).max(200),
	category: z.enum(['bribery', 'extortion', 'service_denial', 'harassment', 'abuse_of_power', 'procurement_irregularity', 'fraud', 'other']),
	area: z.string().min(1),
	officeName: z.string().max(200).optional(),
	incidentDate: z.string(),
	incidentDatePrecision: z.enum(['exact', 'approximate', 'month_only', 'year_only']).default('exact'),
	narrative: z.string().min(40).max(5000),
	moneyAmount: z.number().nonnegative().optional(),
	moneyType: z.enum(['requested', 'paid', 'unknown']).optional(),
	officialFee: z.number().nonnegative().optional(),
	accusedName: z.string().max(120).optional(),
	accusedDesignation: z.string().max(120).optional(),
	serviceName: z.string().max(200).optional(),
	referenceNumber: z.string().max(80).optional(),
	enableAnonymousInbox: z.boolean().default(false),
});

/**
 * Create new report (PUBLIC endpoint)
 */
export const createReport = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const result = createReportSchema.safeParse(req.body);
		if (!result.success) {
			const errorMessages = result.error.errors
				.map(err => `${err.path.join('.')}: ${err.message}`)
				.join(', ');
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				`Invalid input: ${errorMessages}`
			);
		}

		const data = result.data;

		// Detect PII in narrative
		const piiFindings = detectPii(data.narrative);
		const piiSummary = summarisePii(piiFindings);

		// Generate case ID
		const reportCount = await Report.countDocuments();
		const caseId = generateCaseId(reportCount + 1);

		// Create report
		const report = await Report.create({
			caseId,
			...data,
			incidentDate: new Date(data.incidentDate),
			piiFindings: piiSummary,
			status: 'received',
			verificationLevel: 'unverified',
		});

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: {
				caseId: report.caseId,
				id: report._id,
				message: 'রিপোর্ট সফলভাবে জমা হয়েছে। রিভিউ করার পর প্রকাশ করা হবে।',
			},
		});
	} catch (err) {
		next(err);
	}
};

/**
 * List reports (PUBLIC for published, ADMIN for all)
 */
export const listReports = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const isAdmin = !!authReq.user;

		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const skip = (page - 1) * limit;

		// Filters
		const filters: any = {};
		
		if (!isAdmin) {
			// Public only sees published reports
			filters.status = 'published';
		} else {
			// Admin can filter by status
			if (req.query.status) {
				filters.status = req.query.status;
			}
		}

		if (req.query.category) {
			filters.category = req.query.category;
		}

		if (req.query.area) {
			filters.area = req.query.area;
		}

		if (req.query.verificationLevel) {
			filters.verificationLevel = req.query.verificationLevel;
		}

		const [reports, total] = await Promise.all([
			Report.find(filters)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.select(isAdmin ? '' : '-piiFindings -reviewedBy')
				.lean(),
			Report.countDocuments(filters),
		]);

		res.json({
			success: true,
			data: {
				reports,
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			},
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Get report by caseId (PUBLIC for published, ADMIN for all)
 */
export const getReportByCaseId = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { caseId } = req.params;
		const authReq = req as AuthRequest;
		const isAdmin = !!authReq.user;

		const filters: any = { caseId };
		if (!isAdmin) {
			filters.status = 'published';
		}

		const report = await Report.findOne(filters)
			.populate('institutionId', 'slug nameBn category')
			.select(isAdmin ? '' : '-piiFindings -reviewedBy')
			.lean();

		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		res.json({
			success: true,
			data: report,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Update report status (ADMIN only)
 */
export const updateReportStatus = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const authReq = req as AuthRequest;
		const { status } = req.body;

		if (!['received', 'under_review', 'awaiting_redaction', 'published', 'archived', 'removed'].includes(status)) {
			throw new ApiError(Constants.HTTP_STATUS.BAD_REQUEST, 'Invalid status');
		}

		const report = await Report.findById(id);
		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		const oldStatus = report.status;
		report.status = status;

		if (status === 'published' && !report.publishedAt) {
			report.publishedAt = new Date();
			report.reviewedBy = authReq.user!.id as any;
		}

		await report.save();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'report:status_change',
			targetType: 'report',
			targetId: report._id.toString(),
			details: { from: oldStatus, to: status },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: report,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Redact PII from narrative (ADMIN only)
 */
export const redactReport = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const authReq = req as AuthRequest;
		const { narrative } = req.body;

		if (!narrative || typeof narrative !== 'string') {
			throw new ApiError(Constants.HTTP_STATUS.BAD_REQUEST, 'Narrative required');
		}

		const report = await Report.findById(id);
		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		const oldNarrative = report.narrative;
		report.narrative = narrative;

		// Re-detect PII after redaction
		const piiFindings = detectPii(narrative);
		report.piiFindings = summarisePii(piiFindings);

		await report.save();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'report:redact',
			targetType: 'report',
			targetId: report._id.toString(),
			details: { 
				piiFoundBefore: report.piiFindings.length,
				piiFoundAfter: piiFindings.length,
			},
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: report,
		});
	} catch (err) {
		next(err);
	}
};

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
				.populate('institutionId', 'slug nameBn category')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.select(isAdmin ? '' : '-piiFindings -reviewedBy')
				.lean(),
			Report.countDocuments(filters),
		]);

		// Transform reports to ensure consistent structure
		const transformedReports = reports.map((report: any) => {
			const institutionData = report.institutionId && typeof report.institutionId === 'object'
				? {
						id: report.institutionId._id?.toString() || '',
						nameBn: report.institutionId.nameBn || report.institutionName || 'অজানা প্রতিষ্ঠান',
						slug: report.institutionId.slug || '',
					}
				: {
						id: '',
						nameBn: report.institutionName || 'অজানা প্রতিষ্ঠান',
						slug: '',
					};

			return {
				...report,
				id: report._id.toString(),
				publicId: report.caseId || '',
				institution: institutionData,
				location: {
					area: report.area || '',
				},
				submittedAt: report.createdAt?.toISOString() || new Date().toISOString(),
				publishedAt: report.publishedAt?.toISOString() || '',
				updatedAt: report.updatedAt?.toISOString() || new Date().toISOString(),
			};
		});

		// Return in ApiListResponse format
		res.json({
			data: transformedReports,
			meta: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
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

		// Transform report to ensure consistent structure
		const reportData: any = report;
		const institutionData = reportData.institutionId && typeof reportData.institutionId === 'object'
			? {
					id: reportData.institutionId._id?.toString() || '',
					nameBn: reportData.institutionId.nameBn || reportData.institutionName || 'অজানা প্রতিষ্ঠান',
					slug: reportData.institutionId.slug || '',
				}
			: {
					id: '',
					nameBn: reportData.institutionName || 'অজানা প্রতিষ্ঠান',
					slug: '',
				};

		const transformedReport = {
			...reportData,
			id: reportData._id.toString(),
			publicId: reportData.caseId || '',
			institution: institutionData,
			location: {
				area: reportData.area || '',
			},
			submittedAt: reportData.createdAt?.toISOString() || new Date().toISOString(),
			publishedAt: reportData.publishedAt?.toISOString() || '',
			updatedAt: reportData.updatedAt?.toISOString() || new Date().toISOString(),
		};

		res.json({
			data: transformedReport,
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

		// Transform response
		const reportData = report.toObject();
		res.json({
			data: {
				...reportData,
				id: reportData._id.toString(),
			},
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

		// Transform response
		const reportData = report.toObject();
		res.json({
			data: {
				...reportData,
				id: reportData._id.toString(),
			},
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Get report by ID (ADMIN/MODERATOR for moderation)
 */
export const getReportById = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const authReq = req as AuthRequest;
		const isAdmin = !!authReq.user;

		const report = await Report.findById(id)
			.populate('institutionId', 'slug nameBn category')
			.select(isAdmin ? '' : '-piiFindings -reviewedBy')
			.lean();

		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		// Transform report to ensure consistent structure
		const reportData: any = report;
		const institutionData = reportData.institutionId && typeof reportData.institutionId === 'object'
			? {
					id: reportData.institutionId._id?.toString() || '',
					nameBn: reportData.institutionId.nameBn || reportData.institutionName || 'অজানা প্রতিষ্ঠান',
					slug: reportData.institutionId.slug || '',
				}
			: {
					id: '',
					nameBn: reportData.institutionName || 'অজানা প্রতিষ্ঠান',
					slug: '',
				};

		const transformedReport = {
			...reportData,
			id: reportData._id.toString(),
			publicId: reportData.caseId || '',
			title: reportData.narrative?.substring(0, 100) || 'শিরোনাম নেই',
			summary: reportData.narrative?.substring(0, 200) || '',
			rawNarrative: reportData.narrative || '',
			institution: institutionData,
			location: {
				area: reportData.area || '',
			},
			piiFindings: reportData.piiFindings || [],
			moderatorNotes: [],
			evidence: [],
			slug: reportData.caseId || '',
			narrative: reportData.narrative || '',
			submittedAt: reportData.createdAt?.toISOString() || new Date().toISOString(),
			publishedAt: reportData.publishedAt?.toISOString() || '',
			updatedAt: reportData.updatedAt?.toISOString() || new Date().toISOString(),
			verificationLevel: reportData.verificationLevel || 'unverified',
		};

		res.json({
			data: transformedReport,
		});
	} catch (err) {
		next(err);
	}
};

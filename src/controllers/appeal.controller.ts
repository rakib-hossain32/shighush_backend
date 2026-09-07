import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import Appeal from '@/models/appeal.model';
import Report from '@/models/report.model';
import AuditLog from '@/models/auditLog.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';

const createAppealSchema = z.object({
	caseId: z.string().min(1),
	reason: z.enum(['incorrect_info', 'privacy_violation', 'institutional_response', 'other']),
	description: z.string().min(20).max(2000),
});

/**
 * Create appeal (PUBLIC)
 */
export const createAppeal = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const result = createAppealSchema.safeParse(req.body);

		if (!result.success) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'Invalid input'
			);
		}

		const { caseId, reason, description } = result.data;

		// Find report
		const report = await Report.findOne({ caseId });
		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		// Check if appeal already exists for this report
		const existingAppeal = await Appeal.findOne({
			reportId: report._id,
			status: { $in: ['received', 'in_review'] },
		});

		if (existingAppeal) {
			throw new ApiError(
				Constants.HTTP_STATUS.CONFLICT,
				'An active appeal already exists for this report'
			);
		}

		const appeal = await Appeal.create({
			reportId: report._id,
			caseId,
			reason,
			description,
			status: 'received',
		});

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: appeal,
			message: 'আপিল জমা হয়েছে। রিভিউ করার পর আপনাকে জানানো হবে।',
		});
	} catch (err) {
		next(err);
	}
};

/**
 * List appeals (ADMIN/MODERATOR)
 */
export const listAppeals = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const skip = (page - 1) * limit;

		const filters: any = {};

		if (req.query.status) {
			filters.status = req.query.status;
		}

		if (req.query.reason) {
			filters.reason = req.query.reason;
		}

		const [appeals, total] = await Promise.all([
			Appeal.find(filters)
				.populate('reportId', 'caseId category institutionName')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Appeal.countDocuments(filters),
		]);

		// Transform to match frontend expectations
		const transformedAppeals = appeals.map((appeal: any) => ({
			id: appeal._id.toString(),
			caseId: appeal.caseId || appeal.reportId?.caseId || '',
			reportSlug: appeal.reportId?.caseId,
			reason: appeal.reason,
			detail: appeal.description || '',
			status: appeal.status,
			receivedAt: appeal.createdAt.toISOString(),
			resolvedAt: appeal.resolvedAt?.toISOString(),
		}));

		res.json({
			data: transformedAppeals,
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
 * Get appeal by ID (ADMIN/MODERATOR)
 */
export const getAppealById = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;

		const appeal = await Appeal.findById(id)
			.populate('reportId')
			.populate('resolvedBy', 'name email role')
			.lean();

		if (!appeal) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Appeal not found');
		}

		res.json({
			success: true,
			data: appeal,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Update appeal status (ADMIN/MODERATOR)
 */
export const updateAppealStatus = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;
		const { status, resolution } = req.body;

		const validStatuses = ['received', 'in_review', 'resolved', 'rejected'] as const;
		
		if (!validStatuses.includes(status)) {
			throw new ApiError(Constants.HTTP_STATUS.BAD_REQUEST, 'Invalid status');
		}

		const appeal = await Appeal.findById(id);
		if (!appeal) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Appeal not found');
		}

		appeal.status = status as 'received' | 'in_review' | 'resolved' | 'rejected';

		if (status === 'resolved' || status === 'rejected') {
			appeal.resolution = resolution;
			appeal.resolvedBy = new Types.ObjectId(authReq.user!.id);
			appeal.resolvedAt = new Date();
		}

		await appeal.save();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'appeal:status_change',
			targetType: 'appeal',
			targetId: appeal._id.toString(),
			details: { status, resolution },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: appeal,
		});
	} catch (err) {
		next(err);
	}
};

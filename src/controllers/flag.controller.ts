import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Flag from '@/models/flag.model';
import Report from '@/models/report.model';
import AuditLog from '@/models/auditLog.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';

const createFlagSchema = z.object({
	reportId: z.string().min(1),
	reason: z.enum(['pii_present', 'false_info', 'spam', 'duplicate', 'inappropriate', 'other']),
	details: z.string().max(500).optional(),
});

/**
 * Create flag (PUBLIC)
 */
export const createFlag = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const result = createFlagSchema.safeParse(req.body);

		if (!result.success) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'Invalid input',
				result.error.errors
			);
		}

		const { reportId, reason, details } = result.data;

		// Check if report exists
		const report = await Report.findById(reportId);
		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		// Check if similar flag already exists
		const existingFlag = await Flag.findOne({
			reportId,
			reason,
			status: 'open',
		});

		if (existingFlag) {
			throw new ApiError(
				Constants.HTTP_STATUS.CONFLICT,
				'A similar flag already exists for this report'
			);
		}

		const flag = await Flag.create({
			reportId,
			reason,
			details,
			status: 'open',
		});

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: flag,
			message: 'ফ্ল্যাগ জমা হয়েছে। মডারেটররা রিভিউ করবেন।',
		});
	} catch (err) {
		next(err);
	}
};

/**
 * List flags (ADMIN/MODERATOR)
 */
export const listFlags = async (
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

		const [flags, total] = await Promise.all([
			Flag.find(filters)
				.populate('reportId', 'caseId category institutionName narrative')
				.populate('reviewedBy', 'name role')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Flag.countDocuments(filters),
		]);

		res.json({
			success: true,
			data: {
				flags,
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
 * Get flag by ID (ADMIN/MODERATOR)
 */
export const getFlagById = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;

		const flag = await Flag.findById(id)
			.populate('reportId')
			.populate('reviewedBy', 'name email role')
			.lean();

		if (!flag) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Flag not found');
		}

		res.json({
			success: true,
			data: flag,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Update flag status (ADMIN/MODERATOR)
 */
export const updateFlagStatus = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;
		const { status, reviewNotes } = req.body;

		if (!['open', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
			throw new ApiError(Constants.HTTP_STATUS.BAD_REQUEST, 'Invalid status');
		}

		const flag = await Flag.findById(id);
		if (!flag) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Flag not found');
		}

		flag.status = status;
		flag.reviewedBy = authReq.user!.id as any;
		flag.reviewNotes = reviewNotes;

		await flag.save();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'flag:status_change',
			targetType: 'flag',
			targetId: flag._id.toString(),
			details: { status, reviewNotes },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: flag,
		});
	} catch (err) {
		next(err);
	}
};

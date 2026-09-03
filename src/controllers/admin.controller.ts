import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '@/models/user.model';
import AuditLog from '@/models/auditLog.model';
import Report from '@/models/report.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';

/**
 * Get dashboard overview stats (ADMIN/MODERATOR)
 */
export const getDashboardStats = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const [
			totalReports,
			awaitingReview,
			published,
			piiAlerts,
			todayReports,
		] = await Promise.all([
			Report.countDocuments(),
			Report.countDocuments({ status: 'received' }),
			Report.countDocuments({ status: 'published' }),
			Report.countDocuments({
				piiFindings: { $exists: true, $ne: [] },
				status: { $in: ['received', 'under_review'] },
			}),
			Report.countDocuments({
				createdAt: {
					$gte: new Date(new Date().setHours(0, 0, 0, 0)),
				},
			}),
		]);

		res.json({
			success: true,
			data: {
				metrics: [
					{ key: 'total', label: 'মোট রিপোর্ট', value: totalReports },
					{ key: 'queue', label: 'রিভিউ প্রয়োজন', value: awaitingReview },
					{ key: 'published', label: 'প্রকাশিত', value: published },
					{ key: 'today', label: 'আজকের', value: todayReports },
				],
				piiAlerts,
			},
		});
	} catch (err) {
		next(err);
	}
};

/**
 * List users (ADMIN only)
 */
export const listUsers = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const skip = (page - 1) * limit;

		const filters: any = {};

		if (req.query.role) {
			filters.role = req.query.role;
		}

		const [users, total] = await Promise.all([
			User.find(filters)
				.select('-password')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			User.countDocuments(filters),
		]);

		res.json({
			success: true,
			data: {
				users,
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
 * Create user (ADMIN only)
 */
const createUserSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.enum(['Admin', 'Moderator']),
});

export const createUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const result = createUserSchema.safeParse(req.body);

		if (!result.success) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'Invalid input',
				result.error.errors
			);
		}

		// Check if email already exists
		const existing = await User.findOne({ email: result.data.email });
		if (existing) {
			throw new ApiError(
				Constants.HTTP_STATUS.CONFLICT,
				'User with this email already exists'
			);
		}

		const user = await User.create(result.data);

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'user:create',
			targetType: 'user',
			targetId: user._id.toString(),
			details: { email: user.email, role: user.role },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		// Remove password from response
		const userObj = user.toObject();
		delete userObj.password;

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: userObj,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Update user role (ADMIN only)
 */
export const updateUserRole = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;
		const { role } = req.body;

		if (!['Admin', 'Moderator'].includes(role)) {
			throw new ApiError(Constants.HTTP_STATUS.BAD_REQUEST, 'Invalid role');
		}

		const user = await User.findByIdAndUpdate(
			id,
			{ role },
			{ new: true }
		).select('-password');

		if (!user) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'User not found');
		}

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'user:role_change',
			targetType: 'user',
			targetId: user._id.toString(),
			details: { role },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: user,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * List audit logs (ADMIN only)
 */
export const listAuditLogs = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 50;
		const skip = (page - 1) * limit;

		const filters: any = {};

		if (req.query.userId) {
			filters.userId = req.query.userId;
		}

		if (req.query.action) {
			filters.action = req.query.action;
		}

		if (req.query.targetType) {
			filters.targetType = req.query.targetType;
		}

		const [logs, total] = await Promise.all([
			AuditLog.find(filters)
				.populate('userId', 'name email role')
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			AuditLog.countDocuments(filters),
		]);

		res.json({
			success: true,
			data: {
				logs,
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

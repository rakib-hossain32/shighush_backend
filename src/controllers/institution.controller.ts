import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Institution from '@/models/institution.model';
import Report from '@/models/report.model';
import AuditLog from '@/models/auditLog.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';

const createInstitutionSchema = z.object({
	slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
	nameBn: z.string().min(3).max(200),
	nameEn: z.string().max(200).optional(),
	category: z.string().min(1),
	type: z.string().min(1),
	area: z.string().min(1),
	address: z.string().max(500).optional(),
	description: z.string().max(2000).optional(),
});

/**
 * List institutions (PUBLIC)
 */
export const listInstitutions = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;
		const skip = (page - 1) * limit;

		const filters: any = {};

		if (req.query.category) {
			filters.category = req.query.category;
		}

		if (req.query.area) {
			filters.area = req.query.area;
		}

		if (req.query.type) {
			filters.type = req.query.type;
		}

		if (req.query.search) {
			filters.$or = [
				{ nameBn: { $regex: req.query.search, $options: 'i' } },
				{ nameEn: { $regex: req.query.search, $options: 'i' } },
			];
		}

		const [institutions, total] = await Promise.all([
			Institution.find(filters)
				.sort({ reportCount: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Institution.countDocuments(filters),
		]);

		res.json({
			success: true,
			data: {
				institutions,
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
 * Get institution by slug (PUBLIC)
 */
export const getInstitutionBySlug = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { slug } = req.params;

		const institution = await Institution.findOne({ slug }).lean();

		if (!institution) {
			throw new ApiError(
				Constants.HTTP_STATUS.NOT_FOUND,
				'Institution not found'
			);
		}

		// Get related published reports
		const reports = await Report.find({
			institutionId: institution._id,
			status: 'published',
		})
			.sort({ publishedAt: -1 })
			.limit(10)
			.select('caseId category incidentDate verificationLevel')
			.lean();

		res.json({
			success: true,
			data: {
				...institution,
				recentReports: reports,
			},
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Create institution (ADMIN only)
 */
export const createInstitution = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const result = createInstitutionSchema.safeParse(req.body);

		if (!result.success) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'Invalid input',
				result.error.errors
			);
		}

		// Check if slug already exists
		const existing = await Institution.findOne({ slug: result.data.slug });
		if (existing) {
			throw new ApiError(
				Constants.HTTP_STATUS.CONFLICT,
				'Institution with this slug already exists'
			);
		}

		const institution = await Institution.create(result.data);

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'institution:create',
			targetType: 'institution',
			targetId: institution._id.toString(),
			details: { slug: institution.slug, nameBn: institution.nameBn },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: institution,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Update institution (ADMIN only)
 */
export const updateInstitution = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;

		const updateData = createInstitutionSchema.partial().parse(req.body);

		const institution = await Institution.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		);

		if (!institution) {
			throw new ApiError(
				Constants.HTTP_STATUS.NOT_FOUND,
				'Institution not found'
			);
		}

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'institution:update',
			targetType: 'institution',
			targetId: institution._id.toString(),
			details: updateData,
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: institution,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Delete institution (ADMIN only)
 */
export const deleteInstitution = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;

		const institution = await Institution.findById(id);

		if (!institution) {
			throw new ApiError(
				Constants.HTTP_STATUS.NOT_FOUND,
				'Institution not found'
			);
		}

		// Check if any reports reference this institution
		const reportCount = await Report.countDocuments({ institutionId: id });
		if (reportCount > 0) {
			throw new ApiError(
				Constants.HTTP_STATUS.CONFLICT,
				`Cannot delete institution with ${reportCount} linked reports`
			);
		}

		await institution.deleteOne();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'institution:delete',
			targetType: 'institution',
			targetId: id,
			details: { slug: institution.slug, nameBn: institution.nameBn },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			message: 'Institution deleted successfully',
		});
	} catch (err) {
		next(err);
	}
};

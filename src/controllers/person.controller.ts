import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Person from '@/models/person.model';
import Report from '@/models/report.model';
import AuditLog from '@/models/auditLog.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';

const createPersonSchema = z.object({
	slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
	name: z.string().min(2).max(120),
	designation: z.string().max(120).optional(),
	nameVisibility: z.enum(['hidden', 'published', 'redacted']).default('hidden'),
});

/**
 * List people (PUBLIC - only published)
 */
export const listPeople = async (
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

		const filters: any = {};

		// Public only sees published
		if (!isAdmin) {
			filters.nameVisibility = 'published';
		} else if (req.query.visibility) {
			filters.nameVisibility = req.query.visibility;
		}

		if (req.query.search) {
			filters.name = { $regex: req.query.search, $options: 'i' };
		}

		const [people, total] = await Promise.all([
			Person.find(filters)
				.sort({ reportCount: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			Person.countDocuments(filters),
		]);

		res.json({
			success: true,
			data: {
				people,
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
 * Get person by slug (PUBLIC if published)
 */
export const getPersonBySlug = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const isAdmin = !!authReq.user;
		const { slug } = req.params;

		const filters: any = { slug };
		if (!isAdmin) {
			filters.nameVisibility = 'published';
		}

		const person = await Person.findOne(filters).lean();

		if (!person) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Person not found');
		}

		// Get related reports (only published for public)
		const reportFilters: any = { 'accusedName': person.name };
		if (!isAdmin) {
			reportFilters.status = 'published';
		}

		const reports = await Report.find(reportFilters)
			.sort({ incidentDate: -1 })
			.limit(20)
			.select('caseId category institutionName incidentDate verificationLevel')
			.lean();

		res.json({
			success: true,
			data: {
				...person,
				reports,
			},
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Create person (ADMIN only)
 */
export const createPerson = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const result = createPersonSchema.safeParse(req.body);

		if (!result.success) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'Invalid input',
				result.error.errors
			);
		}

		// Check if slug already exists
		const existing = await Person.findOne({ slug: result.data.slug });
		if (existing) {
			throw new ApiError(
				Constants.HTTP_STATUS.CONFLICT,
				'Person with this slug already exists'
			);
		}

		const person = await Person.create(result.data);

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'person:create',
			targetType: 'person',
			targetId: person._id.toString(),
			details: { slug: person.slug, name: person.name },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: person,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Update person visibility (ADMIN only)
 */
export const updatePersonVisibility = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;
		const { nameVisibility } = req.body;

		if (!['hidden', 'published', 'redacted'].includes(nameVisibility)) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'Invalid visibility value'
			);
		}

		const person = await Person.findByIdAndUpdate(
			id,
			{ nameVisibility },
			{ new: true }
		);

		if (!person) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Person not found');
		}

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'person:visibility_change',
			targetType: 'person',
			targetId: person._id.toString(),
			details: { nameVisibility },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: person,
		});
	} catch (err) {
		next(err);
	}
};

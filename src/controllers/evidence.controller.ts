import { Request, Response, NextFunction } from 'express';
import Evidence from '@/models/evidence.model';
import Report from '@/models/report.model';
import AuditLog from '@/models/auditLog.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { AuthRequest } from '@/middlewares/auth.middleware';
import { getFileType } from '@/middlewares/upload.middleware';
import path from 'path';

/**
 * Upload evidence for a report (PUBLIC)
 */
export const uploadEvidence = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { reportId } = req.params;

		if (!req.file) {
			throw new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				'No file uploaded'
			);
		}

		// Verify report exists
		const report = await Report.findById(reportId);
		if (!report) {
			throw new ApiError(Constants.HTTP_STATUS.NOT_FOUND, 'Report not found');
		}

		const fileType = getFileType(req.file.mimetype);

		const evidence = await Evidence.create({
			reportId,
			type: fileType,
			url: `/uploads/${req.file.filename}`,
			filename: req.file.filename,
			originalFilename: req.file.originalname,
			fileSize: req.file.size,
			mimeType: req.file.mimetype,
			verified: false,
		});

		res.status(Constants.HTTP_STATUS.CREATED).json({
			success: true,
			data: evidence,
			message: 'প্রমাণ সফলভাবে আপলোড হয়েছে',
		});
	} catch (err) {
		next(err);
	}
};

/**
 * List evidence for a report (PUBLIC)
 */
export const listEvidence = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { reportId } = req.params;

		const evidence = await Evidence.find({ reportId })
			.sort({ createdAt: -1 })
			.lean();

		res.json({
			success: true,
			data: evidence,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Verify evidence (ADMIN/MODERATOR)
 */
export const verifyEvidence = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;
		const { verified } = req.body;

		const evidence = await Evidence.findById(id);
		if (!evidence) {
			throw new ApiError(
				Constants.HTTP_STATUS.NOT_FOUND,
				'Evidence not found'
			);
		}

		evidence.verified = verified;
		evidence.verifiedBy = authReq.user!.id as any;
		evidence.verifiedAt = new Date();

		await evidence.save();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'evidence:verify',
			targetType: 'evidence',
			targetId: evidence._id.toString(),
			details: { verified, reportId: evidence.reportId },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			data: evidence,
		});
	} catch (err) {
		next(err);
	}
};

/**
 * Delete evidence (ADMIN only)
 */
export const deleteEvidence = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authReq = req as AuthRequest;
		const { id } = req.params;

		const evidence = await Evidence.findById(id);
		if (!evidence) {
			throw new ApiError(
				Constants.HTTP_STATUS.NOT_FOUND,
				'Evidence not found'
			);
		}

		// Delete file from disk
		const fs = require('fs');
		const filePath = path.join(process.cwd(), 'uploads', evidence.filename);
		if (fs.existsSync(filePath)) {
			fs.unlinkSync(filePath);
		}

		await evidence.deleteOne();

		// Audit log
		await AuditLog.create({
			userId: authReq.user!.id,
			action: 'evidence:delete',
			targetType: 'evidence',
			targetId: id,
			details: { filename: evidence.filename, reportId: evidence.reportId },
			ipAddress: req.ip,
			userAgent: req.get('user-agent'),
		});

		res.json({
			success: true,
			message: 'Evidence deleted successfully',
		});
	} catch (err) {
		next(err);
	}
};

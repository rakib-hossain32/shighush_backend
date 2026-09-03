import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '@/utils/ApiError';
import { Constants } from '@/config/constants';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadsDir);
	},
	filename: (_req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		cb(null, `evidence-${uniqueSuffix}${ext}`);
	},
});

// File filter - allow specific types
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
	const allowedTypes = [
		// Images
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		// Documents
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		// Audio
		'audio/mpeg',
		'audio/wav',
		'audio/ogg',
		// Video
		'video/mp4',
		'video/mpeg',
		'video/webm',
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new ApiError(
				Constants.HTTP_STATUS.BAD_REQUEST,
				`File type not allowed: ${file.mimetype}`
			) as any
		);
	}
};

// Create multer instance
export const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
});

// Helper to get file type from mimetype
export const getFileType = (mimetype: string): 'document' | 'image' | 'audio' | 'video' => {
	if (mimetype.startsWith('image/')) return 'image';
	if (mimetype.startsWith('audio/')) return 'audio';
	if (mimetype.startsWith('video/')) return 'video';
	return 'document';
};

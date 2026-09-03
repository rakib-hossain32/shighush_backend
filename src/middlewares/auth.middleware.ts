import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import config from '@/config/environment';

export interface AuthRequest extends Request {
	user?: {
		id: string;
		role: 'Admin' | 'Moderator';
	};
}

export const authenticate = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new ApiError(
				Constants.HTTP_STATUS.UNAUTHORIZED,
				'No token provided'
			);
		}

		const token = authHeader.split(' ')[1];
		const jwtSecret = process.env.JWT_SECRET || config.env;

		const decoded = jwt.verify(token, jwtSecret) as {
			id: string;
			role: 'Admin' | 'Moderator';
		};

		(req as AuthRequest).user = decoded;
		next();
	} catch (err) {
		if (err instanceof jwt.JsonWebTokenError) {
			return next(
				new ApiError(Constants.HTTP_STATUS.UNAUTHORIZED, 'Invalid token')
			);
		}
		next(err);
	}
};

type Capability =
	| 'report:review'
	| 'report:redact'
	| 'report:publish'
	| 'report:remove'
	| 'flag:handle'
	| 'appeal:handle'
	| 'institution:read'
	| 'institution:write'
	| 'person:read'
	| 'person:write'
	| 'user:read'
	| 'user:write'
	| 'audit:read'
	| 'settings:write';

const MODERATOR_CAPABILITIES: Capability[] = [
	'report:review',
	'report:redact',
	'report:publish',
	'flag:handle',
	'appeal:handle',
	'institution:read',
	'person:read',
];

const ADMIN_CAPABILITIES: Capability[] = [
	'report:review',
	'report:redact',
	'report:publish',
	'report:remove',
	'flag:handle',
	'appeal:handle',
	'institution:read',
	'institution:write',
	'person:read',
	'person:write',
	'user:read',
	'user:write',
	'audit:read',
	'settings:write',
];

function can(role: 'Admin' | 'Moderator', capability: Capability): boolean {
	const capabilities = role === 'Admin' ? ADMIN_CAPABILITIES : MODERATOR_CAPABILITIES;
	return capabilities.includes(capability);
}

export const authorize = (...capabilities: Capability[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const authReq = req as AuthRequest;
		if (!authReq.user) {
			return next(
				new ApiError(
					Constants.HTTP_STATUS.UNAUTHORIZED,
					'Authentication required'
				)
			);
		}

		const hasPermission = capabilities.every((cap) =>
			can(authReq.user!.role, cap)
		);

		if (!hasPermission) {
			return next(
				new ApiError(
					Constants.HTTP_STATUS.FORBIDDEN,
					'Insufficient permissions'
				)
			);
		}

		next();
	};
};

import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface TokenPayload {
	id: string | Types.ObjectId;
	role: 'Admin' | 'Moderator';
}

export const generateToken = (payload: TokenPayload): string => {
	const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
	const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as any;
	
	return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): TokenPayload => {
	const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
	return jwt.verify(token, secret) as TokenPayload;
};

import { Request, Response, NextFunction } from 'express';
import User from '@/models/user.model';
import { Constants } from '@/config/constants';
import ApiError from '@/utils/ApiError';
import { generateToken } from '@/utils/auth.utils';
import { z } from 'zod';

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1, 'Password is required'),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const result = loginSchema.safeParse(req.body);
		if (!result.success) {
			throw new ApiError(Constants.HTTP_STATUS.BAD_REQUEST, 'Invalid input');
		}

		const { email, password } = result.data;

		// Find user and explicitly select password since it's select: false
		const user = await User.findOne({ email }).select('+password');
		if (!user) {
			throw new ApiError(Constants.HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			throw new ApiError(Constants.HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
		}

		const token = generateToken({
			id: user._id.toString(),
			role: user.role,
		});

		res.status(Constants.HTTP_STATUS.OK).json({
			success: true,
			data: {
				user: {
					id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
				token,
			},
		});
	} catch (err) {
		next(err);
	}
};

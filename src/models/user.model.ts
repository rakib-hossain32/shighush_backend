import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
	name: string;
	email: string;
	password?: string; // Optional because select: false might omit it
	role: 'Admin' | 'Moderator';
	createdAt: Date;
	updatedAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
	{
		name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		password: { type: String, required: true, select: false },
		role: { type: String, enum: ['Admin', 'Moderator'], required: true },
	},
	{ timestamps: true },
);

// Pre-save hook to hash password before saving
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password as string, salt);
		next();
	} catch (err) {
		next(err as Error);
	}
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword: string) {
	if (!this.password) return false;
	return await bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser>('User', userSchema);
export default User;

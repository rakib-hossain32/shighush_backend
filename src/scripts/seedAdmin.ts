import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model'; // Adjust path based on execution location

// Load env vars
dotenv.config();

const seedAdmin = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shighush');
		console.log('MongoDB Connected for seeding');

		// Check if any admin exists
		const adminExists = await User.findOne({ role: 'Admin' });
		
		if (adminExists) {
			console.log('An Admin user already exists. Seeding skipped.');
			process.exit(0);
		}

		// Create default admin
		const admin = new User({
			name: 'Super Admin',
			email: 'admin@shighush.org',
			password: 'password123', // Remember to change this after first login
			role: 'Admin',
		});

		await admin.save();
		console.log('Default Admin user created successfully.');
		console.log('Email: admin@shighush.org');
		console.log('Password: password123');

		process.exit(0);
	} catch (error) {
		console.error('Error seeding admin user:', error);
		process.exit(1);
	}
};

seedAdmin();

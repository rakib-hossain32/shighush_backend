import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.model';
import Institution from '../models/institution.model';
import Report from '../models/report.model';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedData = async () => {
	try {
		// Connect to MongoDB
		const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shighush';
		await mongoose.connect(mongoUri);
		console.log('✅ Connected to MongoDB');

		// Clear existing data
		console.log('🗑️  Clearing existing data...');
		await User.deleteMany({});
		await Institution.deleteMany({});
		await Report.deleteMany({});

		// Create Admin user
		console.log('👤 Creating admin user...');
		const admin = await User.create({
			name: 'রাকিব হোসেন',
			email: 'admin@shighush.org',
			password: 'Admin@123', // Will be hashed by pre-save hook
			role: 'Admin',
		});
		console.log(`✅ Admin created: ${admin.email}`);

		// Create Moderator user
		console.log('👤 Creating moderator user...');
		const moderator = await User.create({
			name: 'সাকিব আহমেদ',
			email: 'moderator@shighush.org',
			password: 'Moderator@123', // Will be hashed by pre-save hook
			role: 'Moderator',
		});
		console.log(`✅ Moderator created: ${moderator.email}`);

		// Create Institutions
		console.log('🏢 Creating institutions...');
		const institutions = await Institution.insertMany([
			{
				slug: 'shibchar-upazila-parishad',
				nameBn: 'শিবচর উপজেলা পরিষদ',
				nameEn: 'Shibchar Upazila Parishad',
				category: 'local_government',
				type: 'upazila',
				area: 'shibchar-sadar',
				address: 'শিবচর সদর, মাদারীপুর',
				description: 'শিবচর উপজেলা পরিষদের প্রশাসনিক অফিস',
				reportCount: 0,
				verifiedReportCount: 0,
			},
			{
				slug: 'shibchar-health-complex',
				nameBn: 'শিবচর উপজেলা স্বাস্থ্য কমপ্লেক্স',
				nameEn: 'Shibchar Upazila Health Complex',
				category: 'health',
				type: 'hospital',
				area: 'shibchar-sadar',
				address: 'শিবচর সদর, মাদারীপুর',
				description: 'শিবচর উপজেলার প্রধান স্বাস্থ্য সেবা কেন্দ্র',
				reportCount: 0,
				verifiedReportCount: 0,
			},
			{
				slug: 'shibchar-land-office',
				nameBn: 'সহকারী কমিশনার (ভূমি) অফিস, শিবচর',
				nameEn: 'Assistant Commissioner (Land) Office, Shibchar',
				category: 'land_administration',
				type: 'ac_land_office',
				area: 'shibchar-sadar',
				address: 'শিবচর সদর, মাদারীপুর',
				description: 'শিবচর উপজেলা ভূমি প্রশাসন অফিস',
				reportCount: 0,
				verifiedReportCount: 0,
			},
			{
				slug: 'shibchar-police-station',
				nameBn: 'শিবচর থানা',
				nameEn: 'Shibchar Police Station',
				category: 'law_enforcement',
				type: 'police_station',
				area: 'shibchar-sadar',
				address: 'শিবচর সদর, মাদারীপুর',
				description: 'শিবচর থানা - আইন-শৃঙ্খলা রক্ষায় নিয়োজিত',
				reportCount: 0,
				verifiedReportCount: 0,
			},
			{
				slug: 'shibchar-municipality',
				nameBn: 'শিবচর পৌরসভা',
				nameEn: 'Shibchar Municipality',
				category: 'local_government',
				type: 'municipality',
				area: 'shibchar-sadar',
				address: 'শিবচর পৌরসভা, মাদারীপুর',
				description: 'শিবচর পৌরসভা প্রশাসন - নাগরিক সেবা প্রদান',
				reportCount: 0,
				verifiedReportCount: 0,
			},
			{
				slug: 'bandarkhola-union-parishad',
				nameBn: 'বন্দরখোলা ইউনিয়ন পরিষদ',
				nameEn: 'Bandarkhola Union Parishad',
				category: 'local_government',
				type: 'union_parishad',
				area: 'bandarkhola',
				address: 'বন্দরখোলা, শিবচর, মাদারীপুর',
				description: 'বন্দরখোলা ইউনিয়ন পরিষদ অফিস',
				reportCount: 0,
				verifiedReportCount: 0,
			},
		]);
		console.log(`✅ Created ${institutions.length} institutions`);

		// Create sample Reports with variety of statuses and PII
		console.log('📄 Creating sample reports...');
		const now = new Date();
		const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
		const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
		const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

		const reports = await Report.insertMany([
			// Report 1: Published with verification
			{
				caseId: 'SHI-0001',
				category: 'bribery',
				institutionId: institutions[0]._id,
				institutionName: institutions[0].nameBn,
				area: 'shibchar-sadar',
				officeName: 'শিবচর উপজেলা পরিষদ',
				narrative: 'ট্রেড লাইসেন্স নবায়নের জন্য নির্ধারিত ফি ৫০০ টাকা হলেও কর্মকর্তা ২০০০ টাকা দাবি করেছেন। তিনি বলেছেন এটা না দিলে ফাইল আটকে থাকবে।',
				incidentDate: tenDaysAgo,
				incidentDatePrecision: 'exact',
				moneyAmount: 2000,
				moneyType: 'requested',
				officialFee: 500,
				accusedDesignation: 'সহকারী কর্মকর্তা',
				serviceName: 'ট্রেড লাইসেন্স নবায়ন',
				status: 'published',
				verificationLevel: 'evidence_attached',
				publishedAt: sevenDaysAgo,
				reviewedBy: moderator._id,
				piiFindings: [],
				enableAnonymousInbox: true,
			},

			// Report 2: Under review with PII findings
			{
				caseId: 'SHI-0002',
				category: 'service_denial',
				institutionId: institutions[1]._id,
				institutionName: institutions[1].nameBn,
				area: 'shibchar-sadar',
				officeName: 'শিবচর স্বাস্থ্য কমপ্লেক্স',
				narrative: 'জরুরি বিভাগে রোগী নিয়ে গেলেও ডাক্তার দেখতে ৩ঘন্টা অপেক্ষা করতে হয়েছে। রোগীর নাম মোঃ রহিম উদ্দিন, NID: 1234567890123। তার মোবাইল নাম্বার 01712345678।',
				incidentDate: fiveDaysAgo,
				incidentDatePrecision: 'exact',
				accusedDesignation: 'চিকিৎসক',
				status: 'under_review',
				verificationLevel: 'unverified',
				reviewedBy: moderator._id,
				piiFindings: ['MOBILE_NUMBER', 'NID', 'PERSON_NAME'],
				enableAnonymousInbox: false,
			},

			// Report 3: Received (pending review) with PII
			{
				caseId: 'SHI-0003',
				category: 'extortion',
				institutionId: institutions[2]._id,
				institutionName: institutions[2].nameBn,
				area: 'shibchar-sadar',
				officeName: 'সহকারী কমিশনার (ভূমি) অফিস',
				narrative: 'জমির দলিল সংশোধনের জন্য স্বাভাবিক ফি ছাড়াও অতিরিক্ত ৫০০০ টাকা চাওয়া হয়েছে। আমার নাম শাহিদুল ইসলাম, ফোন: 01812345678। দলিল নম্বর BS-4567।',
				incidentDate: threeDaysAgo,
				incidentDatePrecision: 'approximate',
				moneyAmount: 5000,
				moneyType: 'requested',
				accusedDesignation: 'সার্ভেয়ার',
				serviceName: 'দলিল সংশোধন',
				status: 'received',
				verificationLevel: 'unverified',
				piiFindings: ['MOBILE_NUMBER', 'PERSON_NAME'],
				enableAnonymousInbox: true,
			},

			// Report 4: Published - harassment case
			{
				caseId: 'SHI-0004',
				category: 'harassment',
				institutionId: institutions[3]._id,
				institutionName: institutions[3].nameBn,
				area: 'shibchar-sadar',
				officeName: 'শিবচর থানা',
				narrative: 'থানায় সাধারণ ডায়েরি করতে গিয়ে কর্মকর্তার অসৌজন্যমূলক আচরণের শিকার হয়েছি। কোনো সাহায্য না করেই বিরক্ত করা হয়েছে।',
				incidentDate: sevenDaysAgo,
				incidentDatePrecision: 'exact',
				accusedDesignation: 'অফিসার-ইন-চার্জ (ওসি)',
				serviceName: 'সাধারণ ডায়েরি',
				status: 'published',
				verificationLevel: 'corroborated',
				publishedAt: fiveDaysAgo,
				reviewedBy: admin._id,
				piiFindings: [],
				enableAnonymousInbox: false,
			},

			// Report 5: Awaiting redaction with multiple PII
			{
				caseId: 'SHI-0005',
				category: 'abuse_of_power',
				institutionId: institutions[4]._id,
				institutionName: institutions[4].nameBn,
				area: 'shibchar-sadar',
				officeName: 'শিবচর পৌরসভা',
				narrative: 'ট্রেড লাইসেন্সের জন্য আবেদন করেছিলাম। পৌর কর্মকর্তা করিম সাহেব (মোবাইল: 01912345678, NID: 9876543210987) আমার কাছে ১০,০০০ টাকা চেয়েছেন। তিনি বলেছেন না দিলে লাইসেন্স হবে না। আমার email: test@example.com।',
				incidentDate: threeDaysAgo,
				incidentDatePrecision: 'exact',
				moneyAmount: 10000,
				moneyType: 'requested',
				accusedName: 'করিম সাহেব',
				accusedDesignation: 'পৌর কর্মকর্তা',
				serviceName: 'ট্রেড লাইসেন্স',
				status: 'awaiting_redaction',
				verificationLevel: 'unverified',
				reviewedBy: moderator._id,
				piiFindings: ['MOBILE_NUMBER', 'NID', 'PERSON_NAME', 'EMAIL'],
				enableAnonymousInbox: true,
			},

			// Report 6: Under review - simple case
			{
				caseId: 'SHI-0006',
				category: 'fraud',
				institutionId: institutions[5]._id,
				institutionName: institutions[5].nameBn,
				area: 'bandarkhola',
				officeName: 'বন্দরখোলা ইউনিয়ন পরিষদ',
				narrative: 'ভিজিডি কার্ডের জন্য আবেদন করেছিলাম কিন্তু মেম্বার সাহেব বলেছেন ৩০০০ টাকা দিতে হবে। এটা একটা সরকারি সহায়তা প্রোগ্রাম, এখানে টাকা লাগার কথা নয়।',
				incidentDate: fiveDaysAgo,
				incidentDatePrecision: 'month_only',
				moneyAmount: 3000,
				moneyType: 'requested',
				accusedDesignation: 'ইউনিয়ন পরিষদ মেম্বার',
				serviceName: 'ভিজিডি কার্ড',
				status: 'under_review',
				verificationLevel: 'unverified',
				reviewedBy: moderator._id,
				piiFindings: [],
				enableAnonymousInbox: true,
			},

			// Report 7: Received with PII
			{
				caseId: 'SHI-0007',
				category: 'procurement_irregularity',
				institutionId: institutions[0]._id,
				institutionName: institutions[0].nameBn,
				area: 'shibchar-sadar',
				officeName: 'শিবচর উপজেলা পরিষদ',
				narrative: 'রাস্তা নির্মাণের টেন্ডারে অনিয়ম হয়েছে। ঠিকাদার মনির হোসেন (NID: 1122334455667) কম মূল্য দিয়েও টেন্ডার পাননি। তার যোগাযোগ: 01611223344।',
				incidentDate: now,
				incidentDatePrecision: 'exact',
				serviceName: 'রাস্তা নির্মাণ টেন্ডার',
				status: 'received',
				verificationLevel: 'unverified',
				piiFindings: ['PERSON_NAME', 'NID', 'MOBILE_NUMBER'],
				enableAnonymousInbox: false,
			},

			// Report 8: Published - old case
			{
				caseId: 'SHI-0008',
				category: 'bribery',
				institutionId: institutions[1]._id,
				institutionName: institutions[1].nameBn,
				area: 'shibchar-sadar',
				officeName: 'শিবচর স্বাস্থ্য কমপ্লেক্স',
				narrative: 'ঔষধ কিনতে নির্দেশনা দেওয়ার জন্য নার্স ১০০ টাকা নিয়েছেন। এটা সরকারি হাসপাতাল, এখানে কোনো সেবার জন্য টাকা নেওয়া উচিত নয়।',
				incidentDate: fifteenDaysAgo,
				incidentDatePrecision: 'approximate',
				moneyAmount: 100,
				moneyType: 'paid',
				accusedDesignation: 'নার্স',
				serviceName: 'চিকিৎসা সেবা',
				status: 'published',
				verificationLevel: 'evidence_attached',
				publishedAt: tenDaysAgo,
				reviewedBy: admin._id,
				piiFindings: [],
				enableAnonymousInbox: false,
			},
		]);
		console.log(`✅ Created ${reports.length} sample reports`);

		// Update institution report counts
		console.log('📊 Updating institution metrics...');
		for (const institution of institutions) {
			const count = await Report.countDocuments({ institutionId: institution._id });
			const verifiedCount = await Report.countDocuments({ 
				institutionId: institution._id, 
				verificationLevel: { $in: ['evidence_attached', 'corroborated', 'official_record'] }
			});
			institution.reportCount = count;
			institution.verifiedReportCount = verifiedCount;
			await institution.save();
		}
		console.log('✅ Institution metrics updated');

		console.log('\n✅ Seed completed successfully!');
		console.log('\n📋 Login Credentials:');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('👤 Admin:');
		console.log('   Email: admin@shighush.org');
		console.log('   Password: Admin@123');
		console.log('   Role: Admin');
		console.log('\n👤 Moderator:');
		console.log('   Email: moderator@shighush.org');
		console.log('   Password: Moderator@123');
		console.log('   Role: Moderator');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		console.log('\n📊 Data Summary:');
		console.log(`   ${institutions.length} Institutions created`);
		console.log(`   ${reports.length} Reports created`);
		console.log(`   - ${reports.filter(r => r.status === 'published').length} Published`);
		console.log(`   - ${reports.filter(r => r.status === 'under_review').length} Under Review`);
		console.log(`   - ${reports.filter(r => r.status === 'received').length} Received (Pending)`);
		console.log(`   - ${reports.filter(r => r.status === 'awaiting_redaction').length} Awaiting Redaction`);
		console.log(`   - ${reports.filter(r => r.piiFindings.length > 0).length} Reports with PII findings`);
		console.log('\n🚀 You can now start the server and login!');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

		process.exit(0);
	} catch (error) {
		console.error('❌ Seed failed:', error);
		process.exit(1);
	}
};

seedData();

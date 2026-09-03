import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
}

export class EmailService {
	private fromEmail = process.env.FROM_EMAIL || 'noreply@shighush.com';

	/**
	 * Send email
	 */
	async sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
		try {
			if (!process.env.RESEND_API_KEY) {
				console.warn('Resend API key not configured. Email not sent.');
				return false;
			}

			const { data, error } = await resend.emails.send({
				from: this.fromEmail,
				to,
				subject,
				html,
			});

			if (error) {
				console.error('Email send error:', error);
				return false;
			}

			console.log('Email sent successfully:', data);
			return true;
		} catch (error) {
			console.error('Email service error:', error);
			return false;
		}
	}

	/**
	 * Send report received confirmation
	 */
	async sendReportReceivedEmail(caseId: string): Promise<boolean> {
		const subject = `রিপোর্ট গৃহীত হয়েছে - ${caseId}`;
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: #2563eb; color: white; padding: 20px; text-align: center; }
					.content { padding: 20px; background: #f9fafb; }
					.footer { padding: 20px; text-align: center; font-size: 14px; color: #666; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>শিঘুষ (Shighush)</h1>
					</div>
					<div class="content">
						<h2>আপনার রিপোর্ট গৃহীত হয়েছে</h2>
						<p>ধন্যবাদ! আপনার রিপোর্টটি সফলভাবে জমা হয়েছে।</p>
						<p><strong>কেস আইডি:</strong> ${caseId}</p>
						<p>আমাদের টিম শীঘ্রই রিপোর্টটি রিভিউ করবে। রিভিউ সম্পন্ন হলে রিপোর্টটি প্রকাশিত হবে।</p>
						<p>আপনার রিপোর্টের স্ট্যাটাস দেখতে এই কেস আইডি ব্যবহার করুন।</p>
					</div>
					<div class="footer">
						<p>&copy; 2026 শিঘুষ (Shighush) - দুর্নীতি ও অনিয়ম রিপোর্টিং প্ল্যাটফর্ম</p>
					</div>
				</div>
			</body>
			</html>
		`;

		// In production, get email from report submission form
		// For now, skip actual sending
		console.log(`Would send report received email for ${caseId}`);
		return true;
	}

	/**
	 * Send appeal received confirmation
	 */
	async sendAppealReceivedEmail(caseId: string): Promise<boolean> {
		const subject = `আপিল গৃহীত হয়েছে - ${caseId}`;
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: #2563eb; color: white; padding: 20px; text-align: center; }
					.content { padding: 20px; background: #f9fafb; }
					.footer { padding: 20px; text-align: center; font-size: 14px; color: #666; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>শিঘুষ (Shighush)</h1>
					</div>
					<div class="content">
						<h2>আপনার আপিল গৃহীত হয়েছে</h2>
						<p>ধন্যবাদ! আপনার আপিলটি সফলভাবে জমা হয়েছে।</p>
						<p><strong>কেস আইডি:</strong> ${caseId}</p>
						<p>আমাদের টিম শীঘ্রই আপিলটি রিভিউ করবে এবং প্রয়োজনীয় পদক্ষেপ নেবে।</p>
					</div>
					<div class="footer">
						<p>&copy; 2026 শিঘুষ (Shighush) - দুর্নীতি ও অনিয়ম রিপোর্টিং প্ল্যাটফর্ম</p>
					</div>
				</div>
			</body>
			</html>
		`;

		console.log(`Would send appeal received email for ${caseId}`);
		return true;
	}

	/**
	 * Notify admin of new report
	 */
	async notifyAdminNewReport(caseId: string, category: string): Promise<boolean> {
		const adminEmail = process.env.ADMIN_EMAIL;
		if (!adminEmail) return false;

		const subject = `নতুন রিপোর্ট - ${caseId}`;
		const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: #dc2626; color: white; padding: 20px; text-align: center; }
					.content { padding: 20px; background: #f9fafb; }
					.button { display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>নতুন রিপোর্ট জমা হয়েছে</h1>
					</div>
					<div class="content">
						<p><strong>কেস আইডি:</strong> ${caseId}</p>
						<p><strong>ক্যাটাগরি:</strong> ${category}</p>
						<p>দয়া করে অ্যাডমিন ড্যাশবোর্ডে গিয়ে রিপোর্টটি রিভিউ করুন।</p>
						<a href="${process.env.FRONTEND_URL}/admin/reports" class="button">ড্যাশবোর্ডে যান</a>
					</div>
				</div>
			</body>
			</html>
		`;

		return this.sendEmail({ to: adminEmail, subject, html });
	}
}

export default new EmailService();

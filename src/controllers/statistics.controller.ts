import { Request, Response, NextFunction } from 'express';
import Report from '@/models/report.model';
import Institution from '@/models/institution.model';
import { Constants } from '@/config/constants';

/**
 * Get statistics overview
 * Public endpoint - aggregates published reports
 */
export const getStatistics = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		// Get query parameters for filtering
		const period = req.query.period as string | undefined; // e.g., '30d', '90d', '1y'

		// Calculate date range based on period
		let startDate: Date | undefined;
		if (period) {
			const now = new Date();
			if (period === '30d') {
				startDate = new Date(now.setDate(now.getDate() - 30));
			} else if (period === '90d') {
				startDate = new Date(now.setDate(now.getDate() - 90));
			} else if (period === '1y') {
				startDate = new Date(now.setFullYear(now.getFullYear() - 1));
			}
		}

		// Base query - only published reports
		const baseQuery: any = { status: 'published' };
		if (startDate) {
			baseQuery.publishedAt = { $gte: startDate };
		}

		// Get total counts
		const totalReports = await Report.countDocuments(baseQuery);
		const totalInstitutions = await Institution.countDocuments();

		const evidenceAttachedReports = await Report.countDocuments({
			...baseQuery,
			evidenceCount: { $gt: 0 },
		});

		// Get total reported amount
		const amountAggregation = await Report.aggregate([
			{ $match: baseQuery },
			{ $match: { 'money.amount': { $exists: true, $ne: null } } },
			{
				$group: {
					_id: null,
					total: { $sum: '$money.amount' },
				},
			},
		]);
		const reportedAmountBdt = amountAggregation[0]?.total || 0;

		// Get reports by category
		const byCategory = await Report.aggregate([
			{ $match: baseQuery },
			{
				$group: {
					_id: '$category',
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					category: '$_id',
					count: 1,
				},
			},
			{ $sort: { count: -1 } },
		]);

		// Get reports by verification level
		const byVerification = await Report.aggregate([
			{ $match: baseQuery },
			{
				$group: {
					_id: '$verificationLevel',
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					level: '$_id',
					count: 1,
				},
			},
			{ $sort: { count: -1 } },
		]);

		// Get reports by area with top category
		const byArea = await Report.aggregate([
			{ $match: baseQuery },
			{
				$group: {
					_id: '$location.area',
					count: { $sum: 1 },
					categories: { $push: '$category' },
				},
			},
			{
				$project: {
					_id: 0,
					area: '$_id',
					count: 1,
					topCategory: { $arrayElemAt: ['$categories', 0] },
				},
			},
			{ $sort: { count: -1 } },
		]);

		// Get trend data (last 6 months, grouped by month)
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const trend = await Report.aggregate([
			{
				$match: {
					status: 'published',
					publishedAt: { $gte: sixMonthsAgo },
				},
			},
			{
				$group: {
					_id: {
						year: { $year: '$publishedAt' },
						month: { $month: '$publishedAt' },
					},
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					_id: 0,
					period: {
						$concat: [
							{ $toString: '$_id.year' },
							'-',
							{
								$cond: {
									if: { $lt: ['$_id.month', 10] },
									then: {
										$concat: [
											'0',
											{ $toString: '$_id.month' },
										],
									},
									else: { $toString: '$_id.month' },
								},
							},
						],
					},
					count: 1,
				},
			},
			{ $sort: { period: 1 } },
		]);

		// Build response
		const statistics = {
			totals: {
				reports: totalReports,
				institutions: totalInstitutions,
				evidenceAttachedReports,
				reportedAmountBdt,
			},
			byCategory,
			byVerification,
			byArea,
			trend,
			generatedAt: new Date().toISOString(),
			period: period || 'all',
		};

		res.status(Constants.HTTP_STATUS.OK).json({
			success: true,
			data: statistics,
			message: 'পরিসংখ্যান সফলভাবে পাওয়া গেছে',
		});
	} catch (error) {
		next(error);
	}
};

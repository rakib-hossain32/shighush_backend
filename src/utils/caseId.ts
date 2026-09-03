/**
 * Generate unique case ID in Bengali format: শি-০০৪২
 */
export function generateCaseId(count: number): string {
	const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
	const paddedCount = count.toString().padStart(4, '0');
	const bengaliNumber = paddedCount
		.split('')
		.map((digit) => bengaliDigits[parseInt(digit)])
		.join('');
	return `শি-${bengaliNumber}`;
}

/**
 * Parse case ID to get numeric count
 */
export function parseCaseId(caseId: string): number {
	const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
	const match = caseId.match(/শি-([০-৯]+)/);
	if (!match) return 0;

	const bengaliNumber = match[1];
	const arabicNumber = bengaliNumber
		.split('')
		.map((digit) => bengaliDigits.indexOf(digit).toString())
		.join('');
	
	return parseInt(arabicNumber, 10);
}

/**
 * PII Detection for Bengali text (matching frontend implementation)
 */

export type PiiKind = 
	| 'phone'
	| 'email'
	| 'nid'
	| 'birth_registration'
	| 'tin'
	| 'bank_or_card'
	| 'url';

export interface PiiFinding {
	kind: PiiKind;
	label: string;
	match: string;
	start: number;
	end: number;
	severity: 'high' | 'medium';
}

const PII_PATTERNS = [
	{
		kind: 'email' as PiiKind,
		pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/g,
		label: 'ইমেইল ঠিকানা',
		severity: 'high' as const,
	},
	{
		kind: 'phone' as PiiKind,
		pattern: /(?:\+?880[\s-]?|\b0)1[3-9][\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/g,
		label: 'মোবাইল নম্বর',
		severity: 'high' as const,
	},
	{
		kind: 'birth_registration' as PiiKind,
		pattern: /\b\d{17}\b/g,
		label: 'জন্মনিবন্ধন নম্বর',
		severity: 'high' as const,
	},
	{
		kind: 'nid' as PiiKind,
		pattern: /\b(?:\d{10}|\d{13})\b/g,
		label: 'জাতীয় পরিচয়পত্র (NID) নম্বর',
		severity: 'high' as const,
	},
	{
		kind: 'tin' as PiiKind,
		pattern: /\b\d{12}\b/g,
		label: 'TIN নম্বর',
		severity: 'high' as const,
	},
	{
		kind: 'bank_or_card' as PiiKind,
		pattern: /\b(?:\d[\s-]?){14,19}\b/g,
		label: 'ব্যাংক অ্যাকাউন্ট বা কার্ড নম্বর',
		severity: 'high' as const,
	},
	{
		kind: 'url' as PiiKind,
		pattern: /\bhttps?:\/\/\S+/gi,
		label: 'লিংক',
		severity: 'medium' as const,
	},
];

export function detectPii(text: string | null | undefined): PiiFinding[] {
	if (!text) return [];

	// Normalize Bengali digits to ASCII
	const normalised = text.replace(/[০-৯]/g, (d) =>
		String('০১২৩৪৫৬৭৮৯'.indexOf(d))
	);

	const findings: PiiFinding[] = [];
	const claimed: Array<[number, number]> = [];

	const overlaps = (start: number, end: number) =>
		claimed.some(([s, e]) => start < e && end > s);

	for (const rule of PII_PATTERNS) {
		const pattern = new RegExp(rule.pattern.source, rule.pattern.flags);
		let match: RegExpExecArray | null;

		while ((match = pattern.exec(normalised)) !== null) {
			const raw = match[0];
			const start = match.index;
			const end = start + raw.length;

			if (raw.length === 0) {
				pattern.lastIndex += 1;
				continue;
			}
			if (overlaps(start, end)) continue;

			claimed.push([start, end]);
			findings.push({
				kind: rule.kind,
				label: rule.label,
				match: text.slice(start, end),
				start,
				end,
				severity: rule.severity,
			});
		}
	}

	return findings.sort((a, b) => a.start - b.start);
}

export function hasBlockingPii(text: string | null | undefined): boolean {
	return detectPii(text).some((f) => f.severity === 'high');
}

export function summarisePii(findings: PiiFinding[]): string[] {
	return [...new Set(findings.map((f) => f.label))];
}

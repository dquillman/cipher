export type ExplanationBlock =
    | { type: 'lens'; text: string }
    | { type: 'conflict'; paragraphs: string[] }
    | { type: 'pattern'; text: string }
    | { type: 'note'; text: string }
    | { type: 'text'; text: string };

// Matches any "Exam Lens:" / "PMI Decision Lens:" / "SHRM Lens:" / "CompTIA Lens:" etc.
const LENS_PATTERN = /^(?:\w[\w\s&+-]*\s)?(?:Decision\s)?Lens:/i;
const CONFLICT_PATTERN = /^Why this (?:conflicts|is tricky|is wrong|matters):/i;

const SECTION_PATTERNS = [LENS_PATTERN, CONFLICT_PATTERN, /^Pattern:/i, /^Note:/i, /^Key (?:Concept|Insight|Rule|Takeaway):/i, /^Tip:/i];

function matchesAnySection(text: string): boolean {
    return SECTION_PATTERNS.some(rx => rx.test(text));
}

function stripPrefix(text: string, pattern: RegExp): string {
    return text.replace(pattern, '').trim();
}

export function parseExplanation(raw: string): ExplanationBlock[] {
    const paragraphs = raw.split('\n\n').filter(p => p.trim().length > 0);
    const blocks: ExplanationBlock[] = [];

    for (const p of paragraphs) {
        if (CONFLICT_PATTERN.test(p)) {
            blocks.push({ type: 'conflict', paragraphs: [stripPrefix(p, CONFLICT_PATTERN)] });
        } else if (
            blocks.length > 0 &&
            blocks.at(-1)?.type === 'conflict' &&
            !matchesAnySection(p)
        ) {
            (blocks.at(-1) as { type: 'conflict'; paragraphs: string[] }).paragraphs.push(p);
        } else if (LENS_PATTERN.test(p)) {
            blocks.push({ type: 'lens', text: p });
        } else if (/^Pattern:/i.test(p)) {
            blocks.push({ type: 'pattern', text: stripPrefix(p, /^Pattern:/i) });
        } else if (/^(?:Key (?:Concept|Insight|Rule|Takeaway)|Tip):/i.test(p)) {
            blocks.push({ type: 'pattern', text: stripPrefix(p, /^(?:Key (?:Concept|Insight|Rule|Takeaway)|Tip):/i) });
        } else if (/^Note:/i.test(p)) {
            blocks.push({ type: 'note', text: stripPrefix(p, /^Note:/i) });
        } else {
            blocks.push({ type: 'text', text: p });
        }
    }

    return blocks;
}

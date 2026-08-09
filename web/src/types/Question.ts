import type { PBQConfig } from '../components/PBQQuestion';
import type { BloomLevel } from './Bloom';
import type { QuestionType } from '../config/exams';

export type { QuestionType };

export interface MatchPairData {
    term: string;
    definition: string;
}

/** A clickable region on a `hotspot` (ECO "Point and Click") question image.
 *  Geometry is expressed in percentages of the image's rendered box so it
 *  stays correct at any display size. */
export interface HotspotRegion {
    id: string;
    /** Left edge, 0-100 as a percentage of image width. */
    x: number;
    /** Top edge, 0-100 as a percentage of image height. */
    y: number;
    /** Width, 0-100 as a percentage of image width. */
    width: number;
    /** Height, 0-100 as a percentage of image height. */
    height: number;
    /** True if clicking this region is (part of) the right answer. */
    correct: boolean;
    /** Optional label shown in review/explanation. */
    label?: string;
}

export interface Question {
    id: string;
    stem: string;
    options?: string[];
    correctAnswer?: number;
    explanation: string;
    domain: string;
    examId?: string;
    imageUrl?: string; // New field for AI image
    difficulty?: number; // 1-10
    bloomLevel?: BloomLevel; // Bloom's Taxonomy cognitive level
    /** Question format. Union lives in config/exams.ts — single source of truth. */
    type?: QuestionType;
    scenarios?: {
        label: string;
        probability: number;
        impact: number;
    }[];
    correctLabel?: string;
    matchPairs?: MatchPairData[]; // EC-119: drag-and-drop matching pairs
    pbqConfig?: PBQConfig;        // PBQ: performance-based question config

    // ─── July 2026 PMP ECO question types (all optional/additive) ───

    /** `case-study`: id of the shared stimulus (scenario text, charts, exhibits)
     *  that several consecutive questions all refer to. Questions sharing a
     *  stimulusId form one case set and should be presented together. */
    stimulusId?: string;
    /** `case-study`: 1-based position of this question inside its case set. */
    stimulusOrder?: number;

    /** `multi-response`: indices into `options` that are all correct.
     *  Present instead of `correctAnswer` for multi-select items. */
    correctAnswers?: number[];
    /** `multi-response`: how many options the candidate must pick.
     *  Defaults to `correctAnswers.length` when omitted. */
    selectCount?: number;

    /** `graphic` / `enhanced-matching`: alt text for the referenced visual.
     *  Required for accessibility whenever the image carries the question. */
    imageAlt?: string;

    /** `hotspot`: clickable regions over `imageUrl`. */
    hotspots?: HotspotRegion[];
    /** `hotspot`: how many regions the candidate must click.
     *  Defaults to the number of `hotspots` marked `correct`. */
    hotspotSelectCount?: number;
}

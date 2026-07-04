import type { PBQConfig } from '../components/PBQQuestion';
import type { BloomLevel } from './Bloom';

export interface MatchPairData {
    term: string;
    definition: string;
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
    type?: 'mcq' | 'emv' | 'matching' | 'pbq';
    scenarios?: {
        label: string;
        probability: number;
        impact: number;
    }[];
    correctLabel?: string;
    matchPairs?: MatchPairData[]; // EC-119: drag-and-drop matching pairs
    pbqConfig?: PBQConfig;        // PBQ: performance-based question config
}

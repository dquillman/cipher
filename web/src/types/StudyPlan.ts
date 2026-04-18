export interface DailyTask {
    id: string;
    date: Date; // Timestamp in Firestore
    domain: string;
    topic: string;
    activityType: 'reading' | 'quiz' | 'review' | 'mock-exam';
    completed: boolean;
    durationMinutes: number;
}

export interface StudyPlan {
    id?: string;
    userId: string;
    examId: string; // Linked exam
    startDate: Date;
    examDate: Date;
    weeklyHours: number;
    tasks?: DailyTask[]; // Legacy — no longer generated for new plans
    createdAt: Date;
    status: 'active' | 'completed' | 'archived';
    anchorDomain?: string; // diagnostic weakest domain used for plan focus
}

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { APP_VERSION } from '../version';

export interface IssueReportInput {
    userId: string;
    userEmail: string;
    type: 'bug' | 'content' | 'other';
    description: string;
    path: string;
    attachmentUrl: string | null;
    context?: Record<string, string | undefined>;
    examId: string | null;
    examName: string | null;
}

export const IssueReportService = {
    uploadScreenshot: async (userId: string, screenshot: File): Promise<string> => {
        // Lazy getStorage() keeps the storage SDK out of the entry bundle —
        // this service is the only place in the app that uses it.
        const storage = getStorage();
        const filename = `${Date.now()}_${uuidv4()}_${screenshot.name}`;
        const storageRef = ref(storage, `uploads/${userId}/issues/${filename}`);
        await uploadBytes(storageRef, screenshot);
        return getDownloadURL(storageRef);
    },

    submitIssueReport: async (report: IssueReportInput) => {
        const environment = window.location.hostname.includes('staging')
            ? 'staging'
            : 'prod';

        const ua = navigator.userAgent;

        const deviceType = /Mobi|Android/i.test(ua)
            ? 'mobile'
            : /iPad|Tablet/i.test(ua)
            ? 'tablet'
            : 'desktop';

        const os = /Windows/i.test(ua)
            ? 'Windows'
            : /Mac/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)
            ? 'macOS'
            : /iPhone|iPad|iPod/i.test(ua)
            ? 'iOS'
            : /Android/i.test(ua)
            ? 'Android'
            : 'Unknown';

        const browser = /Edg/i.test(ua)
            ? 'Edge'
            : /Chrome/i.test(ua) && !/Edg/i.test(ua)
            ? 'Chrome'
            : /Safari/i.test(ua) && !/Chrome/i.test(ua)
            ? 'Safari'
            : /Firefox/i.test(ua)
            ? 'Firefox'
            : 'Unknown';

        await addDoc(collection(db, 'issues'), {
            userId: report.userId,
            userEmail: report.userEmail,
            type: report.type,
            description: report.description,
            path: report.path,
            timestamp: serverTimestamp(),
            status: 'new',
            version: APP_VERSION,
            attachmentUrl: report.attachmentUrl,
            ...(report.context || {}),
            appVersion: APP_VERSION,
            environment,
            route: report.path,
            examId: report.examId,
            examName: report.examName,
            userAgent: ua,
            submittedFrom: 'exam-coach',
            deviceType,
            os,
            browser,
        });
    },
};

export interface LinkedInProspect {
  id: string;
  name: string;
  linkedinUrl: string;
  exam: 'PMP' | 'CISSP' | 'AWS' | 'CompTIA' | 'Other';
  status: 'identified' | 'engaged' | 'connected' | 'messaged' | 'responded' | 'signed_up';
  notes: string;
  dateAdded: string;
}

export const LINKEDIN_EXAMS: LinkedInProspect['exam'][] = ['PMP', 'CISSP', 'AWS', 'CompTIA', 'Other'];

export const LINKEDIN_STATUSES: LinkedInProspect['status'][] = [
  'identified', 'engaged', 'connected', 'messaged', 'responded', 'signed_up',
];

export const STATUS_LABELS: Record<LinkedInProspect['status'], string> = {
  identified: 'Identified',
  engaged: 'Engaged',
  connected: 'Connected',
  messaged: 'Messaged',
  responded: 'Responded',
  signed_up: 'Signed Up',
};

export const STATUS_VARIANT: Record<LinkedInProspect['status'], 'gray' | 'blue' | 'purple' | 'amber' | 'green' | 'red'> = {
  identified: 'gray',
  engaged: 'blue',
  connected: 'purple',
  messaged: 'amber',
  responded: 'green',
  signed_up: 'green',
};

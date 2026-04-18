export interface First100User {
  id: string;
  source: 'reddit' | 'linkedin_groups' | 'linkedin_outreach' | 'organic' | 'referral' | 'other';
  exam: 'PMP' | 'CISSP' | 'AWS' | 'Other';
  activated: boolean;
  notes: string;
  addedAt: string;
}

export const SOURCE_LABELS: Record<First100User['source'], string> = {
  reddit: 'Reddit',
  linkedin_groups: 'LinkedIn Groups',
  linkedin_outreach: 'LinkedIn Outreach',
  organic: 'Organic',
  referral: 'Referral',
  other: 'Other',
};

export const EXAM_TARGETS: Record<First100User['exam'], number> = {
  PMP: 60,
  CISSP: 20,
  AWS: 10,
  Other: 10,
};

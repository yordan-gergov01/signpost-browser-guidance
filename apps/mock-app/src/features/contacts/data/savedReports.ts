import type { SavedReport } from '@/features/contacts/types/contacts';

export const SAVED_REPORTS: readonly SavedReport[] = [
  { id: 'r1', name: 'Contacts created this quarter', rows: 128 },
  { id: 'r2', name: 'Churn risk by account owner', rows: 41 },
];

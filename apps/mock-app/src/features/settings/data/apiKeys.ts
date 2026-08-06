import type { ApiKey } from '@/features/settings/types/settings';

export const API_KEYS: readonly ApiKey[] = [
  { id: 'k1', label: 'Production', prefix: 'ak_live_9f2c', created: '2026-01-14' },
  { id: 'k2', label: 'Staging', prefix: 'ak_test_41ba', created: '2026-03-02' },
];

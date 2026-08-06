import type { Deal, StageFilter } from '@/features/deals/types/deals';

export const STAGE_FILTERS: readonly StageFilter[] = [
  'All stages',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Closed won',
];

export const DEALS: readonly Deal[] = [
  {
    id: 'd1',
    name: 'Analytical - annual renewal',
    account: 'Analytical',
    stage: 'Negotiation',
    value: 48000,
  },
  {
    id: 'd2',
    name: 'Navy Systems - seat expansion',
    account: 'Navy Systems',
    stage: 'Proposal',
    value: 120000,
  },
  {
    id: 'd3',
    name: 'Bletchley - pilot',
    account: 'Bletchley',
    stage: 'Discovery',
    value: 9000,
  },
  {
    id: 'd4',
    name: 'Orbital - platform migration',
    account: 'Orbital',
    stage: 'Closed won',
    value: 260000,
  },
  {
    id: 'd5',
    name: 'Substitute - trial upgrade',
    account: 'Substitute',
    stage: 'Discovery',
    value: 15000,
  },
];

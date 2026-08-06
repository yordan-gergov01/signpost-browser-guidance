import type { Deal, StageFilter } from '@/features/deals/types/deals';

export function filterByStage(
  deals: readonly Deal[],
  stage: StageFilter,
): readonly Deal[] {
  return stage === 'All stages' ? deals : deals.filter((deal) => deal.stage === stage);
}

export function openPipelineValue(deals: readonly Deal[]): number {
  return deals
    .filter((deal) => deal.stage !== 'Closed won')
    .reduce((total, deal) => total + deal.value, 0);
}

export function openDeals(deals: readonly Deal[]): readonly Deal[] {
  return deals.filter((deal) => deal.stage !== 'Closed won');
}

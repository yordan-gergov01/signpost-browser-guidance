import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { DealsTable } from '@/features/deals/components/DealsTable';
import { DEALS, STAGE_FILTERS } from '@/features/deals/data/deals';
import { filterByStage } from '@/features/deals/utils/dealFilters';
import type { StageFilter } from '@/features/deals/types/deals';

export function DealsPipeline() {
  const [stage, setStage] = useState<StageFilter>('All stages');
  const visible = filterByStage(DEALS, stage);

  return (
    <>
      <h1 className="text-xl font-semibold text-ink-900">Deals</h1>

      <Panel
        title="Pipeline"
        description={`${visible.length} deals`}
        actions={
          <>
            <select
              aria-label="Filter by stage"
              value={stage}
              onChange={(event) => setStage(event.target.value as StageFilter)}
              className="rounded-md border border-ink-300 px-2 py-1.5 text-sm"
            >
              {STAGE_FILTERS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <Button variant="primary" data-testid="new-deal">
              New deal
            </Button>
          </>
        }
      >
        <DealsTable deals={visible} />
      </Panel>
    </>
  );
}

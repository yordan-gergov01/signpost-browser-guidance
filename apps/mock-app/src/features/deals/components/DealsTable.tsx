import { Badge, type BadgeTone } from '@/shared/ui/Badge';
import { formatUsd } from '@/shared/utils/format';
import type { Deal, DealStage } from '@/features/deals/types/deals';

const TONES: Record<DealStage, BadgeTone> = {
  Discovery: 'neutral',
  Proposal: 'info',
  Negotiation: 'info',
  'Closed won': 'success',
};

export function DealsTable({ deals }: { deals: readonly Deal[] }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-500">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold sm:px-5">
              Deal
            </th>
            <th scope="col" className="px-4 py-2 font-semibold sm:px-5">
              Account
            </th>
            <th scope="col" className="px-4 py-2 font-semibold sm:px-5">
              Stage
            </th>
            <th scope="col" className="px-4 py-2 text-right font-semibold sm:px-5">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200">
          {deals.map((deal) => (
            <tr key={deal.id} className="transition hover:bg-ink-50">
              <td className="px-4 py-2.5 font-medium text-ink-900 sm:px-5">
                {deal.name}
              </td>
              <td className="px-4 py-2.5 text-ink-600 sm:px-5">{deal.account}</td>
              <td className="px-4 py-2.5 sm:px-5">
                <Badge tone={TONES[deal.stage]}>{deal.stage}</Badge>
              </td>
              <td className="px-4 py-2.5 text-right font-medium text-ink-800 sm:px-5">
                {formatUsd(deal.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

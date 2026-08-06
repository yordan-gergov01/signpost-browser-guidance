import { Badge } from '@/shared/ui/Badge';
import { formatUsd } from '@/shared/utils/format';
import type { Deal } from '@/features/deals/types/deals';

export function DealsTable({ deals }: { deals: readonly Deal[] }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-wide text-ink-500">
        <tr>
          <th scope="col" className="py-2 font-medium">
            Deal
          </th>
          <th scope="col" className="py-2 font-medium">
            Account
          </th>
          <th scope="col" className="py-2 font-medium">
            Stage
          </th>
          <th scope="col" className="py-2 font-medium">
            Value
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-200">
        {deals.map((deal) => (
          <tr key={deal.id}>
            <td className="py-2 font-medium text-ink-800">{deal.name}</td>
            <td className="py-2 text-ink-600">{deal.account}</td>
            <td className="py-2">
              <Badge>{deal.stage}</Badge>
            </td>
            <td className="py-2 text-ink-600">{formatUsd(deal.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

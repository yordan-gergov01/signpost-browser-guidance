import { CONTACTS } from '@/features/contacts/data/contacts';
import { DEALS } from '@/features/deals/data/deals';
import { openDeals, openPipelineValue } from '@/features/deals/utils/dealFilters';
import { formatUsd } from '@/shared/utils/format';
import type { Stat } from '@/features/dashboard/types/dashboard';

export function buildStats(): Stat[] {
  const activeContacts = CONTACTS.filter((contact) => contact.status === 'Active');

  return [
    { label: 'Open pipeline', value: formatUsd(openPipelineValue(DEALS)) },
    { label: 'Active contacts', value: String(activeContacts.length) },
    { label: 'Deals in flight', value: String(openDeals(DEALS).length) },
  ];
}

import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { INVOICES } from '@/features/settings/data/invoices';

export function BillingPanel() {
  return (
    <>
      <Panel
        title="Plan"
        description="Team - 12 seats"
        actions={<Button data-testid="change-plan">Change plan</Button>}
      >
        <p className="text-sm text-ink-600">
          Billed annually. Next renewal on 1 February 2027.
        </p>
      </Panel>

      <Panel title="Invoices" description="Paid invoices for this workspace">
        <ul className="divide-y divide-ink-200 text-sm">
          {INVOICES.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between py-2">
              <span>
                {invoice.period} · {invoice.total}
              </span>
              {/* Repeated visible label, disambiguated by aria-label. */}
              <Button aria-label={`Download invoice for ${invoice.period}`}>
                Download
              </Button>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

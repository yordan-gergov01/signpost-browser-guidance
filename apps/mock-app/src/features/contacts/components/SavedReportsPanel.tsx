import { Button } from '@/shared/ui/Button';
import { Panel } from '@/shared/ui/Panel';
import { SAVED_REPORTS } from '@/features/contacts/data/savedReports';

export function SavedReportsPanel() {
  return (
    <Panel
      title="Saved reports"
      description="Scheduled exports and shared views"
      actions={
        <>
          {/* Acme's own contextual help. The attribute is the whole integration:
              no Hintora markup, no Hintora styling, their button. */}
          <Button variant="ghost" data-hintora-trigger="export my contacts">
            How do I export?
          </Button>
          <Button data-testid="reports-export">Export</Button>
        </>
      }
    >
      <ul className="divide-y divide-ink-200 text-sm">
        {SAVED_REPORTS.map((report) => (
          <li key={report.id} className="flex items-center justify-between py-2">
            <span>{report.name}</span>
            <span className="text-ink-500">{report.rows} rows</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

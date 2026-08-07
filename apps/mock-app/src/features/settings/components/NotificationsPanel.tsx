import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Panel } from '@/shared/ui/Panel';
import { Toggle } from '@/shared/ui/Toggle';

export function NotificationsPanel() {
  return (
    <>
      <Panel
        title="Notification email"
        description="Where alerts and digests are sent"
        actions={
          <Button variant="primary" data-testid="save-notifications">
            Save preferences
          </Button>
        }
      >
        <Field
          label="Notification email"
          type="email"
          defaultValue="jane@business.test"
          data-testid="notification-email"
          hint="This can differ from your login email."
        />
      </Panel>

      <Panel title="What we send" description="Applies to this workspace only">
        <Toggle
          name="deal-updates"
          label="Deal stage changes"
          description="When a deal you own moves stage."
          defaultChecked
        />
        <Toggle
          name="weekly-digest"
          label="Weekly digest"
          description="A Monday summary of pipeline movement."
          defaultChecked
        />
        <Toggle
          name="product-updates"
          label="Product updates"
          description="Occasional news about new Business features."
        />
      </Panel>
    </>
  );
}

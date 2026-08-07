import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Panel } from '@/shared/ui/Panel';
import { DeleteAccountDialog } from '@/features/settings/components/DeleteAccountDialog';

export function ProfilePanel() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <>
      <Panel
        title="Profile"
        description="How you appear to your teammates"
        actions={
          <Button variant="primary" data-testid="save-profile">
            Save changes
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" defaultValue="Jane Doe" />
          <Field label="Email address" type="email" defaultValue="jane@business.test" />
          <Field label="Job title" defaultValue="Account executive" />
        </div>
      </Panel>

      {/* Target for the action safety classifier: destructive and irreversible,
          with an accessible name that states the consequence. */}
      <Panel
        title="Danger zone"
        description="These actions cannot be undone"
        actions={
          <Button
            variant="danger"
            data-testid="delete-account"
            onClick={() => setConfirmOpen(true)}
          >
            Delete account
          </Button>
        }
      >
        <p className="text-sm text-ink-600">
          Deleting your account removes every contact, deal and report owned by this
          workspace.
        </p>
        {deleted && (
          <p role="status" className="mt-2 text-sm font-medium text-danger-700">
            Account scheduled for deletion.
          </p>
        )}
      </Panel>

      {confirmOpen && (
        <DeleteAccountDialog
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => setDeleted(true)}
        />
      )}
    </>
  );
}

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Dialog } from '@/shared/ui/Dialog';
import { Field } from '@/shared/ui/Field';
import { EMPTY_CONTACT_DRAFT } from '@/features/contacts/hooks/useContactList';
import type { ContactDraft } from '@/features/contacts/types/contacts';

export type AddContactDialogProps = {
  onClose: () => void;
  onSave: (draft: ContactDraft) => void;
};

export function AddContactDialog({ onClose, onSave }: AddContactDialogProps) {
  const [draft, setDraft] = useState<ContactDraft>(EMPTY_CONTACT_DRAFT);

  const submit = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
    onClose();
  };

  return (
    <Dialog
      title="Add contact"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" data-testid="save-contact" onClick={submit}>
            Save contact
          </Button>
        </>
      }
    >
      <Field
        label="Full name"
        value={draft.name}
        onChange={(event) => setDraft({ ...draft, name: event.target.value })}
      />
      <Field
        label="Email"
        type="email"
        value={draft.email}
        onChange={(event) => setDraft({ ...draft, email: event.target.value })}
      />
      <Field
        label="Company"
        value={draft.company}
        onChange={(event) => setDraft({ ...draft, company: event.target.value })}
      />
    </Dialog>
  );
}

import { useState } from 'react';
import { Panel } from '@/shared/ui/Panel';
import { ContactsTable } from '@/features/contacts/components/ContactsTable';
import { ContactsToolbar } from '@/features/contacts/components/ContactsToolbar';
import { AddContactDialog } from '@/features/contacts/components/AddContactDialog';
import { SavedReportsPanel } from '@/features/contacts/components/SavedReportsPanel';
import { useContactList } from '@/features/contacts/hooks/useContactList';

export function ContactsWorkspace() {
  const { contacts, visible, filter, setFilter, addContact } = useContactList();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <h1 className="text-xl font-semibold text-ink-900">Contacts</h1>

      <Panel
        title="All contacts"
        description={`${visible.length} of ${contacts.length} shown`}
        actions={
          <ContactsToolbar
            filter={filter}
            onFilterChange={setFilter}
            onAddContact={() => setAddOpen(true)}
          />
        }
      >
        <ContactsTable contacts={visible} />
      </Panel>

      <SavedReportsPanel />

      {addOpen && (
        <AddContactDialog onClose={() => setAddOpen(false)} onSave={addContact} />
      )}
    </>
  );
}

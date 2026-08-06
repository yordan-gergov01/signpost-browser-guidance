import { useMemo, useState } from 'react';
import { CONTACTS } from '@/features/contacts/data/contacts';
import { filterContacts } from '@/features/contacts/utils/filterContacts';
import type { Contact, ContactDraft } from '@/features/contacts/types/contacts';

export const EMPTY_CONTACT_DRAFT: ContactDraft = { name: '', email: '', company: '' };

export function useContactList() {
  const [contacts, setContacts] = useState<readonly Contact[]>(CONTACTS);
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => filterContacts(contacts, filter), [contacts, filter]);

  const addContact = (draft: ContactDraft) => {
    setContacts((current) => [
      ...current,
      { id: `c${current.length + 1}`, status: 'Lead', ...draft },
    ]);
  };

  return { contacts, visible, filter, setFilter, addContact };
}

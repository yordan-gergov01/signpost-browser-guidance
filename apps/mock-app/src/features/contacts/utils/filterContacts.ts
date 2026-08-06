import type { Contact } from '@/features/contacts/types/contacts';

export function filterContacts(
  contacts: readonly Contact[],
  query: string,
): readonly Contact[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return contacts;

  return contacts.filter((contact) =>
    `${contact.name} ${contact.email} ${contact.company}`.toLowerCase().includes(needle),
  );
}

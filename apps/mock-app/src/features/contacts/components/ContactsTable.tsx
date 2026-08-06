import { Badge } from '@/shared/ui/Badge';
import type { Contact } from '@/features/contacts/types/contacts';

export function ContactsTable({ contacts }: { contacts: readonly Contact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-500">
        No contacts match that filter.
      </p>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-wide text-ink-500">
        <tr>
          <th scope="col" className="py-2 font-medium">
            Name
          </th>
          <th scope="col" className="py-2 font-medium">
            Email
          </th>
          <th scope="col" className="py-2 font-medium">
            Company
          </th>
          <th scope="col" className="py-2 font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-ink-200">
        {contacts.map((contact) => (
          <tr key={contact.id}>
            <td className="py-2 font-medium text-ink-800">{contact.name}</td>
            <td className="py-2 text-ink-600">{contact.email}</td>
            <td className="py-2 text-ink-600">{contact.company}</td>
            <td className="py-2">
              <Badge>{contact.status}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

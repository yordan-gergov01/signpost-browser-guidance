import { Badge, type BadgeTone } from '@/shared/ui/Badge';
import type { Contact, ContactStatus } from '@/features/contacts/types/contacts';

const TONES: Record<ContactStatus, BadgeTone> = {
  Active: 'success',
  Lead: 'info',
  Churned: 'danger',
};

export function ContactsTable({ contacts }: { contacts: readonly Contact[] }) {
  if (contacts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-500">
        No contacts match that filter.
      </p>
    );
  }

  return (
    // Scrolls itself rather than the page: a table wide enough to push the
    // window sideways would drag the spotlight off its target with it.
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <table className="w-full min-w-[34rem] text-left text-sm">
        <thead className="border-b border-ink-200 text-[11px] uppercase tracking-wider text-ink-500">
          <tr>
            <th scope="col" className="px-4 py-2 font-semibold sm:px-5">
              Name
            </th>
            <th scope="col" className="px-4 py-2 font-semibold sm:px-5">
              Email
            </th>
            <th
              scope="col"
              className="hidden px-4 py-2 font-semibold sm:table-cell sm:px-5"
            >
              Company
            </th>
            <th scope="col" className="px-4 py-2 font-semibold sm:px-5">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className="transition hover:bg-ink-50">
              <td className="px-4 py-2.5 font-medium text-ink-900 sm:px-5">
                {contact.name}
              </td>
              <td className="px-4 py-2.5 text-ink-600 sm:px-5">{contact.email}</td>
              <td className="hidden px-4 py-2.5 text-ink-600 sm:table-cell sm:px-5">
                {contact.company}
              </td>
              <td className="px-4 py-2.5 sm:px-5">
                <Badge tone={TONES[contact.status]}>{contact.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

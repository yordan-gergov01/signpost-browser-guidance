import { Button } from '@/shared/ui/Button';

export type ContactsToolbarProps = {
  filter: string;
  onFilterChange: (value: string) => void;
  onAddContact: () => void;
};

export function ContactsToolbar({
  filter,
  onFilterChange,
  onAddContact,
}: ContactsToolbarProps) {
  return (
    <>
      <input
        type="search"
        aria-label="Filter contacts"
        placeholder="Filter contacts"
        data-testid="contacts-filter"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value)}
        className="w-48 rounded-md border border-ink-300 px-3 py-1.5 text-sm outline-none focus:border-accent-500"
      />
      {/* Twin of the Export button in Saved reports. Only the section path
          separates them; this is the resolver's ambiguity test case. */}
      <Button data-testid="contacts-export">Export</Button>
      <Button variant="primary" data-testid="add-contact" onClick={onAddContact}>
        Add contact
      </Button>
    </>
  );
}

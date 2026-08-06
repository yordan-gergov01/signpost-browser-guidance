import type { Contact } from '@/features/contacts/types/contacts';

// Fixed seed data. Nothing random or time-dependent: eval fixtures are captured
// from this app and have to reproduce byte for byte.
export const CONTACTS: readonly Contact[] = [
  {
    id: 'c1',
    name: 'Ada Lovelace',
    email: 'ada@analytical.io',
    company: 'Analytical',
    status: 'Active',
  },
  {
    id: 'c2',
    name: 'Grace Hopper',
    email: 'grace@navy.mil',
    company: 'Navy Systems',
    status: 'Active',
  },
  {
    id: 'c3',
    name: 'Alan Turing',
    email: 'alan@bletchley.uk',
    company: 'Bletchley',
    status: 'Lead',
  },
  {
    id: 'c4',
    name: 'Katherine Johnson',
    email: 'kj@orbital.space',
    company: 'Orbital',
    status: 'Active',
  },
  {
    id: 'c5',
    name: 'Barbara Liskov',
    email: 'barbara@substitute.dev',
    company: 'Substitute',
    status: 'Lead',
  },
  {
    id: 'c6',
    name: 'Margaret Hamilton',
    email: 'margaret@apollo.aero',
    company: 'Apollo Aero',
    status: 'Churned',
  },
];

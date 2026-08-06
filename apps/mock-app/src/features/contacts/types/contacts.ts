export type ContactStatus = 'Lead' | 'Active' | 'Churned';

export type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  status: ContactStatus;
};

export type ContactDraft = Pick<Contact, 'name' | 'email' | 'company'>;

export type SavedReport = {
  id: string;
  name: string;
  rows: number;
};

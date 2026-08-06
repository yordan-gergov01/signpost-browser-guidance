export type SettingsTabId = 'profile' | 'billing' | 'notifications' | 'api-keys';

export type SettingsTab = {
  id: SettingsTabId;
  href: string;
  label: string;
  testId: string;
};

export type Invoice = {
  id: string;
  period: string;
  total: string;
};

export type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  created: string;
};

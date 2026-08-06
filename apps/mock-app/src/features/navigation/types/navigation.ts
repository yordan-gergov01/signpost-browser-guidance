export type NavItem = {
  /** Destination of the link. */
  href: string;
  /** Path prefix that keeps the item highlighted across sub-routes. */
  section: string;
  label: string;
  testId: string;
};

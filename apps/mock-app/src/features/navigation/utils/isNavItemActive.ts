import type { NavItem } from '@/features/navigation/types/navigation';

// NavLink's own isActive matches the link target, so Settings would go inactive
// on any tab other than Profile. Highlighting follows the section instead.
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  return pathname === item.section || pathname.startsWith(`${item.section}/`);
}

import { Role } from '../../features/auth/types/authTypes';

export interface NavigationItem {
  label: string;
  path: string;
  roles: Role[];
  icon: string;
}

export const navigationConfig: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', roles: [Role.DRIVER, Role.PARKING_OWNER, Role.PARKING_STAFF, Role.PLATFORM_ADMIN], icon: 'LayoutDashboard' },
  { label: 'Profile', path: '/profile', roles: [Role.DRIVER, Role.PARKING_OWNER, Role.PARKING_STAFF, Role.PLATFORM_ADMIN], icon: 'User' },
  
  { label: 'Search Parking', path: '/search', roles: [Role.DRIVER], icon: 'Search' },
  { label: 'Reservations', path: '/reservations', roles: [Role.DRIVER], icon: 'Calendar' },
  { label: 'Booking History', path: '/history', roles: [Role.DRIVER], icon: 'History' },
  
  { label: 'Verification', path: '/provider/profile', roles: [Role.PARKING_OWNER], icon: 'ShieldCheck' },
  { label: 'Facilities', path: '/facilities', roles: [Role.PARKING_OWNER], icon: 'Building' },
  { label: 'Revenue', path: '/revenue', roles: [Role.PARKING_OWNER], icon: 'DollarSign' },
  { label: 'Analytics', path: '/analytics', roles: [Role.PARKING_OWNER], icon: 'BarChart' },
  
  { label: 'Active Sessions', path: '/sessions', roles: [Role.PARKING_STAFF], icon: 'Clock' },
  { label: 'Support', path: '/support', roles: [Role.PARKING_STAFF], icon: 'LifeBuoy' },
  
  { label: 'Users', path: '/admin/users', roles: [Role.PLATFORM_ADMIN], icon: 'Users' },
  { label: 'Properties', path: '/admin/properties', roles: [Role.PLATFORM_ADMIN], icon: 'ShieldCheck' },
  { label: 'Providers', path: '/admin/providers', roles: [Role.PLATFORM_ADMIN], icon: 'Shield' },
  { label: 'Pricing & Bays', path: '/admin/commission', roles: [Role.PLATFORM_ADMIN], icon: 'BadgeDollarSign' },
];

import { Role } from "../../features/auth/types/authTypes";
import { ROUTES } from "../routes/routeConstants";

export interface NavigationItem {
  label: string;
  path: string;
  roles: Role[];
  icon: string;
}

export const navigationConfig: NavigationItem[] = [
  // Common
  {
    label: "Dashboard",
    path: ROUTES.DASHBOARD,
    roles: [
      Role.DRIVER,
      Role.PARKING_OWNER,
      Role.PARKING_STAFF,
      Role.PLATFORM_ADMIN,
    ],
    icon: "LayoutDashboard",
  },
  {
    label: "Profile",
    path: ROUTES.PROFILE,
    roles: [
      Role.DRIVER,
      Role.PARKING_OWNER,
      Role.PARKING_STAFF,
      Role.PLATFORM_ADMIN,
    ],
    icon: "User",
  },

  // Driver
  {
    label: "Search Parking",
    path: ROUTES.PARKING_DISCOVERY,
    roles: [Role.DRIVER],
    icon: "Search",
  },
  {
    label: "Reservations",
    path: ROUTES.DRIVER_RESERVATIONS,
    roles: [Role.DRIVER],
    icon: "Calendar",
  },
  {
    label: "Booking History",
    path: ROUTES.BOOKING_HISTORY,
    roles: [Role.DRIVER],
    icon: "History",
  },
  {
    label: "Feedback & Ratings",
    path: ROUTES.DRIVER_FEEDBACK,
    roles: [Role.DRIVER],
    icon: "MessageSquareText",
  },

  // Parking_Owner
  {
    label: "Verification",
    path: ROUTES.PROVIDER_PROFILE,
    roles: [Role.PARKING_OWNER],
    icon: "ShieldCheck",
  },
  {
    label: "Facilities",
    path: ROUTES.FACILITIES,
    roles: [Role.PARKING_OWNER],
    icon: "Building",
  },
  {
    label: "Approvals",
    path: ROUTES.PROVIDER_APPROVALS,
    roles: [Role.PARKING_OWNER],
    icon: "CheckSquare",
  },
  {
    label: "Reviews",
    path: ROUTES.PROVIDER_REVIEWS,
    roles: [Role.PARKING_OWNER],
    icon: "Star",
  },
  {
    label: "Reservations",
    path: ROUTES.PROVIDER_RESERVATIONS,
    roles: [Role.PARKING_OWNER],
    icon: "Calendar",
  },
  {
    label: "Revenue",
    path: ROUTES.REVENUE,
    roles: [Role.PARKING_OWNER],
    icon: "DollarSign",
  },
  {
    label: "Analytics",
    path: ROUTES.PROVIDER_ANALYTICS,
    roles: [Role.PARKING_OWNER],
    icon: "BarChart",
  },
  {
    label: "Staff",
    path: ROUTES.PROVIDER_STAFF,
    roles: [Role.PARKING_OWNER],
    icon: "Users",
  },

  // Parking_Staff
  {
    label: "Active Sessions",
    path: ROUTES.ACTIVE_SESSIONS,
    roles: [Role.PARKING_STAFF],
    icon: "Clock",
  },
  {
    label: "QR Scanner",
    path: ROUTES.QR_SCANNER,
    roles: [Role.PARKING_STAFF, Role.PARKING_OWNER],
    icon: "ScanLine",
  },

  // Platform_Admin
  {
    label: "Users",
    path: ROUTES.ADMIN_USERS,
    roles: [Role.PLATFORM_ADMIN],
    icon: "Users",
  },
  {
    label: "Properties",
    path: ROUTES.ADMIN_PROPERTIES,
    roles: [Role.PLATFORM_ADMIN],
    icon: "ShieldCheck",
  },
  {
    label: "Providers",
    path: ROUTES.ADMIN_PROVIDER_APPROVALS,
    roles: [Role.PLATFORM_ADMIN],
    icon: "Shield",
  },
  {
    label: "Pricing & Bays",
    path: ROUTES.ADMIN_COMMISSION,
    roles: [Role.PLATFORM_ADMIN],
    icon: "BadgeDollarSign",
  },
  {
    label: "Feedback",
    path: ROUTES.ADMIN_FEEDBACK,
    roles: [Role.PLATFORM_ADMIN],
    icon: "MessageSquareText",
  },
];

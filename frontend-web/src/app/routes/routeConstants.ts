export const ROUTES = {
  // Public routes
  HOME: "/",

  // Auth routes
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  UNAUTHORIZED: "/unauthorized",

  // Dashboard redirector
  DASHBOARD: "/dashboard",

  // Common routes
  PROFILE: "/profile",

  // Driver routes
  SEARCH_PARKING: "/search",
  DRIVER_RESERVATIONS: "/reservations",
  BOOKING_HISTORY: "/history",

  // Provider routes
  PROVIDER_DASHBOARD: "/provider/dashboard",
  PROVIDER_PROFILE: "/provider/profile",
  FACILITIES: "/facilities",
  FACILITY_CREATE: "/facilities/new",
  FACILITY_DETAILS: (facilityId: string) => `/facilities/${facilityId}`,
  FACILITY_EDIT: (facilityId: string) => `/facilities/${facilityId}/edit`,
  FACILITY_SETUP: (facilityId: string) => `/facilities/${facilityId}/setup`,
  FACILITY_SLOTS: (facilityId: string) => `/facilities/${facilityId}/slots`,
  FACILITY_DETAILS_PATTERN: "/facilities/:facilityId",
  FACILITY_EDIT_PATTERN: "/facilities/:facilityId/edit",
  FACILITY_SETUP_PATTERN: "/facilities/:facilityId/setup",
  FACILITY_SLOTS_PATTERN: "/facilities/:facilityId/slots",
  REVENUE: "/revenue",
  PROVIDER_ANALYTICS: "/analytics",
  PROVIDER_REPORTS: "/reports",
  PROVIDER_RESERVATIONS: "/reservations",

  // Staff routes
  STAFF_DASHBOARD: "/staff/dashboard",
  ACTIVE_SESSIONS: "/sessions",
  SUPPORT: "/support",

  // Admin routes
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_USERS: "/admin/users",
  ADMIN_PROPERTIES: "/admin/properties",
  ADMIN_PROPERTY_DETAILS: (facilityId: string) =>
    `/admin/properties/${facilityId}`,
  ADMIN_PROPERTY_DETAILS_PATTERN: "/admin/properties/:facilityId",
  ADMIN_PROVIDERS: "/admin/providers",
  ADMIN_PROVIDER_APPROVALS: "/admin/provider-approvals",
  ADMIN_COMMISSION: "/admin/commission",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_REPORTS: "/admin/reports",
  ADMIN_RESERVATIONS: "/admin/reservations",
  ADMIN_STAFF: "/admin/staff",
  ADMIN_AGENTS: "/admin/agents",
  ADMIN_PAYMENTS: "/admin/payments",

  // Helper functions
  facilityDetailsPath: (facilityId: string) => `/facilities/${facilityId}`,
  facilityEditPath: (facilityId: string) => `/facilities/${facilityId}/edit`,
  facilitySetupPath: (facilityId: string) => `/facilities/${facilityId}/setup`,
  facilitySlotsPath: (facilityId: string) => `/facilities/${facilityId}/slots`,
  adminPropertyPath: (facilityId: string) => `/admin/properties/${facilityId}`,
} as const;

// Type-safe route helper
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

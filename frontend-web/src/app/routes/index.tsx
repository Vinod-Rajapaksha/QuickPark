import { createBrowserRouter, redirect, Navigate } from "react-router-dom";
import { store } from "../store";
import { Role } from "../../features/auth/types/authTypes";
import DashboardLayout from "../../layouts/DashboardLayout";
import PublicLayout from "../../layouts/PublicLayout";
import Landing from "../../pages/public/Landing";
import Login from "../../pages/auth/Login";
import Register from "../../pages/auth/Register";
import Profile from "../../pages/common/Profile";

// Provider pages
import ProviderProfilePage from "../../pages/provider/ProfilePage";
import ParkingListPage from "../../pages/provider/ParkingListPage";
import ParkingCreatePage from "../../pages/provider/ParkingCreatePage";
import FacilitySetupPage from "../../pages/provider/FacilitySetupPage";
import SlotManagementPage from "../../pages/provider/SlotManagementPage";
import ProviderDashboardPage from "../../pages/provider/ProviderDashboardPage";
import EarningsPage from "../../pages/provider/EarningsPage";
import ProviderAnalyticsPage from '../../pages/provider/ProviderAnalyticsPage';
import FacilityRevenuePage from '../../pages/provider/FacilityRevenuePage';
import ProviderReportsPage from "../../pages/provider/ReportsPage";
import ProviderReservationsPage from "../../pages/provider/ReservationsPage";
import ParkingDetailsPage from "../../pages/provider/ParkingDetailsPage";
import ParkingEditPage from "../../pages/provider/ParkingEditPage";
import ProviderReservationApprovalPage from "../../pages/provider/ProviderReservationApprovalPage";
import ProviderApprovalsPage from "../../pages/provider/ProviderApprovalsPage";

// Staff pages
import StaffDashboardPage from "../../pages/staff/StaffDashboardPage";
import ActiveSessionsPage from "../../pages/staff/ActiveSessionsPage";
import QRScannerPage from "../../pages/staff/QRScannerPage";

// Admin pages
import AdminDashboardPage from "../../pages/admin/AdminDashboardPage";
import ProvidersPage from "../../pages/admin/ProvidersPage";
import UsersPage from "../../pages/admin/UsersPage";
import CommissionPage from "../../pages/admin/CommissionPage";
import AnalyticsPage from "../../pages/admin/AnalyticsPage";
import ReportsPage from "../../pages/admin/ReportsPage";
import ReservationsPage from "../../pages/admin/ReservationsPage";
import StaffManagementPage from "../../pages/admin/StaffManagementPage";
import AgentMonitoringPage from "../../pages/admin/AgentMonitoringPage";
import PaymentsPage from "../../pages/admin/PaymentsPage";
import ParkingFacilitiesPage from "../../pages/admin/ParkingFacilitiesPage";
import FacilityReviewPage from "../../pages/admin/FacilityReviewPage";
import FeedbackManagementPage from "../../pages/admin/FeedbackManagementPage";

//Driver pages
import FeedbackPage from "../../pages/driver/FeedbackPage";
import ParkingDiscoveryPage from "../../pages/driver/ParkingDiscoveryPage";
import MyReservationsPage from "../../pages/driver/MyReservationsPage";
import ReservationCreatePage from "../../pages/driver/ReservationCreatePage";
import DriverDashboardPage from "../../pages/driver/DriverDashboardPage";
import BookingHistoryPage from "../../pages/driver/BookingHistoryPage";

import { ProtectedRoute } from "./ProtectedRoute";
import { ROUTES } from "./routeConstants";

export const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    element: <PublicLayout />,
    children: [{ path: "/", element: <Landing /> }],
  },

  // AUTHENTICATION ROUTES
  { path: ROUTES.LOGIN, element: <Login /> },
  { path: ROUTES.REGISTER, element: <Register /> },
  {
    path: ROUTES.UNAUTHORIZED,
    element: (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
        <p>You don't have permission to view this page.</p>
      </div>
    ),
  },

  // PROTECTED ROUTES
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Dashboard Redirector
          {
            path: ROUTES.DASHBOARD,
            loader: () => {
              const user = store.getState().auth.user;
              switch (user?.role) {
                case Role.PLATFORM_ADMIN:
                  return redirect(ROUTES.ADMIN_DASHBOARD);
                case Role.PARKING_OWNER:
                  return redirect(ROUTES.PROVIDER_DASHBOARD);
                case Role.PARKING_STAFF:
                  return redirect(ROUTES.STAFF_DASHBOARD);
                case Role.DRIVER:
                  return redirect(ROUTES.DRIVER_DASHBOARD);
                default:
                  return null;
              }
            },
            element: <Navigate to={ROUTES.HOME} replace />,
          },

          //Common Routes
          { path: ROUTES.PROFILE, element: <Profile /> },

          // Driver Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.DRIVER]} />,
            children: [
              {
                path: ROUTES.DRIVER_DASHBOARD,
                element: <DriverDashboardPage />,
              },
              {
                path: ROUTES.PARKING_DISCOVERY,
                element: <ParkingDiscoveryPage />,
              },
              {
                path: ROUTES.DRIVER_RESERVATIONS,
                element: <MyReservationsPage />,
              },
              {
                path: ROUTES.BOOKING_HISTORY,
                element: <BookingHistoryPage />,
              },
              {
                path: ROUTES.RESERVATION_CREATE_PATTERN,
                element: <ReservationCreatePage />,
              },
              {
                path: ROUTES.DRIVER_FEEDBACK,
                element: <FeedbackPage />,
              },
            ],
          },

          // Provider Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.PARKING_OWNER]} />,
            children: [
              {
                path: ROUTES.PROVIDER_DASHBOARD,
                element: <ProviderDashboardPage />,
              },
              {
                path: ROUTES.PROVIDER_PROFILE,
                element: <ProviderProfilePage />,
              },
              { path: ROUTES.FACILITIES, element: <ParkingListPage /> },
              { path: ROUTES.FACILITY_CREATE, element: <ParkingCreatePage /> },
              {
                path: ROUTES.FACILITY_DETAILS_PATTERN,
                element: <ParkingDetailsPage />,
              },
              {
                path: ROUTES.FACILITY_EDIT_PATTERN,
                element: <ParkingEditPage />,
              },
              {
                path: ROUTES.FACILITY_SETUP_PATTERN,
                element: <FacilitySetupPage />,
              },
              {
                path: ROUTES.FACILITY_SLOTS_PATTERN,
                element: <SlotManagementPage />,
              },
              { path: ROUTES.FACILITY_REVENUE_PATTERN,
                element: <FacilityRevenuePage /> 
              },
              { path: ROUTES.REVENUE, element: <EarningsPage /> },
              { path: ROUTES.PROVIDER_ANALYTICS, element: <ProviderAnalyticsPage /> },
              {
                path: ROUTES.PROVIDER_REPORTS,
                element: <ProviderReportsPage />,
              },
              {
                path: ROUTES.PROVIDER_RESERVATIONS,
                element: <ProviderReservationsPage />,
              },
              {
                path: ROUTES.PROVIDER_APPROVALS,
                element: <ProviderApprovalsPage />,
              },
              {
                path: ROUTES.PROVIDER_RESERVATION_APPROVAL,
                element: <ProviderReservationApprovalPage />,
              },
              { path: ROUTES.QR_SCANNER, element: <QRScannerPage /> },
            ],
          },

          // Staff Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.PARKING_STAFF]} />,
            children: [
              { path: ROUTES.STAFF_DASHBOARD, element: <StaffDashboardPage /> },
              { path: ROUTES.ACTIVE_SESSIONS, element: <ActiveSessionsPage /> },
              { path: ROUTES.QR_SCANNER, element: <QRScannerPage /> },
              {
                path: ROUTES.SUPPORT,
                element: <div className="p-4">Support - Coming Soon</div>,
              },
            ],
          },

          // Admin Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]} />,
            children: [
              { path: ROUTES.ADMIN_DASHBOARD, element: <AdminDashboardPage /> },
              { path: ROUTES.ADMIN_USERS, element: <UsersPage /> },
              {
                path: ROUTES.ADMIN_PROPERTIES,
                element: <ParkingFacilitiesPage />,
              },
              {
                path: ROUTES.ADMIN_PROPERTY_DETAILS_PATTERN,
                element: <FacilityReviewPage />,
              },
              { path: ROUTES.ADMIN_PROVIDER_APPROVALS, element: <ProvidersPage /> },
              { path: ROUTES.ADMIN_COMMISSION, element: <CommissionPage /> },
              { path: ROUTES.ADMIN_ANALYTICS, element: <AnalyticsPage /> },
              { path: ROUTES.ADMIN_REPORTS, element: <ReportsPage /> },
              {
                path: ROUTES.ADMIN_RESERVATIONS,
                element: <ReservationsPage />,
              },
              { path: ROUTES.ADMIN_STAFF, element: <StaffManagementPage /> },
              { path: ROUTES.ADMIN_AGENTS, element: <AgentMonitoringPage /> },
              { path: ROUTES.ADMIN_PAYMENTS, element: <PaymentsPage /> },
              {
                path: ROUTES.ADMIN_FEEDBACK,
                element: <FeedbackManagementPage />,
              },
            ],
          },
        ],
      },
    ],
  },

  // FALLBACK ROUTE
  { path: "*", element: <Navigate to={ROUTES.HOME} replace /> },
]);

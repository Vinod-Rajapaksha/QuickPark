import { createBrowserRouter, redirect, Navigate } from 'react-router-dom';
import { store } from '../store';
import { Role } from '../../features/auth/types/authTypes';
import DashboardLayout from '../../layouts/DashboardLayout';
import PublicLayout from '../../layouts/PublicLayout';
import Landing from '../../pages/public/Landing';
import Login from '../../pages/auth/Login';
import Register from '../../pages/auth/Register';
import Profile from '../../pages/common/Profile';
import ProviderProfilePage from '../../pages/provider/ProfilePage';
import ProvidersPage from '../../pages/admin/ProvidersPage';
import UsersPage from '../../pages/admin/UsersPage';
import AdminDashboardPage from '../../pages/admin/AdminDashboardPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  // PUBLIC ROUTES
  {
    element: <PublicLayout />,
    children: [{ path: "/", element: <Landing /> }]
  },

  // AUTHENTICATION ROUTES
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/unauthorized", element: <div className="p-8 text-center"><h1 className="text-2xl font-bold text-red-600">Unauthorized</h1><p>You don't have permission to view this page.</p></div> },

  // PROTECTED ROUTES
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          
          // Dashboard Redirector
          {
            path: "/dashboard",
            loader: () => {
              const user = store.getState().auth.user;
              switch (user?.role) {
                case Role.PLATFORM_ADMIN:
                  return redirect("/admin/dashboard");
                case Role.PARKING_OWNER:
                  return redirect("/provider/dashboard");
                case Role.PARKING_STAFF:
                  return redirect("/staff/dashboard");
                default:
                  return null;
              }
            },
            element: <div className="p-4">Driver Dashboard Coming Soon</div>
          },

          // Driver Routes
          { path: "/profile", element: <Profile /> },

          // Provider Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.PARKING_OWNER]} />,
            children: [
              { path: "/provider/dashboard", element: <div className="p-4">Provider Dashboard Coming Soon</div> },
              { path: "/provider/profile", element: <ProviderProfilePage /> },
            ]
          },

          // Staff Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.PARKING_STAFF]} />,
            children: [
              { path: "/staff/dashboard", element: <div className="p-4">Staff Dashboard Coming Soon</div> },
            ]
          },

          // Admin Routes
          {
            element: <ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]} />,
            children: [
              { path: "/admin/dashboard", element: <AdminDashboardPage /> },
              { path: "/admin/providers", element: <ProvidersPage /> },
              { path: "/admin/users", element: <UsersPage /> },
            ]
          }
        ]
      }
    ]
  },

  // FALLBACK ROUTE
  { path: "*", element: <Navigate to="/" replace /> }
]);

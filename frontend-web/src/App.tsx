import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Role } from './features/auth/types/authTypes';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/dashboard/Profile';
import ProviderProfilePage from './pages/provider/ProfilePage';
import ParkingListPage from './pages/provider/ParkingListPage';
import ParkingCreatePage from './pages/provider/ParkingCreatePage';
import FacilitySetupPage from './pages/provider/FacilitySetupPage';
import SlotManagementPage from './pages/provider/SlotManagementPage';
import ProvidersPage from './pages/admin/ProvidersPage';
import ParkingFacilitiesPage from './pages/admin/ParkingFacilitiesPage';
import FacilityReviewPage from './pages/admin/FacilityReviewPage';
import CommissionPage from './pages/admin/CommissionPage';
import { ProtectedRoute } from './app/routes/ProtectedRoute';
import { ToastProvider } from './app/providers/ToastProvider';
import Spinner from './components/common/Spinner/Spinner';

function App() {
  const { checkSession, isLoading } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return <Spinner fullScreen size="xl" />;
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-red-600">Unauthorized</h1><p>You don't have permission to view this page.</p></div>} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<div className="p-4">Welcome to your dashboard</div>} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<ProtectedRoute allowedRoles={[Role.PARKING_OWNER]} />}>
                <Route path="/provider/profile" element={<ProviderProfilePage />} />
                <Route path="/facilities" element={<ParkingListPage />} />
                <Route path="/facilities/new" element={<ParkingCreatePage />} />
                <Route path="/facilities/:facilityId/setup" element={<FacilitySetupPage />} />
                <Route path="/facilities/:facilityId/slots" element={<SlotManagementPage />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]} />}>
                 <Route path="/admin" element={<div className="p-4">Admin Only Area</div>} />
                 <Route path="/admin/providers" element={<ProvidersPage />} />
                 <Route path="/admin/properties" element={<ParkingFacilitiesPage />} />
                 <Route path="/admin/properties/:facilityId" element={<FacilityReviewPage />} />
                 <Route path="/admin/commission" element={<CommissionPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

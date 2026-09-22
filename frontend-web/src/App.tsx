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
import ProvidersPage from './pages/admin/ProvidersPage';
import { ProtectedRoute } from './app/routes/ProtectedRoute';
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
            </Route>
            <Route element={<ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]} />}>
               <Route path="/admin" element={<div className="p-4">Admin Only Area</div>} />
               <Route path="/admin/providers" element={<ProvidersPage />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

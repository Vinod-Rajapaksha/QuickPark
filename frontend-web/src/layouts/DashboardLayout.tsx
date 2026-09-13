import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { navigationConfig } from '../app/config/navigationConfig';
import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

const DashboardLayout = () => {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return null;

  const allowedNavItems = navigationConfig.filter(item => item.roles.includes(user.role));
  const currentPageTitle = allowedNavItems.find(item => location.pathname.startsWith(item.path))?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        allowedNavItems={allowedNavItems} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <TopBar 
          user={user} 
          onLogout={logoutUser} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          pageTitle={currentPageTitle}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

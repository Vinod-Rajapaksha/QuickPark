import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import type { NavigationItem } from '../../app/config/navigationConfig';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  allowedNavItems: NavigationItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen, allowedNavItems }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full flex flex-col'}`}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200 px-4 shrink-0">
          <div className="text-2xl font-extrabold text-blue-600 tracking-tight">QuickPark</div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const isDashboardItem = item.path === '/dashboard';
            const isActive = isDashboardItem 
              ? location.pathname.endsWith('dashboard')
              : location.pathname.startsWith(item.path);
            const Icon = (Icons[item.icon as keyof typeof Icons] as React.ElementType) || Icons.Circle;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Icon size={20} className={`mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

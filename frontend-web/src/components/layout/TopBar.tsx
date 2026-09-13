import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../../features/auth/types/auth';
import ConfirmDialog from '../common/ConfirmDialog/ConfirmDialog';

interface TopBarProps {
  user: User;
  onLogout: () => void;
  onMenuClick: () => void;
  pageTitle: string;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onLogout, onMenuClick, pageTitle }) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 mr-4 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-sm font-medium text-gray-900">{user.fullName || 'User'}</span>
            <span className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ').toLowerCase()}</span>
          </div>
          
          <div className="relative group">
            <button className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:bg-blue-200 transition-colors">
              {(user.fullName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 origin-top-right">
              <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                <p className="text-sm font-medium text-gray-900">{user.fullName || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || ''}</p>
              </div>
              <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <UserIcon size={16} className="mr-2 text-gray-400" />
                Profile
              </Link>
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
              >
                <LogOut size={16} className="mr-2 text-red-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onLogout();
        }}
        title="Sign Out"
        description="Are you sure you want to sign out of QuickPark? You will need to log in again to access your dashboard."
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default TopBar;

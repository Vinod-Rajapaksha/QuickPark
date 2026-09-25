import React from 'react';
import type { User } from '../../../types/user';
import Table from '../../../components/tables/Table';
import type { Column } from '../../../components/tables/Table';
import TablePagination from '../../../components/tables/TablePagination';
import { Edit, Trash2, ShieldAlert, ShieldCheck } from 'lucide-react';

interface UserTableProps {
  users: User[];
  loading: boolean;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onConfirmAction: (type: 'delete' | 'suspend' | 'activate', user: User) => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  currentUserId,
  onEdit,
  onConfirmAction,
  page,
  limit,
  total,
  onPageChange,
}) => {
  const columns: Column<User>[] = [
    {
      key: 'userInfo',
      header: 'User Info',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">{user.fullName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === 'PLATFORM_ADMIN'
              ? 'bg-purple-100 text-purple-700'
              : user.role === 'PARKING_OWNER'
              ? 'bg-blue-100 text-blue-700'
              : user.role === 'PARKING_STAFF'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {user.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium flex w-max items-center gap-1.5 ${
            user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              user.isActive ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {user.isActive ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) => (
        <span className="text-sm text-gray-600">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(user)}
            className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>

          {currentUserId !== user.id && (
            <>
              {user.isActive ? (
                <button
                  onClick={() => onConfirmAction('suspend', user)}
                  className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                  title="Suspend"
                >
                  <ShieldAlert className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onConfirmAction('activate', user)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Activate"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onConfirmAction('delete', user)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Table<User>
        columns={columns}
        data={users}
        loading={loading}
        loadingMessage="Loading users..."
        emptyMessage="No users found."
        keyExtractor={(user) => user.id}
      />
      {!loading && (
        <TablePagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
};

export default UserTable;

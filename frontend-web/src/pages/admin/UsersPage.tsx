import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getUsers, createUser, updateUser, deleteUser, updateUserStatus } from '../../features/users/api/userApi';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../types/user';
import Button from '../../components/common/Button/Button';
import UserFormModal from '../../features/users/components/UserFormModal';
import ConfirmDialog from '../../components/common/ConfirmDialog/ConfirmDialog';
import UserFilters from '../../features/users/components/UserFilters';
import UserTable from '../../features/users/components/UserTable';
import { Plus, Users } from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'suspend' | 'activate', user: User | null }>({ type: 'delete', user: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getUsers({ page, limit, search: searchTerm, role: roleFilter, status: statusFilter });
      const roleOrder: Record<string, number> = {
        'PLATFORM_ADMIN': 1,
        'PARKING_OWNER': 2,
        'PARKING_STAFF': 3,
        'DRIVER': 4
      };
      
      const sortedUsers = res.data.sort((a: User, b: User) => {
        const orderA = roleOrder[a.role] || 99;
        const orderB = roleOrder[b.role] || 99;
        return orderA - orderB;
      });

      setUsers(sortedUsers);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchTerm, roleFilter, statusFilter, showToast]);

  useEffect(() => {
    let ignore = false;
    
    getUsers({ page, limit, search: searchTerm, role: roleFilter, status: statusFilter })
      .then((res) => {
        if (ignore) return;
        const roleOrder: Record<string, number> = {
          'PLATFORM_ADMIN': 1,
          'PARKING_OWNER': 2,
          'PARKING_STAFF': 3,
          'DRIVER': 4
        };
        
        const sortedUsers = res.data.sort((a: User, b: User) => {
          const orderA = roleOrder[a.role] || 99;
          const orderB = roleOrder[b.role] || 99;
          return orderA - orderB;
        });

        setUsers(sortedUsers);
        setTotal(res.total);
        setLoading(false);
      })
      .catch((error) => {
        if (ignore) return;
        console.error('Failed to fetch users', error);
        showToast('Failed to load users', 'error');
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [page, limit, searchTerm, roleFilter, statusFilter, showToast]);

  const handleFormSubmit = async (data: CreateUserRequest | UpdateUserRequest) => {
    setActionLoading(true);
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, data as UpdateUserRequest);
        showToast('User updated successfully', 'success');
      } else {
        await createUser(data as CreateUserRequest);
        showToast('User created successfully', 'success');
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Failed to save user', error);
      const err = error as { response?: { data?: { message?: string } | string } };
      const errorMessage = typeof err?.response?.data === 'string' 
        ? err.response.data 
        : err?.response?.data?.message || 'Failed to save user';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmActionHandler = async () => {
    if (!confirmAction.user) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'delete') {
        await deleteUser(confirmAction.user.id);
        showToast('User deleted successfully', 'success');
      } else {
        await updateUserStatus(confirmAction.user.id, { isActive: confirmAction.type === 'activate' });
        showToast(`User ${confirmAction.type === 'activate' ? 'activated' : 'suspended'} successfully`, 'success');
      }
      setIsConfirmOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Action failed', error);
      const err = error as { response?: { data?: { message?: string } | string } };
      const errorMessage = typeof err?.response?.data === 'string'
        ? err.response.data
        : err?.response?.data?.message || 'Action failed';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (type: 'delete' | 'suspend' | 'activate', user: User) => {
    setConfirmAction({ type, user });
    setIsConfirmOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Users size={24} className="text-slate-400" />
            User Management
          </h1>
          <p className="text-slate-500 mt-1">
            Manage all users, roles, and statuses in the platform.
          </p>
        </div>
        <Button 
          onClick={() => { setSelectedUser(null); setIsFormOpen(true); }} 
          leftIcon={<Plus size={16} />}
        >
          Add New User
        </Button>
      </div>

      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <UserTable
          users={users}
          loading={loading}
          currentUserId={currentUser?.id}
          onEdit={(user) => { setSelectedUser(user); setIsFormOpen(true); }}
          onConfirmAction={openConfirm}
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
        />
      </div>

      <UserFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSubmit={handleFormSubmit} 
        initialData={selectedUser}
        isLoading={actionLoading}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmActionHandler}
        title={
          confirmAction.type === 'delete' ? 'Delete User' :
          confirmAction.type === 'suspend' ? 'Suspend User' : 'Activate User'
        }
        description={
          confirmAction.type === 'delete' ? `Are you sure you want to delete ${confirmAction.user?.fullName}? This action cannot be undone.` :
          confirmAction.type === 'suspend' ? `Are you sure you want to suspend ${confirmAction.user?.fullName}? They will not be able to log in.` :
          `Are you sure you want to activate ${confirmAction.user?.fullName}? They will regain access to the platform.`
        }
        confirmText={
          confirmAction.type === 'delete' ? 'Delete' :
          confirmAction.type === 'suspend' ? 'Suspend' : 'Activate'
        }
        type={
          confirmAction.type === 'delete' ? 'danger' :
          confirmAction.type === 'suspend' ? 'warning' : 'info'
        }
        isLoading={actionLoading}
      />
    </div>
  );
};

export default UsersPage;

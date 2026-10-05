import React from 'react';
import TableFilters from '../../../components/tables/TableFilters';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <TableFilters
      searchTerm={searchTerm}
      searchPlaceholder="Search by name or email..."
      onSearchChange={onSearchChange}
      selectFilters={[
        {
          key: 'role',
          value: roleFilter,
          className: 'w-full md:w-48',
          options: [
            { value: '', label: 'All Roles' },
            { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
            { value: 'PARKING_OWNER', label: 'Parking Provider' },
            { value: 'PARKING_STAFF', label: 'Parking Staff' },
            { value: 'DRIVER', label: 'Driver' },
          ],
          onChange: onRoleFilterChange,
        },
        {
          key: 'status',
          value: statusFilter,
          className: 'w-full md:w-44',
          options: [
            { value: '', label: 'All Status' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'SUSPENDED', label: 'Suspended' },
          ],
          onChange: onStatusFilterChange,
        },
      ]}
    />
  );
};

export default UserFilters;

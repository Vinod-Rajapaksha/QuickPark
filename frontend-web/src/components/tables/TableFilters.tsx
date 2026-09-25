import React from 'react';
import CustomSelect from '../common/Select/Select';
import { Search } from 'lucide-react';

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectConfig {
  key: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

interface TableFiltersProps {
  searchTerm?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  selectFilters?: FilterSelectConfig[];
  children?: React.ReactNode;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchTerm,
  searchPlaceholder = 'Search...',
  onSearchChange,
  selectFilters = [],
  children,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {onSearchChange !== undefined && (
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 outline-none text-sm"
              value={searchTerm || ''}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        {selectFilters.map((filter) => (
          <CustomSelect
            key={filter.key}
            className={filter.className || 'w-full md:w-48'}
            options={filter.options}
            value={filter.value}
            onChange={filter.onChange}
          />
        ))}
        {children}
      </div>
    </div>
  );
};

export default TableFilters;

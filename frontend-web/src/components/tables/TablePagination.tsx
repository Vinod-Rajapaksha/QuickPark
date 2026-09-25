import React from 'react';

interface TablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  limit,
  total,
  onPageChange,
}) => {
  if (total <= limit) return null;

  return (
    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
      <span className="text-sm text-gray-500">
        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
      </span>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => onPageChange(page + 1)}
          disabled={page * limit >= total}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TablePagination;

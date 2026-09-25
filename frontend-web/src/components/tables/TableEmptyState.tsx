import React from 'react';

interface TableEmptyStateProps {
  message?: string;
  colSpan?: number;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  message = 'No data found.',
  colSpan = 5,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
};

export default TableEmptyState;

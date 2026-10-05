import React from 'react';
import { Loader2 } from 'lucide-react';
import TableEmptyState from './TableEmptyState';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  rowClassName?: string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  loadingMessage = 'Loading data...',
  emptyMessage = 'No records found.',
  keyExtractor,
  rowClassName = 'border-b border-gray-50 hover:bg-gray-50/50 transition-colors',
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mb-4" />
        <p className="text-gray-500">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-4 text-sm font-semibold text-gray-600 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <TableEmptyState message={emptyMessage} colSpan={columns.length} />
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className={rowClassName}>
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

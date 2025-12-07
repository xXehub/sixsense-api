'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Column definition
interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => ReactNode;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  keyField,
  onRowClick,
  emptyMessage = 'No data found',
}: AdminTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
    return sortDir === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="
        flex items-center justify-center py-16
        bg-[var(--background-card)] border border-[var(--border)] rounded-xl
      ">
        <Loader2 className="w-6 h-6 text-[var(--primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="
      overflow-hidden
      bg-[var(--background-card)] border border-[var(--border)] rounded-xl
    ">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`
                    px-4 py-3 text-left text-xs font-medium uppercase tracking-wider
                    text-[var(--text-muted)]
                    ${col.sortable ? 'cursor-pointer hover:text-[var(--text)] transition-colors' : ''}
                    ${col.width || ''}
                  `}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <span className="flex-shrink-0">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="divide-y divide-[var(--border)]">
            {sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[var(--text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, idx) => (
                <tr 
                  key={String(item[keyField]) || idx}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    transition-colors duration-100
                    hover:bg-[var(--background-lighter)]
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-sm text-[var(--text)]">
                      {col.render 
                        ? col.render(item)
                        : String(item[col.key] ?? '-')
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

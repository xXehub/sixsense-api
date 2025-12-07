'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter, Download, MoreHorizontal } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => ReactNode;
}

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onFilter?: (filterKey: string, value: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  actions?: (item: T) => ReactNode;
  filters?: { key: string; label: string; options: FilterOption[] }[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  bulkActions?: ReactNode;
}

export default function DataTable<T extends { id: string | number }>({
  columns,
  data,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onSearch,
  onSort,
  onFilter,
  isLoading = false,
  emptyMessage = 'No data found',
  emptyDescription,
  searchPlaceholder = 'Search...',
  actions,
  filters,
  selectable = false,
  onSelectionChange,
  bulkActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  useEffect(() => {
    onSelectionChange?.(selectedIds);
  }, [selectedIds, onSelectionChange]);

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    onSort(key, newOrder);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string | number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterKey]: value }));
    onFilter?.(filterKey, value);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111] border border-[#1a1a1a] rounded-md p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-64 pl-10 pr-4 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          )}

          {/* Filters */}
          {filters && filters.map(filter => (
            <select
              key={filter.key}
              value={activeFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="px-3 py-2.5 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value="">{filter.label}</option>
              {filter.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Actions */}
          {selectable && selectedIds.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md">
              <span className="text-sm text-primary font-medium">{selectedIds.length} selected</span>
              {bulkActions}
            </div>
          )}

          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Rows:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-base font-medium text-gray-300">{emptyMessage}</p>
            {emptyDescription && (
              <p className="text-sm text-gray-500 mt-2">{emptyDescription}</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-[#1a1a1a]">
                  {selectable && (
                    <th className="px-4 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === data.length && data.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-[#333] bg-[#1a1a1a] text-primary focus:ring-primary/50 focus:ring-offset-0"
                      />
                    </th>
                  )}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      style={{ width: column.width }}
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {column.sortable && onSort ? (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          {column.label}
                          {sortKey === column.key && (
                            sortOrder === 'asc' ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          )}
                        </button>
                      ) : (
                        column.label
                      )}
                    </th>
                  ))}
                  {actions && (
                    <th className="px-4 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#0f0f0f] transition-colors ${
                      selectedIds.includes(item.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 rounded border-[#333] bg-[#1a1a1a] text-primary focus:ring-primary/50 focus:ring-offset-0"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4 text-sm text-gray-300">
                        {column.render
                          ? column.render(item)
                          : String((item as any)[column.key] ?? '-')}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actions(item)}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between bg-[#111] border border-[#1a1a1a] rounded-md px-4 py-3">
          <p className="text-sm text-gray-400">
            Showing <span className="font-medium text-white">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium text-white">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-medium text-white">{total}</span> results
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-md bg-[#0a0a0a] border border-[#222] text-gray-400 hover:text-white hover:bg-[#151515] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`min-w-[36px] h-9 px-3 rounded-md text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-primary text-black'
                      : 'bg-[#0a0a0a] border border-[#222] text-gray-400 hover:text-white hover:bg-[#151515]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-md bg-[#0a0a0a] border border-[#222] text-gray-400 hover:text-white hover:bg-[#151515] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

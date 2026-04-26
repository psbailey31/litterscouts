import { useState } from 'react';
import type { EventStatus } from '@/types';

export interface EventFilterState {
  status: EventStatus | 'all';
  startDate?: string;
  endDate?: string;
}

interface EventFiltersProps {
  filters: EventFilterState;
  onFiltersChange: (filters: EventFilterState) => void;
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleStatusChange = (status: EventStatus | 'all') => {
    onFiltersChange({ ...filters, status });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: 'all',
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters = filters.status !== 'all' || filters.startDate || filters.endDate;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Status Filter - Always Visible */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => handleStatusChange('upcoming')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => handleStatusChange('cancelled')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === 'cancelled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                min={filters.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

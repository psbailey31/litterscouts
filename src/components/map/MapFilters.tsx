import { useState } from 'react';
import type { FilterState, LitterType, QuantityLevel } from '@/types';

interface MapFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onToggleClusters: () => void;
  showClusters: boolean;
  onToggleHeatmap: () => void;
  showHeatmap: boolean;
  onToggleHotspots?: () => void;
  showHotspots?: boolean;
  isLoadingHotspots?: boolean;
  onToggleEvents?: () => void;
  showEvents?: boolean;
  onToggleWaterQuality?: () => void;
  showWaterQuality?: boolean;
}

export function MapFilters({
  filters,
  onFiltersChange,
  onToggleClusters,
  showClusters,
  onToggleHeatmap,
  showHeatmap,
  onToggleHotspots,
  showHotspots = false,
  isLoadingHotspots = false,
  onToggleEvents,
  showEvents = false,
  onToggleWaterQuality,
  showWaterQuality = false,
}: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const litterTypes: LitterType[] = ['plastic', 'metal', 'glass', 'organic', 'hazardous', 'other'];
  const quantities: QuantityLevel[] = ['minimal', 'moderate', 'significant', 'severe'];

  const handleLitterTypeToggle = (type: LitterType) => {
    const currentTypes = filters.litterTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    onFiltersChange({
      ...filters,
      litterTypes: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleQuantityToggle = (quantity: QuantityLevel) => {
    const currentQuantities = filters.quantities || [];
    const newQuantities = currentQuantities.includes(quantity)
      ? currentQuantities.filter(q => q !== quantity)
      : [...currentQuantities, quantity];
    
    onFiltersChange({
      ...filters,
      quantities: newQuantities.length > 0 ? newQuantities : undefined,
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    if (!value) {
      if (field === 'start' && !filters.dateRange?.end) {
        onFiltersChange({ ...filters, dateRange: undefined });
      } else if (field === 'end' && !filters.dateRange?.start) {
        onFiltersChange({ ...filters, dateRange: undefined });
      } else {
        onFiltersChange({
          ...filters,
          dateRange: {
            start: field === 'start' ? new Date() : filters.dateRange!.start,
            end: field === 'end' ? new Date() : filters.dateRange!.end,
            [field]: undefined,
          } as any,
        });
      }
      return;
    }

    const date = new Date(value);
    onFiltersChange({
      ...filters,
      dateRange: {
        start: field === 'start' ? date : filters.dateRange?.start || date,
        end: field === 'end' ? date : filters.dateRange?.end || date,
      },
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = 
    (filters.litterTypes && filters.litterTypes.length > 0) ||
    (filters.quantities && filters.quantities.length > 0) ||
    filters.dateRange;

  return (
    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[1000] bg-white rounded-lg shadow-lg w-[calc(100vw-1rem)] sm:w-80 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 p-2 touch-manipulation"
          aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
          {/* Cluster Toggle */}
          <div className="flex items-center justify-between py-2">
            <label htmlFor="cluster-toggle" className="text-sm font-medium text-gray-700">
              Cluster Markers
            </label>
            <button
              id="cluster-toggle"
              onClick={onToggleClusters}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showClusters ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={showClusters}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showClusters ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Heat Map Toggle */}
          <div className="flex items-center justify-between py-2">
            <label htmlFor="heatmap-toggle" className="text-sm font-medium text-gray-700">
              Heat Map
            </label>
            <button
              id="heatmap-toggle"
              onClick={onToggleHeatmap}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showHeatmap ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={showHeatmap}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showHeatmap ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Events Toggle */}
          {onToggleEvents && (
            <div className="flex items-center justify-between py-2">
              <label htmlFor="events-toggle" className="text-sm font-medium text-gray-700">
                Show Events
              </label>
              <button
                id="events-toggle"
                onClick={onToggleEvents}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  showEvents ? 'bg-green-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={showEvents}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showEvents ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Water Quality Toggle */}
          {onToggleWaterQuality && (
            <div className="flex items-center justify-between py-2">
              <label htmlFor="water-quality-toggle" className="text-sm font-medium text-gray-700">
                Water Quality
              </label>
              <button
                id="water-quality-toggle"
                onClick={onToggleWaterQuality}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  showWaterQuality ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={showWaterQuality}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showWaterQuality ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Hotspots Toggle */}
          {onToggleHotspots && (
            <div className="flex items-center justify-between py-2">
              <label htmlFor="hotspots-toggle" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Hotspots
                {isLoadingHotspots && (
                  <svg className="animate-spin h-4 w-4 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </label>
              <button
                id="hotspots-toggle"
                onClick={onToggleHotspots}
                disabled={isLoadingHotspots}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  showHotspots ? 'bg-orange-600' : 'bg-gray-200'
                } ${isLoadingHotspots ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={showHotspots}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showHotspots ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Show Cleaned Reports Toggle */}
          <div className="flex items-center justify-between py-2">
            <label htmlFor="cleaned-toggle" className="text-sm font-medium text-gray-700">
              Show Cleaned
            </label>
            <button
              id="cleaned-toggle"
              onClick={() => onFiltersChange({ ...filters, showCleaned: filters.showCleaned === false ? true : false })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                filters.showCleaned !== false ? 'bg-green-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={filters.showCleaned !== false}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  filters.showCleaned !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Hotspot Legend */}
          {showHotspots && onToggleHotspots && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">Hotspot Severity</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-yellow-300 border border-yellow-400"></div>
                  <span className="text-gray-600">Low (5-9 reports)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-400 border border-orange-500"></div>
                  <span className="text-gray-600">Medium (10-14 reports)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600"></div>
                  <span className="text-gray-600">High (15-19 reports)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-600 border border-red-700"></div>
                  <span className="text-gray-600">Critical (20+ reports)</span>
                </div>
              </div>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.dateRange?.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                placeholder="Start date"
                style={{ minHeight: '44px' }}
              />
              <input
                type="date"
                value={filters.dateRange?.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                placeholder="End date"
                style={{ minHeight: '44px' }}
              />
            </div>
          </div>

          {/* Litter Type */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Litter Type
            </label>
            <div className="space-y-2">
              {litterTypes.map((type) => (
                <label key={type} className="flex items-center py-1 touch-manipulation" style={{ minHeight: '44px' }}>
                  <input
                    type="checkbox"
                    checked={filters.litterTypes?.includes(type) || false}
                    onChange={() => handleLitterTypeToggle(type)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-xs sm:text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity Level */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Quantity Level
            </label>
            <div className="space-y-2">
              {quantities.map((quantity) => (
                <label key={quantity} className="flex items-center py-1 touch-manipulation" style={{ minHeight: '44px' }}>
                  <input
                    type="checkbox"
                    checked={filters.quantities?.includes(quantity) || false}
                    onChange={() => handleQuantityToggle(quantity)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-xs sm:text-sm text-gray-700 capitalize">{quantity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-md transition-colors touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Active Filters Badge */}
      {!isExpanded && hasActiveFilters && (
        <div className="px-4 py-2 text-xs text-blue-600 font-medium">
          {[
            filters.litterTypes?.length && `${filters.litterTypes.length} type(s)`,
            filters.quantities?.length && `${filters.quantities.length} quantity`,
            filters.dateRange && 'date range',
          ].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}

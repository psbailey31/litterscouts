import { useState, useEffect } from 'react';
import { DateRangeSelector, StatCard, TimeSeriesChart, LitterTypeChart, QuantityChart } from '@/components/analytics';
import { analyticsService } from '@/services';
import { useToast } from '@/components/common/Toast';
import type { DateRange, AnalyticsSummary, TimeSeriesDataPoint, LitterTypeDistribution, QuantityAggregation } from '@/types';

/**
 * Analytics Dashboard Page
 * Displays summary statistics, date range filtering, and CSV export functionality
 */
export function AnalyticsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setMonth(end.getMonth() - 1); // Default to last month
    return { start, end };
  });

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [litterTypeData, setLitterTypeData] = useState<LitterTypeDistribution[]>([]);
  const [quantityData, setQuantityData] = useState<QuantityAggregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSummary();
    loadChartData();
  }, [dateRange]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getSummary({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });
      setSummary(data);
    } catch (err) {
      // If API is not available yet, show mock data for development
      console.warn('Analytics API not available, using mock data:', err);
      setSummary({
        totalReports: 0,
        totalEvents: 0,
        totalUsers: 0,
        totalLitterCollected: 0,
        reportsByType: {},
        reportsByQuantity: {},
        verifiedReports: 0,
        cleanedReports: 0,
        activeUsers: 0,
        upcomingEvents: 0,
        completedEvents: 0,
      });
      setError('Analytics API not yet implemented. Showing placeholder data.');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      setChartsLoading(true);
      const dateRangeParam = {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      };

      // Load all chart data in parallel
      const [timeSeries, litterTypes, quantities] = await Promise.all([
        analyticsService.getTimeSeries(dateRangeParam),
        analyticsService.getLitterTypeDistribution(dateRangeParam),
        analyticsService.getQuantityAggregation(dateRangeParam),
      ]);

      setTimeSeriesData(timeSeries);
      setLitterTypeData(litterTypes);
      setQuantityData(quantities);
    } catch (err) {
      // If API is not available yet, show mock data for development
      console.warn('Chart data API not available, using mock data:', err);
      
      // Generate mock time series data
      const mockTimeSeries: TimeSeriesDataPoint[] = [];
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const dataPoints = Math.min(daysDiff, 30); // Max 30 data points
      
      for (let i = 0; i < dataPoints; i++) {
        const date = new Date(dateRange.start);
        date.setDate(date.getDate() + Math.floor(i * daysDiff / dataPoints));
        mockTimeSeries.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          reportCount: Math.floor(Math.random() * 20) + 5,
          eventCount: Math.floor(Math.random() * 5),
          litterCollected: Math.floor(Math.random() * 50) + 10,
        });
      }
      setTimeSeriesData(mockTimeSeries);

      // Generate mock litter type distribution
      const mockLitterTypes: LitterTypeDistribution[] = [
        { type: 'plastic', count: 45 },
        { type: 'metal', count: 15 },
        { type: 'glass', count: 12 },
        { type: 'organic', count: 10 },
        { type: 'hazardous', count: 8 },
        { type: 'other', count: 10 },
      ];
      setLitterTypeData(mockLitterTypes);

      // Generate mock quantity aggregation
      const mockQuantities: QuantityAggregation[] = [
        { level: 'minimal', count: 30 },
        { level: 'moderate', count: 40 },
        { level: 'significant', count: 20 },
        { level: 'severe', count: 10 },
      ];
      setQuantityData(mockQuantities);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const blob = await analyticsService.exportToCSV({
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beach-litter-analytics-${dateRange.start.toISOString().split('T')[0]}-to-${dateRange.end.toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      toast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
          Analytics Dashboard
        </h1>
        <button
          onClick={handleExportCSV}
          disabled={exporting || loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to CSV
            </>
          )}
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Info/Warning State */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-yellow-800">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Summary Statistics */}
      {!loading && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Reports"
            value={summary.totalReports.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            subtitle="Litter reports submitted"
          />

          <StatCard
            title="Total Events"
            value={summary.totalEvents.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            subtitle="Cleanup events organized"
          />

          <StatCard
            title="Active Users"
            value={summary.activeUsers.toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            subtitle="Contributing to the platform"
          />

          <StatCard
            title="Litter Collected"
            value={
              summary.totalLitterCollected
                ? `${summary.totalLitterCollected.toLocaleString()} kg`
                : 'N/A'
            }
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
            subtitle="From cleanup events"
          />
        </div>
      )}

      {/* Data Visualizations */}
      <div className="mt-8 space-y-6">
        {/* Time Series Chart */}
        <TimeSeriesChart data={timeSeriesData} loading={chartsLoading} />

        {/* Litter Type and Quantity Charts - Side by Side on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LitterTypeChart data={litterTypeData} loading={chartsLoading} />
          <QuantityChart data={quantityData} loading={chartsLoading} />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;

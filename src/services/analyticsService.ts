// Analytics service for API interactions
import { apiClient } from './api';
import type { AnalyticsSummary, TimeSeriesDataPoint, LitterTypeDistribution, QuantityAggregation, Hotspot, HotspotWithSeverity, HotspotSeverity } from '@/types';

class AnalyticsService {
  /**
   * Get summary statistics for the analytics dashboard
   */
  async getSummary(dateRange?: { start: string; end: string }): Promise<AnalyticsSummary> {
    const params = new URLSearchParams();
    
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }

    const queryString = params.toString();
    const response = await apiClient.get<{ success: boolean; data: AnalyticsSummary }>(`/analytics/summary${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  /**
   * Get time series data for report trends
   */
  async getTimeSeries(
    dateRange?: { start: string; end: string },
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesDataPoint[]> {
    const params = new URLSearchParams();
    
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }
    params.append('interval', interval);

    const queryString = params.toString();
    const response = await apiClient.get<{ success: boolean; data: TimeSeriesDataPoint[] }>(`/analytics/trends${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  /**
   * Get aggregated data (litter types, quantities, verification status)
   */
  async getAggregatedData(dateRange?: { start: string; end: string }): Promise<{
    litterTypes: LitterTypeDistribution[];
    quantities: QuantityAggregation[];
    verificationStatus: Array<{ status: string; count: number }>;
  }> {
    const params = new URLSearchParams();
    
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }

    const queryString = params.toString();
    const response = await apiClient.get<{ success: boolean; data: {
      litterTypes: LitterTypeDistribution[];
      quantities: QuantityAggregation[];
      verificationStatus: Array<{ status: string; count: number }>;
    } }>(`/analytics/aggregated${queryString ? `?${queryString}` : ''}`);
    return response.data;
  }

  /**
   * Get litter type distribution data
   */
  async getLitterTypeDistribution(dateRange?: { start: string; end: string }): Promise<LitterTypeDistribution[]> {
    const data = await this.getAggregatedData(dateRange);
    return data.litterTypes;
  }

  /**
   * Get quantity estimation aggregation data
   */
  async getQuantityAggregation(dateRange?: { start: string; end: string }): Promise<QuantityAggregation[]> {
    const data = await this.getAggregatedData(dateRange);
    return data.quantities;
  }

  /**
   * Get comparison metrics for period-over-period analysis
   */
  async getComparisonMetrics(
    currentStart: string,
    currentEnd: string,
    previousStart: string,
    previousEnd: string
  ): Promise<{
    current: { reports: number; events: number; users: number };
    previous: { reports: number; events: number; users: number };
    percentageChange: { reports: number; events: number; users: number };
  }> {
    const params = new URLSearchParams({
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    });

    const response = await apiClient.get<{ success: boolean; data: {
      current: { reports: number; events: number; users: number };
      previous: { reports: number; events: number; users: number };
      percentageChange: { reports: number; events: number; users: number };
    } }>(`/analytics/comparison?${params.toString()}`);
    return response.data;
  }

  /**
   * Export analytics data to CSV
   */
  async exportToCSV(dateRange?: { start: string; end: string }): Promise<Blob> {
    const params = new URLSearchParams();
    
    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }

    const queryString = params.toString();
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api'}/analytics/export${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  }

  /**
   * Get hotspot data for map visualization
   */
  async getHotspots(): Promise<HotspotWithSeverity[]> {
    const hotspots = await apiClient.get<Hotspot[]>('/analytics/hotspots');
    
    // Calculate severity based on score and add to each hotspot
    return hotspots.map(hotspot => ({
      ...hotspot,
      severity: this.calculateHotspotSeverity(hotspot.severityScore, hotspot.reportCount),
    }));
  }

  /**
   * Calculate hotspot severity based on score and report count
   */
  private calculateHotspotSeverity(score: number, reportCount: number): HotspotSeverity {
    // Critical: score >= 0.8 or 20+ reports
    if (score >= 0.8 || reportCount >= 20) {
      return 'critical';
    }
    // High: score >= 0.6 or 15+ reports
    if (score >= 0.6 || reportCount >= 15) {
      return 'high';
    }
    // Medium: score >= 0.4 or 10+ reports
    if (score >= 0.4 || reportCount >= 10) {
      return 'medium';
    }
    // Low: everything else
    return 'low';
  }
}

export const analyticsService = new AnalyticsService();

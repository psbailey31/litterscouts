import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';

export class AnalyticsController {
  /**
   * GET /api/analytics/summary
   * Get overall statistics summary
   */
  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        };
      }

      const summary = await analyticsService.getSummary(dateRange);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch analytics summary',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/analytics/trends
   * Get time series data for trends
   */
  async getTrends(req: Request, res: Response) {
    try {
      const { startDate, endDate, interval = 'day' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate are required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const validIntervals = ['day', 'week', 'month'];
      if (!validIntervals.includes(interval as string)) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'interval must be one of: day, week, month',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const timeSeries = await analyticsService.getTimeSeries(
        new Date(startDate as string),
        new Date(endDate as string),
        interval as 'day' | 'week' | 'month'
      );

      res.json({
        success: true,
        data: timeSeries,
      });
    } catch (error: any) {
      console.error('Error fetching trends:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch trends data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/analytics/comparison
   * Get comparison metrics for period-over-period analysis
   */
  async getComparison(req: Request, res: Response) {
    try {
      const { currentStart, currentEnd, previousStart, previousEnd } = req.query;

      if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'currentStart, currentEnd, previousStart, and previousEnd are required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const comparison = await analyticsService.getComparisonMetrics(
        new Date(currentStart as string),
        new Date(currentEnd as string),
        new Date(previousStart as string),
        new Date(previousEnd as string)
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      console.error('Error fetching comparison metrics:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch comparison metrics',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/analytics/export
   * Export analytics data to CSV
   */
  async exportCSV(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        };
      }

      const csv = await analyticsService.exportToCSV(dateRange);

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="beach-litter-analytics-${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csv);
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to export CSV',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/analytics/aggregated
   * Get aggregated litter type and quantity data
   */
  async getAggregatedData(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        };
      }

      const aggregatedData = await analyticsService.getAggregatedData(dateRange);

      res.json({
        success: true,
        data: aggregatedData,
      });
    } catch (error: any) {
      console.error('Error fetching aggregated data:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch aggregated data',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/analytics/hotspots
   * Get litter hotspot data
   * Requirement 3.2, 3.3, 3.5: Display hotspots with severity indicators
   */
  async getHotspots(req: Request, res: Response) {
    try {
      const hotspots = await analyticsService.getHotspots();

      res.json({
        success: true,
        data: hotspots,
      });
    } catch (error: any) {
      console.error('Error fetching hotspots:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch hotspots',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/analytics/hotspots/:id
   * Get detailed information about a specific hotspot
   */
  async getHotspotDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const hotspotDetails = await analyticsService.getHotspotDetails(id);

      res.json({
        success: true,
        data: hotspotDetails,
      });
    } catch (error: any) {
      console.error('Error fetching hotspot details:', error);
      
      if (error.message === 'Hotspot not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Hotspot not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch hotspot details',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * POST /api/analytics/hotspots/calculate
   * Manually trigger hotspot calculation
   * Requirement 3.4: Update Litter Hotspot calculations
   */
  async calculateHotspots(req: Request, res: Response) {
    try {
      const result = await analyticsService.calculateAndUpdateHotspots();

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error calculating hotspots:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to calculate hotspots',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

export const analyticsController = new AnalyticsController();

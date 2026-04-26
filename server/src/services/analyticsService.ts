import prisma from '../config/database';
import { Parser } from 'json2csv';
import { calculateHotspots, updateHotspotsTable } from '../utils/spatial';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface AnalyticsSummary {
  totalReports: number;
  totalEvents: number;
  totalUsers: number;
  totalLitterCollected: number;
  reportsByType: Record<string, number>;
  reportsByQuantity: Record<string, number>;
  verifiedReports: number;
  cleanedReports: number;
  activeUsers: number;
  upcomingEvents: number;
  completedEvents: number;
}

interface TimeSeriesData {
  date: string;
  reportCount: number;
  eventCount: number;
  litterCollected: number;
}

interface ComparisonMetrics {
  current: {
    reports: number;
    events: number;
    users: number;
  };
  previous: {
    reports: number;
    events: number;
    users: number;
  };
  percentageChange: {
    reports: number;
    events: number;
    users: number;
  };
}

export class AnalyticsService {
  /**
   * Get overall statistics summary
   * Requirement 5.1: Display total count of litter reports aggregated by time period
   */
  async getSummary(dateRange?: DateRange): Promise<AnalyticsSummary> {
    const where: any = {};
    
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    // Total reports
    const totalReports = await prisma.report.count({ where });

    // Total events
    const eventWhere: any = {};
    if (dateRange) {
      eventWhere.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }
    const totalEvents = await prisma.event.count({ where: eventWhere });

    // Total users
    const userWhere: any = {};
    if (dateRange) {
      userWhere.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }
    const totalUsers = await prisma.user.count({ where: userWhere });

    // Reports by type (Requirement 5.2)
    const reportsByTypeRaw = await prisma.report.groupBy({
      by: ['litterType'],
      where,
      _count: {
        id: true,
      },
    });

    const reportsByType: Record<string, number> = {};
    reportsByTypeRaw.forEach((item) => {
      reportsByType[item.litterType] = item._count.id;
    });

    // Reports by quantity (Requirement 5.3)
    const reportsByQuantityRaw = await prisma.report.groupBy({
      by: ['quantity'],
      where,
      _count: {
        id: true,
      },
    });

    const reportsByQuantity: Record<string, number> = {};
    reportsByQuantityRaw.forEach((item) => {
      reportsByQuantity[item.quantity] = item._count.id;
    });

    // Verified reports
    const verifiedReports = await prisma.report.count({
      where: {
        ...where,
        verificationStatus: 'verified',
      },
    });

    // Cleaned reports
    const cleanedReports = await prisma.report.count({
      where: {
        ...where,
        cleanedAt: { not: null },
      },
    });

    // Active users (users who submitted reports or registered for events)
    const activeUsersWithReports = await prisma.report.findMany({
      where,
      select: { userId: true },
      distinct: ['userId'],
    });

    const activeUsersWithEvents = await prisma.eventRegistration.findMany({
      where: dateRange ? {
        registeredAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      } : {},
      select: { userId: true },
      distinct: ['userId'],
    });

    const uniqueActiveUsers = new Set([
      ...activeUsersWithReports.map(r => r.userId),
      ...activeUsersWithEvents.map(e => e.userId),
    ]);
    const activeUsers = uniqueActiveUsers.size;

    // Upcoming and completed events
    const upcomingEvents = await prisma.event.count({
      where: {
        ...eventWhere,
        status: 'upcoming',
      },
    });

    const completedEvents = await prisma.event.count({
      where: {
        ...eventWhere,
        status: 'completed',
      },
    });

    // Total litter collected from completed events
    const litterCollectedResult = await prisma.event.aggregate({
      where: {
        ...eventWhere,
        status: 'completed',
        litterCollected: { not: null },
      },
      _sum: {
        litterCollected: true,
      },
    });

    const totalLitterCollected = litterCollectedResult._sum.litterCollected
      ? parseFloat(litterCollectedResult._sum.litterCollected.toString())
      : 0;

    return {
      totalReports,
      totalEvents,
      totalUsers,
      totalLitterCollected,
      reportsByType,
      reportsByQuantity,
      verifiedReports,
      cleanedReports,
      activeUsers,
      upcomingEvents,
      completedEvents,
    };
  }

  /**
   * Get time series data for trends
   * Requirement 5.4: Show trends comparing current period data to previous periods
   */
  async getTimeSeries(
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<TimeSeriesData[]> {
    // Determine date format based on interval
    let dateFormat: string;
    switch (interval) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'IYYY-IW'; // ISO Year-Week
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        break;
    }

    // Get report counts by date
    const reportData = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        TO_CHAR(created_at, ${dateFormat}) as date,
        COUNT(*) as count
      FROM reports
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY date
      ORDER BY date ASC
    `;

    // Get event counts by date
    const eventData = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        TO_CHAR(scheduled_date, ${dateFormat}) as date,
        COUNT(*) as count
      FROM events
      WHERE scheduled_date >= ${startDate} AND scheduled_date <= ${endDate}
      GROUP BY date
      ORDER BY date ASC
    `;

    // Get litter collected by date
    const litterData = await prisma.$queryRaw<Array<{ date: string; total: string | null }>>`
      SELECT 
        TO_CHAR(scheduled_date, ${dateFormat}) as date,
        SUM(litter_collected) as total
      FROM events
      WHERE scheduled_date >= ${startDate} 
        AND scheduled_date <= ${endDate}
        AND status = 'completed'
        AND litter_collected IS NOT NULL
      GROUP BY date
      ORDER BY date ASC
    `;

    // Merge data by date
    const dateMap = new Map<string, TimeSeriesData>();

    reportData.forEach((item) => {
      dateMap.set(item.date, {
        date: item.date,
        reportCount: Number(item.count),
        eventCount: 0,
        litterCollected: 0,
      });
    });

    eventData.forEach((item) => {
      const existing = dateMap.get(item.date);
      if (existing) {
        existing.eventCount = Number(item.count);
      } else {
        dateMap.set(item.date, {
          date: item.date,
          reportCount: 0,
          eventCount: Number(item.count),
          litterCollected: 0,
        });
      }
    });

    litterData.forEach((item) => {
      const existing = dateMap.get(item.date);
      const litterAmount = item.total ? parseFloat(item.total) : 0;
      if (existing) {
        existing.litterCollected = litterAmount;
      } else {
        dateMap.set(item.date, {
          date: item.date,
          reportCount: 0,
          eventCount: 0,
          litterCollected: litterAmount,
        });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get comparison metrics for period-over-period analysis
   * Requirement 5.4: Show trends comparing current period data to previous periods with percentage change indicators
   */
  async getComparisonMetrics(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<ComparisonMetrics> {
    // Current period metrics
    const currentReports = await prisma.report.count({
      where: {
        createdAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    const currentEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    const currentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
    });

    // Previous period metrics
    const previousReports = await prisma.report.count({
      where: {
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    const previousEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    const previousUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      current: {
        reports: currentReports,
        events: currentEvents,
        users: currentUsers,
      },
      previous: {
        reports: previousReports,
        events: previousEvents,
        users: previousUsers,
      },
      percentageChange: {
        reports: calculatePercentageChange(currentReports, previousReports),
        events: calculatePercentageChange(currentEvents, previousEvents),
        users: calculatePercentageChange(currentUsers, previousUsers),
      },
    };
  }

  /**
   * Export analytics data to CSV
   * Requirement 5.5: Allow Users to export analytics data in CSV format for external analysis
   */
  async exportToCSV(dateRange?: DateRange): Promise<string> {
    const where: any = {};
    
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    // Fetch all reports with relevant data
    const reports = await prisma.report.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
        environmentalConcerns: true,
        verifications: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for CSV export
    const csvData = reports.map((report) => ({
      id: report.id,
      submittedAt: report.submittedAt?.toISOString() || '',
      username: report.user.username,
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
      locationSource: report.locationSource,
      litterType: report.litterType,
      quantity: report.quantity,
      description: report.description || '',
      verificationStatus: report.verificationStatus,
      verificationCount: report.verifications.filter(v => v.verificationType === 'verify').length,
      disputeCount: report.verifications.filter(v => v.verificationType === 'dispute').length,
      cleanedAt: report.cleanedAt?.toISOString() || '',
      photoCount: Array.isArray(report.photoUrls) ? report.photoUrls.length : 0,
      environmentalConcernCount: report.environmentalConcerns.length,
      environmentalConcernTypes: report.environmentalConcerns.map(c => c.concernType).join('; '),
    }));

    // Convert to CSV
    const parser = new Parser({
      fields: [
        'id',
        'submittedAt',
        'username',
        'latitude',
        'longitude',
        'locationSource',
        'litterType',
        'quantity',
        'description',
        'verificationStatus',
        'verificationCount',
        'disputeCount',
        'cleanedAt',
        'photoCount',
        'environmentalConcernCount',
        'environmentalConcernTypes',
      ],
    });

    return parser.parse(csvData);
  }

  /**
   * Get aggregated litter type and quantity data
   * Requirement 5.2: Generate charts showing litter distribution by category type
   * Requirement 5.3: Calculate and display the total estimated quantity of litter reported
   */
  async getAggregatedData(dateRange?: DateRange) {
    const where: any = {};
    
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.startDate,
        lte: dateRange.endDate,
      };
    }

    // Litter type distribution
    const litterTypeData = await prisma.report.groupBy({
      by: ['litterType'],
      where,
      _count: {
        id: true,
      },
    });

    // Quantity distribution
    const quantityData = await prisma.report.groupBy({
      by: ['quantity'],
      where,
      _count: {
        id: true,
      },
    });

    // Verification status distribution
    const verificationData = await prisma.report.groupBy({
      by: ['verificationStatus'],
      where,
      _count: {
        id: true,
      },
    });

    return {
      litterTypes: litterTypeData.map(item => ({
        type: item.litterType,
        count: item._count.id,
      })),
      quantities: quantityData.map(item => ({
        level: item.quantity,
        count: item._count.id,
      })),
      verificationStatus: verificationData.map(item => ({
        status: item.verificationStatus || 'pending',
        count: item._count.id,
      })),
    };
  }

  /**
   * Get hotspot data from the database
   * Requirement 3.2: Identify areas with at least 5 reports within a 500-meter radius over the past 30 days
   * Requirement 3.3: Rank Litter Hotspots by severity score calculated from report quantity and frequency
   * Requirement 3.5: Display Litter Hotspot boundaries on the Map Interface with color-coded severity indicators
   */
  async getHotspots() {
    const hotspots = await prisma.hotspot.findMany({
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      orderBy: {
        severityScore: 'desc',
      },
    });

    return hotspots.map(hotspot => ({
      id: hotspot.id,
      latitude: Number(hotspot.latitude),
      longitude: Number(hotspot.longitude),
      radius: Number(hotspot.radius),
      reportCount: hotspot.reportCount,
      severityScore: Number(hotspot.severityScore),
      lastReportDate: hotspot.lastReportDate.toISOString(),
      calculatedAt: hotspot.calculatedAt?.toISOString(),
    }));
  }

  /**
   * Calculate and update hotspots
   * This method performs the actual hotspot calculation and stores results
   * Requirement 3.2: Identify areas with at least 5 reports within a 500-meter radius
   * Requirement 3.3: Calculate severity scores based on report count and frequency
   * Requirement 3.4: Update Litter Hotspot calculations within 5 minutes of new report submissions
   */
  async calculateAndUpdateHotspots() {
    try {
      console.log('[Hotspot Calculation] Starting hotspot calculation...');
      
      // Use the spatial utility function to update hotspots
      const hotspotsCount = await updateHotspotsTable();
      
      console.log(`[Hotspot Calculation] Successfully calculated ${hotspotsCount} hotspots`);
      
      return {
        success: true,
        hotspotsCalculated: hotspotsCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[Hotspot Calculation] Error calculating hotspots:', error);
      throw new Error(`Failed to calculate hotspots: ${error.message}`);
    }
  }

  /**
   * Get detailed hotspot information including nearby reports
   * @param hotspotId - The ID of the hotspot
   */
  async getHotspotDetails(hotspotId: string) {
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId },
    });

    if (!hotspot) {
      throw new Error('Hotspot not found');
    }

    // Find reports near this hotspot using Haversine formula
    const EARTH_RADIUS = 6371000;
    const reports = await prisma.$queryRaw<Array<{
      id: string;
      latitude: number;
      longitude: number;
      litter_type: string;
      quantity: string;
      created_at: Date;
      distance: number;
    }>>`
      SELECT 
        id, latitude, longitude, litter_type, quantity, created_at,
        (${EARTH_RADIUS} * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS(latitude - ${Number(hotspot.latitude)}) / 2), 2) +
          COS(RADIANS(${Number(hotspot.latitude)})) * COS(RADIANS(latitude)) *
          POWER(SIN(RADIANS(longitude - ${Number(hotspot.longitude)}) / 2), 2)
        ))) AS distance
      FROM reports
      WHERE created_at >= NOW() - INTERVAL '30 days'
      HAVING distance <= ${Number(hotspot.radius)}
      ORDER BY created_at DESC
    `;

    return {
      hotspot: {
        id: hotspot.id,
        latitude: Number(hotspot.latitude),
        longitude: Number(hotspot.longitude),
        radius: Number(hotspot.radius),
        reportCount: hotspot.reportCount,
        severityScore: Number(hotspot.severityScore),
        lastReportDate: hotspot.lastReportDate.toISOString(),
        calculatedAt: hotspot.calculatedAt?.toISOString(),
      },
      reports: reports.map(report => ({
        id: report.id,
        latitude: Number(report.latitude),
        longitude: Number(report.longitude),
        litterType: report.litter_type,
        quantity: report.quantity,
        createdAt: report.created_at.toISOString(),
        distance: Number(report.distance),
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();

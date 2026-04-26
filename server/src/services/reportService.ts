import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { notificationService } from './notificationService';

export interface CreateReportData {
  userId: string;
  latitude: number;
  longitude: number;
  locationSource: 'exif' | 'gps' | 'manual';
  photoUrls: string[];
  photoTimestamp?: Date;
  litterType: string;
  quantity: string;
  description?: string;
  environmentalConcerns?: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
}

export class ReportService {
  async createReport(data: CreateReportData) {
    // Use Prisma client — no point column needed in PostgreSQL
    const report = await prisma.report.create({
      data: {
        userId: data.userId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationSource: data.locationSource as any,
        photoUrls: data.photoUrls,
        photoTimestamp: data.photoTimestamp || null,
        litterType: data.litterType as any,
        quantity: data.quantity as any,
        description: data.description || null,
        environmentalConcerns: data.environmentalConcerns?.length ? {
          create: data.environmentalConcerns.map(c => ({
            concernType: c.type,
            severity: c.severity as any,
            description: c.description,
          })),
        } : undefined,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        environmentalConcerns: true,
      },
    });

    // Trigger notifications asynchronously
    notificationService.notifyNewReport(report.id).catch(error => {
      console.error('Error sending report notifications:', error);
    });

    return report;
  }

  async getReports(filters?: {
    startDate?: Date;
    endDate?: Date;
    litterTypes?: string[];
    quantities?: string[];
    verificationStatus?: string[];
    bounds?: { north: number; south: number; east: number; west: number };
    includeDisputed?: boolean;
  }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters?.litterTypes?.length) where.litterType = { in: filters.litterTypes };
    if (filters?.quantities?.length) where.quantity = { in: filters.quantities };

    if (filters?.verificationStatus?.length) {
      where.verificationStatus = { in: filters.verificationStatus };
    } else if (!filters?.includeDisputed) {
      where.verificationStatus = { not: 'disputed' };
    }

    if (filters?.bounds) {
      where.latitude = { gte: new Prisma.Decimal(filters.bounds.south), lte: new Prisma.Decimal(filters.bounds.north) };
      where.longitude = { gte: new Prisma.Decimal(filters.bounds.west), lte: new Prisma.Decimal(filters.bounds.east) };
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        environmentalConcerns: true,
        verifications: { include: { user: { select: { id: true, username: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports.map(report => {
      const verificationCount = report.verifications.filter(v => v.verificationType === 'verify').length;
      const disputeCount = report.verifications.filter(v => v.verificationType === 'dispute').length;
      return { ...report, latitude: Number(report.latitude), longitude: Number(report.longitude), verificationCount, disputeCount };
    });
  }

  async getReportById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        environmentalConcerns: true,
        verifications: { include: { user: { select: { id: true, username: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!report) return null;

    const verificationCount = report.verifications.filter(v => v.verificationType === 'verify').length;
    const disputeCount = report.verifications.filter(v => v.verificationType === 'dispute').length;
    return { ...report, latitude: Number(report.latitude), longitude: Number(report.longitude), verificationCount, disputeCount };
  }

  async deleteReport(id: string, userId: string) {
    const report = await prisma.report.findUnique({ where: { id }, select: { userId: true } });
    if (!report) throw new Error('Report not found');
    if (report.userId !== userId) throw new Error('Unauthorized to delete this report');
    await prisma.report.delete({ where: { id } });
  }

  async verifyReport(reportId: string, userId: string, comment?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    const existing = await prisma.verification.findUnique({ where: { reportId_userId: { reportId, userId } } });
    if (existing) throw new Error('You have already verified or disputed this report');

    await prisma.verification.create({ data: { reportId, userId, verificationType: 'verify', comment } });
    await this.updateReportVerificationStatus(reportId);
    return this.getReportById(reportId);
  }

  async disputeReport(reportId: string, userId: string, comment?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    const existing = await prisma.verification.findUnique({ where: { reportId_userId: { reportId, userId } } });
    if (existing) throw new Error('You have already verified or disputed this report');

    await prisma.verification.create({ data: { reportId, userId, verificationType: 'dispute', comment } });
    await this.updateReportVerificationStatus(reportId);
    return this.getReportById(reportId);
  }

  private async updateReportVerificationStatus(reportId: string) {
    const verifications = await prisma.verification.findMany({ where: { reportId } });
    const verifyCount = verifications.filter(v => v.verificationType === 'verify').length;
    const disputeCount = verifications.filter(v => v.verificationType === 'dispute').length;

    let status: 'pending' | 'verified' | 'disputed' = 'pending';
    if (disputeCount >= 3) status = 'disputed';
    else if (verifyCount >= 2) status = 'verified';

    await prisma.report.update({ where: { id: reportId }, data: { verificationStatus: status } });
  }

  async markAsCleaned(reportId: string, userId: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');

    await prisma.report.update({ where: { id: reportId }, data: { cleanedAt: new Date(), cleanedByUserId: userId } });
    return this.getReportById(reportId);
  }
}

export const reportService = new ReportService();

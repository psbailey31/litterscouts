import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { reportService } from '../services/reportService';
import { extractExifData } from '../utils/exif';
import prisma from '../config/database';
import { clerkClient } from '@clerk/clerk-sdk-node';

export class ReportController {
  // Helper to find or create user from Clerk ID
  private async findOrCreateUser(clerkId: string): Promise<string> {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (user) {
      return user.id;
    }

    // User doesn't exist, fetch from Clerk and create
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      
      // Generate a clean username from Clerk ID (remove 'user_' prefix if present)
      const cleanClerkId = clerkId.startsWith('user_') ? clerkId.substring(5) : clerkId;
      const defaultUsername = clerkUser.username || `user${cleanClerkId.substring(0, 8)}`;
      
      user = await prisma.user.create({
        data: {
          clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          username: defaultUsername,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          avatarUrl: clerkUser.imageUrl,
        },
        select: { id: true },
      });

      return user.id;
    } catch (error) {
      console.error('Error creating user from Clerk:', error);
      throw new Error('Failed to create user');
    }
  }
  async uploadPhoto(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file uploaded',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Extract EXIF data
      const exifData = await extractExifData(req.file.path);

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/${req.file.filename}`;

      res.json({
        url: fileUrl,
        exifData: {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          timestamp: exifData.timestamp,
        },
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload photo',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async createReport(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const {
        latitude,
        longitude,
        locationSource,
        litterType,
        quantity,
        description,
        photoUrls,
        photoTimestamp,
        environmentalConcerns,
      } = req.body;

      // Validation
      if (!latitude || !longitude) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Latitude and longitude are required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (!photoUrls || photoUrls.length === 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one photo is required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Find or create user in database
      const dbUserId = await this.findOrCreateUser(req.userId);

      const report = await reportService.createReport({
        userId: dbUserId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationSource,
        photoUrls,
        photoTimestamp: photoTimestamp ? new Date(photoTimestamp) : undefined,
        litterType,
        quantity,
        description,
        environmentalConcerns,
      });

      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create report',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async getReports(req: AuthRequest, res: Response) {
    try {
      const {
        startDate,
        endDate,
        litterTypes,
        quantities,
        verificationStatus,
        north,
        south,
        east,
        west,
      } = req.query;

      const filters: any = {};

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (litterTypes) filters.litterTypes = (litterTypes as string).split(',');
      if (quantities) filters.quantities = (quantities as string).split(',');
      if (verificationStatus) filters.verificationStatus = (verificationStatus as string).split(',');
      
      if (north && south && east && west) {
        filters.bounds = {
          north: parseFloat(north as string),
          south: parseFloat(south as string),
          east: parseFloat(east as string),
          west: parseFloat(west as string),
        };
      }

      const reports = await reportService.getReports(filters);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reports',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async getReportById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const report = await reportService.getReportById(id);

      if (!report) {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Report not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.json(report);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch report',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async deleteReport(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { id } = req.params;
      await reportService.deleteReport(id, req.userId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Report not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error.message === 'Unauthorized to delete this report') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You are not authorized to delete this report',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete report',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async verifyReport(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { id } = req.params;
      const { comment } = req.body;

      // Find or create user in database
      const dbUserId = await this.findOrCreateUser(req.userId);

      const report = await reportService.verifyReport(id, dbUserId, comment);

      res.json(report);
    } catch (error: any) {
      console.error('Error verifying report:', error);
      
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Report not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error.message === 'You have already verified or disputed this report') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'You have already verified or disputed this report',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to verify report',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async disputeReport(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { id } = req.params;
      const { comment } = req.body;

      // Find or create user in database
      const dbUserId = await this.findOrCreateUser(req.userId);

      const report = await reportService.disputeReport(id, dbUserId, comment);

      res.json(report);
    } catch (error: any) {
      console.error('Error disputing report:', error);
      
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Report not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error.message === 'You have already verified or disputed this report') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'You have already verified or disputed this report',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to dispute report',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  async markAsCleaned(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { id } = req.params;

      // Find or create user in database
      const dbUserId = await this.findOrCreateUser(req.userId);

      const report = await reportService.markAsCleaned(id, dbUserId);

      res.json(report);
    } catch (error: any) {
      console.error('Error marking report as cleaned:', error);
      
      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Report not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark report as cleaned',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

export const reportController = new ReportController();

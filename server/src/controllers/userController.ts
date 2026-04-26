import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/userService';

export class UserController {
  /**
   * GET /api/users/:id - Get user profile
   */
  async getUserProfile(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const profile = await userService.getUserProfile(id);
      res.json(profile);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * PATCH /api/users/:id - Update user profile
   */
  async updateUserProfile(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, username, email } = req.body;

      // Authorization check - users can only update their own profile
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if the ID in the URL is a Clerk ID or database ID
      const isClerkId = id.startsWith('user_');
      let dbUserId: string;
      
      // If it's a Clerk ID, it should match the authenticated user's Clerk ID
      // If it's a database ID, we need to get the database ID for the authenticated user
      if (isClerkId) {
        // Direct Clerk ID comparison
        if (req.userId !== id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You can only update your own profile',
              timestamp: new Date().toISOString(),
            },
          });
        }
        // Convert Clerk ID to database ID for the update
        dbUserId = await userService.findOrCreateUser(req.userId);
      } else {
        // Database ID comparison - need to get the database ID for the authenticated user
        dbUserId = await userService.findOrCreateUser(req.userId);
        if (dbUserId !== id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You can only update your own profile',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      const updatedProfile = await userService.updateUserProfile(dbUserId, {
        firstName,
        lastName,
        username,
        email,
      });

      res.json(updatedProfile);
    } catch (error: any) {
      console.error('Error updating user profile:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      if (error.message === 'Username already taken') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Username already taken',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/users/:id/reports - Get user's reports
   */
  async getUserReports(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const reports = await userService.getUserReports(id);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching user reports:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user reports',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/users/:id/events - Get user's events
   */
  async getUserEvents(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const events = await userService.getUserEvents(id);
      res.json(events);
    } catch (error) {
      console.error('Error fetching user events:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user events',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * PATCH /api/users/:id/preferences - Update notification preferences
   */
  async updateNotificationPreferences(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { notificationEmail, notificationInApp, areasOfInterest } = req.body;

      // Authorization check
      if (!req.userId) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Check if the ID in the URL is a Clerk ID or database ID
      const isClerkId = id.startsWith('user_');
      
      // If it's a Clerk ID, it should match the authenticated user's Clerk ID
      // If it's a database ID, we need to get the database ID for the authenticated user
      if (isClerkId) {
        // Direct Clerk ID comparison
        if (req.userId !== id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You can only update your own preferences',
              timestamp: new Date().toISOString(),
            },
          });
        }
        // Convert Clerk ID to database ID for the update
        const dbUserId = await userService.findOrCreateUser(req.userId);
        // Update the id variable to use database ID for the service call
        req.params.id = dbUserId;
      } else {
        // Database ID comparison - need to get the database ID for the authenticated user
        const dbUserId = await userService.findOrCreateUser(req.userId);
        if (dbUserId !== id) {
          return res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: 'You can only update your own preferences',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Validate areasOfInterest if provided
      if (areasOfInterest) {
        if (!Array.isArray(areasOfInterest)) {
          return res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'areasOfInterest must be an array',
              timestamp: new Date().toISOString(),
            },
          });
        }

        for (const area of areasOfInterest) {
          if (!area.lat || !area.lng || !area.radius) {
            return res.status(400).json({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Each area must have lat, lng, and radius',
                timestamp: new Date().toISOString(),
              },
            });
          }

          if (area.radius < 1 || area.radius > 50) {
            return res.status(400).json({
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Radius must be between 1 and 50 kilometers',
                timestamp: new Date().toISOString(),
              },
            });
          }
        }
      }

      const updatedPreferences = await userService.updateNotificationPreferences(req.params.id, {
        notificationEmail,
        notificationInApp,
        areasOfInterest,
      });

      res.json(updatedPreferences);
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update notification preferences',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * GET /api/users/:id/activity - Get user's activity timeline
   */
  async getUserActivity(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const activities = await userService.getUserActivity(id);
      res.json(activities);
    } catch (error: any) {
      console.error('Error fetching user activity:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user activity',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * POST /api/users/:id/calculate-impact - Calculate and update impact score
   */
  async calculateImpactScore(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const impactScore = await userService.calculateImpactScore(id);
      res.json({ impactScore });
    } catch (error: any) {
      console.error('Error calculating impact score:', error);

      if (error.message === 'User not found') {
        return res.status(404).json({
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
          },
        });
      }

      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate impact score',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}

export const userController = new UserController();

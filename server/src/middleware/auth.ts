import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authorization token provided',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the session token using networkless verification (JWT)
    const payload = await clerkClient.verifyToken(token);
    
    if (!payload || !payload.sub) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Resolve Clerk ID to internal UUID
    const user = await prisma.user.findUnique({ where: { clerkId: payload.sub } });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication failed. Please check that CLERK_SECRET_KEY is configured correctly in server/.env',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { generateJWT, verifyJWT, JWTPayload, encryptData, decryptData } from './encryption';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate JWT token for user
export function generateUserJWT(user: any): string {
  return generateJWT({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user'
  });
}

// Encrypt sensitive user data
export function encryptUserData(data: string): string {
  return encryptData(data);
}

// Decrypt sensitive user data
export function decryptUserData(encryptedData: string): string {
  return decryptData(encryptedData);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Enhanced authentication middleware with JWT support
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Check if it's a JWT token or session token
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Try JWT verification first
      try {
        const jwtPayload = verifyJWT(token);
        const user = await storage.getUser(jwtPayload.userId);
        
        if (!user) {
          return res.status(401).json({ message: 'User not found' });
        }
        
        req.user = user;
        return next();
      } catch (jwtError) {
        // If JWT fails, try session token fallback
        const user = await storage.getUserBySessionToken(token);
        if (!user) {
          return res.status(401).json({ message: 'Invalid or expired token' });
        }
        
        req.user = user;
        return next();
      }
    } else {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
}

// Admin middleware
export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Optional auth middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    
    try {
      // Try JWT first
      try {
        const jwtPayload = verifyJWT(token);
        const user = await storage.getUser(jwtPayload.userId);
        if (user) {
          req.user = user;
        }
      } catch (jwtError) {
        // Fallback to session token
        const user = await storage.getUserBySessionToken(token);
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }
  
  next();
}
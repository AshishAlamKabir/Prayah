import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    schoolPermissions?: number[];
    culturePermissions?: number[];
    permissions?: string[];
  };
}

// General authentication middleware
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.cookies.auth_token;
  const token = authHeader;

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role || "user",
      schoolPermissions: user.schoolPermissions as number[] || [],
      culturePermissions: user.culturePermissions as number[] || [],
      permissions: user.permissions as string[] || []
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

// Check if user has admin role (super admin)
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Check if user can manage schools (super admin or school admin)
export const requireSchoolAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role } = req.user;
  if (role === "admin") {
    return next(); // Super admin has access to all schools
  }

  if (role !== "school_admin") {
    return res.status(403).json({ message: "School admin access required" });
  }

  next();
};

// Check if user can manage a specific school
export const requireSpecificSchoolAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role, schoolPermissions } = req.user;
  const schoolId = parseInt(req.params.schoolId || req.body.schoolId);

  if (role === "admin") {
    return next(); // Super admin has access to all schools
  }

  if (role === "school_admin" && schoolPermissions?.includes(schoolId)) {
    return next(); // School admin has access to their specific school
  }

  return res.status(403).json({ message: "Access denied for this school" });
};

// Check if user can manage culture sections (super admin or culture admin)
export const requireCultureAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role } = req.user;
  if (role === "admin") {
    return next(); // Super admin has access to all culture sections
  }

  if (role !== "culture_admin") {
    return res.status(403).json({ message: "Culture admin access required" });
  }

  next();
};

// Check if user can manage a specific culture category
export const requireSpecificCultureAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role, culturePermissions } = req.user;
  const categoryId = parseInt(req.params.categoryId || req.body.categoryId);

  if (role === "admin") {
    return next(); // Super admin has access to all culture sections
  }

  if (role === "culture_admin" && culturePermissions?.includes(categoryId)) {
    return next(); // Culture admin has access to their specific section
  }

  return res.status(403).json({ message: "Access denied for this culture section" });
};

// Check if user has specific permission
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { role, permissions } = req.user;
    
    // Super admin has all permissions
    if (role === "admin") {
      return next();
    }

    // Check if user has the specific permission
    if (permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({ message: `Permission '${permission}' required` });
  };
};

// Get user's accessible schools
export const getUserAccessibleSchools = (user: AuthenticatedRequest["user"]) => {
  if (!user) return [];
  
  if (user.role === "admin") {
    return "all"; // Super admin can access all schools
  }
  
  return user.schoolPermissions || [];
};

// Get user's accessible culture categories
export const getUserAccessibleCultureCategories = (user: AuthenticatedRequest["user"]) => {
  if (!user) return [];
  
  if (user.role === "admin") {
    return "all"; // Super admin can access all culture categories
  }
  
  return user.culturePermissions || [];
};
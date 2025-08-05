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

// Check if school admin has fee payment access enabled by super admin
export const requireFeePaymentAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role, schoolPermissions } = req.user;
  
  // Super admin always has access to fee payment controls
  if (role === "admin") {
    return next();
  }

  // For school admins, check if their school has fee payment enabled
  if (role === "school_admin") {
    if (!schoolPermissions || schoolPermissions.length === 0) {
      return res.status(403).json({ 
        message: "Access denied",
        reason: "No school permissions assigned"
      });
    }

    try {
      // Check if any of the schools this admin manages has fee payment enabled
      let hasPaymentAccess = false;
      
      for (const schoolId of schoolPermissions) {
        const school = await storage.getSchool(schoolId);
        if (school && school.feePaymentEnabled) {
          hasPaymentAccess = true;
          break;
        }
      }

      if (!hasPaymentAccess) {
        return res.status(403).json({
          message: "Access denied",
          reason: "Fee payment access has been disabled for your school(s) by the super admin. Please contact the super admin to enable access.",
          schoolIds: schoolPermissions
        });
      }

      return next();
    } catch (error) {
      console.error("Error checking fee payment access:", error);
      return res.status(500).json({ 
        message: "Error verifying payment access" 
      });
    }
  }

  return res.status(403).json({ 
    message: "Insufficient permissions for fee payment access" 
  });
};

// Check if user can manage a specific school
export const requireSchoolPermission = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role, schoolPermissions } = req.user;
  
  // Super admin can manage all schools
  if (role === "admin") {
    return next();
  }

  // Extract school ID from request (could be in params, body, or query)
  const schoolId = parseInt(req.params.schoolId) || 
                   parseInt(req.body.schoolId) || 
                   parseInt(req.query.schoolId as string);

  if (!schoolId) {
    return res.status(400).json({ message: "School ID required" });
  }

  // Check if school admin has permission for this specific school
  if (role === "school_admin" && schoolPermissions?.includes(schoolId)) {
    return next();
  }

  return res.status(403).json({ message: "Access denied: You can only manage your assigned schools" });
};

// Check if user can manage a specific culture category
export const requireCulturePermission = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const { role, culturePermissions } = req.user;
  
  // Super admin can manage all culture categories
  if (role === "admin") {
    return next();
  }

  // Extract category ID from request
  const categoryId = parseInt(req.params.categoryId) || 
                     parseInt(req.body.categoryId) || 
                     parseInt(req.query.categoryId as string);

  if (!categoryId) {
    return res.status(400).json({ message: "Category ID required" });
  }

  // Check if culture admin has permission for this specific category
  if (role === "culture_admin" && culturePermissions?.includes(categoryId)) {
    return next();
  }

  return res.status(403).json({ message: "Access denied: You can only manage your assigned culture categories" });
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
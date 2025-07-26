import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";

const router = Router();

// Role-based admin dashboard routes
router.get("/dashboard", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user;
    
    // Get user's accessible resources based on role
    let schools = [];
    let cultureCategories = [];

    if (user.role === "admin") {
      // Super admin gets all access
      schools = await storage.getSchools();
      cultureCategories = await storage.getCultureCategories();
    } else if (user.role === "school_admin") {
      // School admin gets access to their assigned schools
      const schoolPermissions = user.schoolPermissions || [];
      for (const schoolId of schoolPermissions) {
        const school = await storage.getSchool(schoolId);
        if (school) schools.push(school);
      }
    } else if (user.role === "culture_admin") {
      // Culture admin gets access to their assigned categories
      const culturePermissions = user.culturePermissions || [];
      for (const categoryId of culturePermissions) {
        const category = await storage.getCultureCategory(categoryId);
        if (category) cultureCategories.push(category);
      }
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      },
      accessibleSchools: schools,
      accessibleCultureCategories: cultureCategories,
      canManageAll: user.role === "admin"
    });

  } catch (error) {
    console.error("Error fetching role-based dashboard data:", error);
    res.status(500).json({ message: "Failed to fetch dashboard data" });
  }
});

// School admin routes  
router.get("/schools", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "school_admin") {
      return res.status(403).json({ message: "School admin access required" });
    }

    let schools = [];
    if (user.role === "admin") {
      schools = await storage.getSchools();
    } else {
      const schoolPermissions = user.schoolPermissions || [];
      for (const schoolId of schoolPermissions) {
        const school = await storage.getSchool(schoolId);
        if (school) schools.push(school);
      }
    }

    res.json(schools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({ message: "Failed to fetch schools" });
  }
});

// Culture admin routes
router.get("/culture", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user;
    
    if (user.role !== "admin" && user.role !== "culture_admin") {
      return res.status(403).json({ message: "Culture admin access required" });
    }

    let categories = [];
    if (user.role === "admin") {
      categories = await storage.getCultureCategories();
    } else {
      const culturePermissions = user.culturePermissions || [];
      for (const categoryId of culturePermissions) {
        const category = await storage.getCultureCategory(categoryId);
        if (category) categories.push(category);
      }
    }

    res.json(categories);
  } catch (error) {
    console.error("Error fetching culture categories:", error);
    res.status(500).json({ message: "Failed to fetch culture categories" });
  }
});

export default router;
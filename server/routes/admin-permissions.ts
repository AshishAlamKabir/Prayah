import express from "express";
import { storage } from "../storage";
import { authenticateToken as authMiddleware, requireAdmin } from "../auth-middleware";

const router = express.Router();

// Get all users with their roles and permissions
router.get("/users", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsersWithPermissions();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update user role and permissions
router.put("/users/:userId/permissions", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { role, schoolPermissions, culturePermissions, permissions } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate role
    const validRoles = ["user", "admin", "school_admin", "culture_admin", "moderator"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updatedUser = await storage.updateUserPermissions(userId, {
      role,
      schoolPermissions: schoolPermissions || [],
      culturePermissions: culturePermissions || [],
      permissions: permissions || []
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User permissions updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user permissions:", error);
    res.status(500).json({ message: "Failed to update user permissions" });
  }
});

// Get all schools (for permission assignment)
router.get("/schools", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const schools = await storage.getSchools();
    res.json(schools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    res.status(500).json({ message: "Failed to fetch schools" });
  }
});

// Get all culture categories (for permission assignment)
router.get("/culture-categories", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const categories = await storage.getCultureCategories();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching culture categories:", error);
    res.status(500).json({ message: "Failed to fetch culture categories" });
  }
});

// Create school admin with specific school permissions
router.post("/create-school-admin", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, schoolIds, firstName, lastName } = req.body;

    if (!username || !email || !password || !Array.isArray(schoolIds)) {
      return res.status(400).json({ 
        message: "Username, email, password, and schoolIds are required" 
      });
    }

    // Check if schools exist
    for (const schoolId of schoolIds) {
      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(400).json({ 
          message: `School with ID ${schoolId} not found` 
        });
      }
    }

    const adminUser = await storage.createSchoolAdmin({
      username,
      email,
      password,
      firstName,
      lastName,
      schoolPermissions: schoolIds
    });

    res.status(201).json({
      message: "School admin created successfully",
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        schoolPermissions: adminUser.schoolPermissions
      }
    });
  } catch (error) {
    console.error("Error creating school admin:", error);
    res.status(500).json({ message: "Failed to create school admin" });
  }
});

// Create culture admin with specific category permissions
router.post("/create-culture-admin", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, categoryIds, firstName, lastName } = req.body;

    if (!username || !email || !password || !Array.isArray(categoryIds)) {
      return res.status(400).json({ 
        message: "Username, email, password, and categoryIds are required" 
      });
    }

    // Check if categories exist
    for (const categoryId of categoryIds) {
      const category = await storage.getCultureCategory(categoryId);
      if (!category) {
        return res.status(400).json({ 
          message: `Culture category with ID ${categoryId} not found` 
        });
      }
    }

    const adminUser = await storage.createCultureAdmin({
      username,
      email,
      password,
      firstName,
      lastName,
      culturePermissions: categoryIds
    });

    res.status(201).json({
      message: "Culture admin created successfully",
      user: {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        culturePermissions: adminUser.culturePermissions
      }
    });
  } catch (error) {
    console.error("Error creating culture admin:", error);
    res.status(500).json({ message: "Failed to create culture admin" });
  }
});

export default router;
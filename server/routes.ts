import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { cache } from "./cache";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import { 
  insertCommunityPostSchema, 
  insertSchoolSchema, 
  insertCultureCategorySchema, 
  insertBookSchema, 
  insertPublishedWorkSchema,
  insertUserSchema,
  insertSchoolNotificationSchema,
  insertCultureProgramSchema,
  insertCultureActivitySchema,
  insertPublicationSubmissionSchema,
  insertSchoolFeePaymentSchema,
  insertFeeStructureSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { 
  authMiddleware, 
  adminMiddleware, 
  optionalAuthMiddleware,
  generateSessionToken, 
  hashPassword, 
  verifyPassword,
  generateUserJWT
} from "./auth";
import { 
  requireSchoolAccess, 
  requireSchoolPermission, 
  requireCulturePermission,
  requireFeePaymentAccess,
  requireAdmin
} from "./auth-middleware";
import roleAdminRoutes from "./routes/role-admin";
import { registerAdminNotificationRoutes } from "./routes/admin-notifications";
import { registerRazorpayRoutes } from "./routes/razorpay";
import schoolFeePaymentRoutes from "./routes/school-fee-payments";
import adminPermissionsRoutes from "./routes/admin-permissions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to verify routes are working
  app.get("/api/test", (req, res) => {
    res.json({ message: "Routes are working" });
  });

  // Enhanced authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const hashedPassword = await hashPassword(validatedData.password);
      
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        role: "user"
      });
      
      const sessionToken = generateSessionToken();
      await storage.createUserSession({
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      
      const userJWT = generateUserJWT(user);
      
      res.cookie('auth_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      res.status(201).json({ user: userJWT, token: sessionToken });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      
      const errorMessage = (error as any)?.message || "Registration failed";
      
      if (errorMessage.includes("duplicate key")) {
        const isEmailDupe = errorMessage.includes("users_email_unique");
        const isUsernameDupe = errorMessage.includes("users_username_unique");
        
        if (isEmailDupe) {
          return res.status(400).json({ message: "Email already exists" });
        } else if (isUsernameDupe) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      console.error("Registration error:", error);
      res.status(500).json({ message: errorMessage });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, identifier, password } = req.body;
      const loginIdentifier = username || identifier;
      
      if (!loginIdentifier || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(loginIdentifier);
      if (!user) {
        user = await storage.getUserByEmail(loginIdentifier);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const sessionToken = generateSessionToken();
      await storage.createUserSession({
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
      
      const userJWT = generateUserJWT(user);
      
      res.cookie('auth_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      res.json({ user: userJWT, token: sessionToken });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Current user endpoint
  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json({ user });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    try {
      const token = req.cookies.auth_token;
      if (token) {
        await storage.deleteUserSession(token);
      }
      
      res.clearCookie('auth_token');
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Books endpoints
  app.get("/api/books", async (req, res) => {
    try {
      const cacheKey = "books";
      let books = cache.get(cacheKey);
      
      if (!books) {
        books = await storage.getBooks();
        cache.set(cacheKey, books, 5 * 60 * 1000);
      }
      
      res.set('Cache-Control', 'public, max-age=300');
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  // Book analytics - simplified
  app.get("/api/admin/book-analytics", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const books = await storage.getBooks();
      
      const analytics = {
        totalBooks: books.length,
        totalStock: 0, // Removed stock functionality
        lowStockCount: 0, // Removed stock functionality
        outOfStockCount: 0, // Removed stock functionality
        booksByCategory: books.reduce((acc: any, book) => {
          acc[book.category] = (acc[book.category] || 0) + 1;
          return acc;
        }, {}),
        recentBooks: books.slice(0, 5)
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching book analytics:", error);
      res.status(500).json({ message: "Failed to fetch book analytics" });
    }
  });

  // Register other route modules
  app.use('/api/role-admin', roleAdminRoutes);
  registerAdminNotificationRoutes(app);
  registerRazorpayRoutes(app);
  app.use('/api/school-fee-payments', schoolFeePaymentRoutes);
  app.use('/api/admin/permissions', adminPermissionsRoutes);

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
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
  insertFeeStructureSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertBookRallyTransactionSchema,
  insertPublicationTransactionSchema,
  insertStudentSchema,
  insertStudentStatusChangeSchema,
  insertStudentFeePaymentSchema,
  insertStudentExcelUploadSchema,
  CLASS_ORDER
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

// For Excel file processing
import XLSX from 'xlsx';

// Student Excel upload storage
const studentUpload = multer({
  dest: 'uploads/students/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to verify routes are working
  app.get("/api/test", (req, res) => {
    res.json({ message: "Routes are working" });
  });

  // Object storage endpoints for media management

  // This endpoint is used to serve public assets.
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // This endpoint is used to serve private objects publicly (for media galleries)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // This endpoint is used to get the upload URL for an object entity.
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Example endpoint for updating media files after upload
  app.put("/api/media-files", async (req, res) => {
    if (!req.body.mediaURL || !req.body.entityType || !req.body.entityId) {
      return res.status(400).json({ 
        error: "mediaURL, entityType, and entityId are required" 
      });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.mediaURL,
      );

      // Update the corresponding entity with the media file information
      if (req.body.entityType === 'school') {
        // Update school media files
        const school = await storage.getSchool(req.body.entityId);
        if (school) {
          const updatedMediaFiles = [...(school.mediaFiles as any[] || []), {
            url: objectPath,
            description: req.body.description || '',
            type: req.body.mediaType || 'image',
            uploadedAt: new Date().toISOString()
          }];
          await storage.updateSchool(req.body.entityId, {
            mediaFiles: updatedMediaFiles
          });
        }
      } else if (req.body.entityType === 'culture') {
        // Update culture category media files
        const category = await storage.getCultureCategory(req.body.entityId);
        if (category) {
          const updatedMediaFiles = [...(category.mediaFiles as any[] || []), {
            url: objectPath,
            description: req.body.description || '',
            type: req.body.mediaType || 'image',
            uploadedAt: new Date().toISOString()
          }];
          await storage.updateCultureCategory(req.body.entityId, {
            mediaFiles: updatedMediaFiles
          });
        }
      }

      res.status(200).json({
        objectPath: objectPath,
        message: "Media file updated successfully"
      });
    } catch (error) {
      console.error("Error updating media file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
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

  // Schools endpoints
  app.get("/api/schools", async (req, res) => {
    try {
      const cacheKey = "schools";
      let schools = cache.get(cacheKey);
      
      if (!schools) {
        schools = await storage.getSchools();
        cache.set(cacheKey, schools, 5 * 60 * 1000);
      }
      
      res.set('Cache-Control', 'public, max-age=300');
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get("/api/schools/:id", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const cacheKey = `school_${schoolId}`;
      let school = cache.get(cacheKey);
      
      if (!school) {
        school = await storage.getSchool(schoolId);
        if (school) {
          cache.set(cacheKey, school, 5 * 60 * 1000);
        }
      }
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      res.set('Cache-Control', 'public, max-age=300');
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  // Update school content (PUT endpoint for ContentEditor)
  app.put("/api/schools/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Update school with the content data from ContentEditor
      const updatedSchool = await storage.updateSchool(schoolId, {
        aboutUs: req.body.aboutUs,
        mission: req.body.mission,
        vision: req.body.vision,
        history: req.body.history,
        principalMessage: req.body.principalMessage,
        detailedDescription: req.body.detailedDescription,
        contactEmail: req.body.contactEmail,
        contactPhone: req.body.contactPhone,
        website: req.body.website,
        achievements: req.body.achievements,
        facilities: req.body.facilities,
        infrastructure: req.body.infrastructure,
        extracurriculars: req.body.extracurriculars
      });

      // Clear cache after update
      cache.delete("schools");
      cache.delete(`school_${schoolId}`);

      res.json(updatedSchool);
    } catch (error) {
      console.error("Error updating school content:", error);
      res.status(500).json({ message: "Failed to update school content" });
    }
  });

  app.get("/api/schools/:id/payment-status", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const school = await storage.getSchool(schoolId);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      res.json({
        feePaymentEnabled: school.feePaymentEnabled || false,
        paymentMethods: school.paymentMethods || [],
        adminApprovalRequired: school.adminApprovalRequired || false
      });
    } catch (error) {
      console.error("Error fetching school payment status:", error);
      res.status(500).json({ message: "Failed to fetch payment status" });
    }
  });

  // Get fee structures for a school
  app.get("/api/schools/:schoolId/fee-structures", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const academicYear = req.query.academicYear as string;
      const feeStructures = await storage.getFeeStructures(schoolId, academicYear);
      
      res.json(feeStructures);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
      res.status(500).json({ message: "Failed to fetch fee structures" });
    }
  });

  // School payment settings endpoint (super admin only)
  app.put("/api/admin/schools/:id/payment-settings", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.id);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const { feePaymentEnabled, paymentMethods, paymentConfig, adminApprovalRequired } = req.body;

      const updatedSchool = await storage.updateSchoolPaymentSettings(schoolId, {
        feePaymentEnabled: feePaymentEnabled ?? false,
        paymentMethods: paymentMethods || [],
        paymentConfig: paymentConfig || {},
        adminApprovalRequired: adminApprovalRequired ?? false
      });

      if (!updatedSchool) {
        return res.status(404).json({ message: "School not found" });
      }

      // Clear school cache
      cache.delete(`school_${schoolId}`);
      cache.delete("schools");

      res.json({
        message: "Payment settings updated successfully",
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error updating school payment settings:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Stock management endpoints
  app.get("/api/admin/book-stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const books = await storage.getBooks();
      const bookStock = books.map(book => ({
        bookId: book.id,
        quantity: book.stock || 0,
        reserved: 0, // Can be extended later for reserved stock
        available: book.stock || 0,
        book: book
      }));
      
      res.json(bookStock);
    } catch (error) {
      console.error("Error fetching book stock:", error);
      res.status(500).json({ message: "Failed to fetch book stock" });
    }
  });

  app.patch("/api/admin/books/:id/stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (isNaN(bookId) || quantity < 0) {
        return res.status(400).json({ message: "Invalid book ID or quantity" });
      }

      const updatedBook = await storage.updateBookStock(bookId, quantity);
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Clear books cache after stock update
      cache.delete("books");

      res.json({ message: "Stock updated successfully", book: updatedBook });
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ message: "Failed to update stock" });
    }
  });

  // Admin book management endpoints
  app.post("/api/admin/books", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(validatedData);
      
      // Clear books cache after adding new book
      cache.delete("books");
      
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error adding book:", error);
      res.status(500).json({ message: "Failed to add book" });
    }
  });

  app.put("/api/admin/books/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }

      const updatedBook = await storage.updateBook(bookId, req.body);
      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Clear books cache after updating book
      cache.delete("books");

      res.json(updatedBook);
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete("/api/admin/books/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      if (isNaN(bookId)) {
        return res.status(400).json({ message: "Invalid book ID" });
      }

      const success = await storage.deleteBook(bookId);
      if (!success) {
        return res.status(404).json({ message: "Book not found" });
      }

      // Clear books cache after deleting book
      cache.delete("books");

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Register other route modules
  app.use('/api/role-admin', roleAdminRoutes);
  registerAdminNotificationRoutes(app);
  registerRazorpayRoutes(app);
  app.use('/api/school-fee-payments', schoolFeePaymentRoutes);
  app.use('/api/admin/permissions', adminPermissionsRoutes);

  // Cart endpoints
  app.get("/api/cart/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user is accessing their own cart or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      
      // Check if user is adding to their own cart
      if (req.user?.id !== validatedData.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", authMiddleware, async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (isNaN(cartItemId) || !quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid cart item ID or quantity" });
      }

      const updatedItem = await storage.updateCartItem(cartItemId, { quantity });
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", authMiddleware, async (req, res) => {
    try {
      const cartItemId = parseInt(req.params.id);
      if (isNaN(cartItemId)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }

      const deleted = await storage.removeFromCart(cartItemId);
      if (!deleted) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  app.delete("/api/cart/user/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user is clearing their own cart or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order endpoints
  app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const orderData = {
        ...req.body,
        userId: req.user?.id,
        status: 'pending',
        paymentStatus: 'pending'
      };
      
      const validatedData = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedData);
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Order items endpoints
  app.post("/api/order-items", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(validatedData);
      res.status(201).json(orderItem);
    } catch (error) {
      console.error("Error creating order item:", error);
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create order item" });
    }
  });

  app.get("/api/orders/:orderId/items", authMiddleware, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const orderItems = await storage.getOrderItems(orderId);
      res.json(orderItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
      res.status(500).json({ message: "Failed to fetch order items" });
    }
  });

  app.get("/api/orders/user/:userId", authMiddleware, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Check if user is accessing their own orders or is admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin order management endpoints
  app.get("/api/admin/orders", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.put("/api/admin/orders/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status, adminNotes, trackingNumber } = req.body;
      
      if (isNaN(orderId) || !status) {
        return res.status(400).json({ message: "Invalid order ID or status" });
      }

      const updateData: any = { status };
      if (adminNotes) updateData.adminNotes = adminNotes;
      if (trackingNumber) updateData.trackingNumber = trackingNumber;

      const updatedOrder = await storage.updateOrderStatus(orderId, updateData);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  app.put("/api/admin/orders/:id/tracking", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { trackingNumber } = req.body;
      
      if (isNaN(orderId) || !trackingNumber) {
        return res.status(400).json({ message: "Invalid order ID or tracking number" });
      }

      const updatedOrder = await storage.updateOrderTracking(orderId, trackingNumber);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order tracking:", error);
      res.status(500).json({ message: "Failed to update tracking number" });
    }
  });

  // ===== BOOK RALLY AUDIT ROUTES =====
  // Financial tracking for book rally operations

  app.get("/api/book-rally-audit", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getBookRallyTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching book rally transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/book-rally-audit", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertBookRallyTransactionSchema.parse({
        ...req.body,
        recordedBy: req.user?.id,
      });

      const transaction = await storage.createBookRallyTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating book rally transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch("/api/book-rally-audit/:id/verify", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const updatedTransaction = await storage.verifyBookRallyTransaction(transactionId, req.user?.id!);
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error verifying book rally transaction:", error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  // ===== PUBLICATIONS AUDIT ROUTES =====
  // Financial tracking for publication operations

  app.get("/api/publications-audit", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getPublicationTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching publication transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/publications-audit", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertPublicationTransactionSchema.parse({
        ...req.body,
        recordedBy: req.user?.id,
      });

      const transaction = await storage.createPublicationTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating publication transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.patch("/api/publications-audit/:id/verify", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const updatedTransaction = await storage.verifyPublicationTransaction(transactionId, req.user?.id!);
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(updatedTransaction);
    } catch (error) {
      console.error("Error verifying publication transaction:", error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  // ===== STUDENT MANAGEMENT SYSTEM ROUTES =====
  // Based on Bokaghat Jatiya Vidyalay requirements

  // Get all students for a school (with optional filters)
  app.get("/api/schools/:schoolId/students", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { className, stream } = req.query;
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const students = await storage.getStudents(
        schoolId,
        className as string,
        stream as string
      );
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Get a specific student
  app.get("/api/students/:id", authMiddleware, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const student = await storage.getStudentById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  // Add a new student
  app.post("/api/schools/:schoolId/students", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      // Parse dates from strings if they exist
      const processedBody = {
        ...req.body,
        schoolId,
        createdBy: req.user?.id, // Use authenticated user ID
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
        admissionDate: req.body.admissionDate ? new Date(req.body.admissionDate) : new Date()
      };

      const validatedData = insertStudentSchema.parse(processedBody);

      const student = await storage.addStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error adding student:", error);
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ 
          message: "Validation error: " + validationError.message,
          details: validationError
        });
      }
      res.status(500).json({ message: "Failed to add student" });
    }
  });

  // Update a student
  app.put("/api/students/:id", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const updatedStudent = await storage.updateStudent(studentId, req.body);
      res.json(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Delete a student
  app.delete("/api/students/:id", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      await storage.deleteStudent(studentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Student Excel upload preview endpoint
  app.post("/api/schools/:schoolId/students/upload/preview", authMiddleware, requireSchoolPermission, studentUpload.single('file'), async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId) || !req.file) {
        return res.status(400).json({ message: "Invalid school ID or no file provided" });
      }

      const fileName = req.file.originalname;
      
      try {
        // Read Excel file using buffer approach  
        const fileBuffer = fs.readFileSync(req.file.path);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Extract class and stream from filename
        const extractedClass = extractClassFromFilename(fileName);
        const extractedStream = extractStreamFromFilename(fileName);

        // Get existing students for duplicate checking
        const existingStudents = await storage.getStudents(schoolId);
        const existingRollNumbers = new Set(existingStudents.map(s => `${s.rollNumber}-${s.className}`));

        // Preview first 10 rows with enhanced validation
        const preview = [];
        const validationErrors: string[] = [];
        const duplicateCheck = new Set();

        for (let i = 0; i < Math.min(10, data.length); i++) {
          try {
            const row = data[i] as any;
            const studentData = mapExcelRowToStudentEnhanced(row, extractedClass, extractedStream, schoolId);
            const cleanedData = cleanAndValidateStudentData(studentData, i + 2);
            
            // Check for duplicates within file and existing data
            const rollKey = `${cleanedData.rollNumber}-${cleanedData.className}`;
            if (duplicateCheck.has(rollKey)) {
              validationErrors.push(`Row ${i + 2}: Duplicate roll number ${cleanedData.rollNumber} within file`);
            } else if (existingRollNumbers.has(rollKey)) {
              validationErrors.push(`Row ${i + 2}: Student ${cleanedData.rollNumber} already exists in ${cleanedData.className}`);
            }
            duplicateCheck.add(rollKey);

            preview.push({
              rowNumber: i + 2,
              original: row,
              mapped: cleanedData,
              isValid: true
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            validationErrors.push(`Row ${i + 2}: ${errorMessage}`);
            preview.push({
              rowNumber: i + 2,
              original: data[i],
              mapped: null,
              isValid: false,
              error: errorMessage
            });
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          fileName: fileName,
          detectedClass: extractedClass,
          detectedStream: extractedStream,
          totalRows: data.length,
          preview,
          validationErrors,
          columnMapping: detectColumnMapping(data[0] || {}),
          estimatedValidRows: Math.max(0, data.length - validationErrors.length)
        });
      } catch (error) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error processing Excel preview:", error);
      res.status(500).json({ message: "Failed to process Excel file for preview" });
    }
  });

  // Enhanced Excel upload for students
  app.post("/api/schools/:schoolId/students/upload", authMiddleware, requireSchoolPermission, studentUpload.single('file'), async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId) || !req.file) {
        return res.status(400).json({ message: "Invalid school ID or no file provided" });
      }

      const fileName = req.file.originalname;
      
      try {
        // Read Excel file using buffer approach
        const fileBuffer = fs.readFileSync(req.file.path);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // Extract class and stream from filename
        const extractedClass = extractClassFromFilename(fileName);
        const extractedStream = extractStreamFromFilename(fileName);

        // Get existing students for duplicate checking
        const existingStudents = await storage.getStudents(schoolId);
        const existingRollNumbers = new Set(existingStudents.map(s => `${s.rollNumber}-${s.className}`));
        
        const errors: string[] = [];
        let successfulImports = 0;
        let failedImports = 0;
        const duplicateCheck = new Set();
        
        // Process each row with enhanced validation
        for (let i = 0; i < data.length; i++) {
          try {
            const row = data[i] as any;
            const studentData = mapExcelRowToStudentEnhanced(row, extractedClass, extractedStream, schoolId);
            const cleanedData = cleanAndValidateStudentData(studentData, i + 2);
            
            // Check for duplicates within file
            const rollKey = `${cleanedData.rollNumber}-${cleanedData.className}`;
            if (duplicateCheck.has(rollKey)) {
              throw new Error(`Duplicate roll number ${cleanedData.rollNumber} within file`);
            }
            duplicateCheck.add(rollKey);

            // Check for existing students
            if (existingRollNumbers.has(rollKey)) {
              throw new Error(`Student ${cleanedData.rollNumber} already exists in ${cleanedData.className}`);
            }
            
            // Validate and create student
            const validatedData = insertStudentSchema.parse({
              ...cleanedData,
              createdBy: req.user.id
            });

            await storage.addStudent(validatedData);
            successfulImports++;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Row ${i + 2}: ${errorMessage}`);
            failedImports++;
          }
        }
        
        // Record the upload history
        await storage.recordExcelUpload({
          schoolId,
          fileName: fileName,
          extractedClass,
          extractedStream,
          totalRows: data.length,
          successfulImports,
          failedImports,
          errors,
          uploadedBy: req.user.id
        });
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
          message: "File processed successfully",
          fileName: fileName,
          detectedClass: extractedClass,
          detectedStream: extractedStream,
          totalRows: data.length,
          successfulImports,
          failedImports,
          errors: errors.length > 0 ? errors.slice(0, 30) : [] // Show more errors for debugging
        });
      } catch (error) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({ message: "Failed to process Excel file" });
    }
  });

  // Get Excel upload history
  app.get("/api/schools/:schoolId/students/uploads", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const uploads = await storage.getExcelUploadHistory(schoolId);
      res.json(uploads);
    } catch (error) {
      console.error("Error fetching upload history:", error);
      res.status(500).json({ message: "Failed to fetch upload history" });
    }
  });

  // Get class hierarchy for proper ordering
  app.get("/api/class-hierarchy", async (req, res) => {
    try {
      const classOrder = {
        'Ankur': 1, 'Kuhi': 2, 'Sopan': 3,
        'I': 4, 'II': 5, 'III': 6, 'IV': 7, 'V': 8,
        'VI': 9, 'VII': 10, 'VIII': 11, 'IX': 12, 'X': 13,
        'XI Arts': 14, 'XI Commerce': 15, 'XI Science': 16,
        'XII Arts': 17, 'XII Commerce': 18, 'XII Science': 19
      };
      
      const classList = Object.keys(classOrder);
      
      res.json({
        classOrder,
        classList
      });
    } catch (error) {
      console.error("Error fetching class hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch class hierarchy" });
    }
  });

  // Update student status (promotion, demotion, dropout)
  app.put("/api/students/:id/status", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { newStatus, newClass, reason } = req.body;
      
      if (isNaN(studentId) || !newStatus) {
        return res.status(400).json({ message: "Invalid student ID or status" });
      }
      
      const statusChange = await storage.updateStudentStatus(
        studentId,
        newStatus,
        newClass,
        reason,
        req.user.id
      );
      
      res.json(statusChange);
    } catch (error) {
      console.error("Error updating student status:", error);
      res.status(500).json({ message: "Failed to update student status" });
    }
  });

  // Get student status history
  app.get("/api/students/:id/status-history", authMiddleware, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const history = await storage.getStudentStatusHistory(studentId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching student status history:", error);
      res.status(500).json({ message: "Failed to fetch status history" });
    }
  });

  // Add student fee payment
  app.post("/api/students/:id/payments", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const validatedData = insertStudentFeePaymentSchema.parse({
        ...req.body,
        studentId,
        collectedBy: req.user.id
      });

      const payment = await storage.addStudentFeePayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error adding student fee payment:", error);
      res.status(500).json({ message: "Failed to add fee payment" });
    }
  });

  // Get student fee payments
  app.get("/api/students/:id/payments", authMiddleware, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const { academicYear } = req.query;
      
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }

      const payments = await storage.getStudentFeePayments(studentId, academicYear as string);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching student payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get fee payments summary for a school
  app.get("/api/schools/:schoolId/payments/summary", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { paymentMode, academicYear } = req.query;
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const summary = await storage.getSchoolFeePaymentsSummary(
        schoolId,
        paymentMode as string,
        academicYear as string
      );
      res.json(summary);
    } catch (error) {
      console.error("Error fetching payments summary:", error);
      res.status(500).json({ message: "Failed to fetch payments summary" });
    }
  });

  // Utility endpoints
  app.get("/api/class-hierarchy", (req, res) => {
    res.json({
      classOrder: CLASS_ORDER,
      classList: storage.getClassList()
    });
  });

  app.get("/api/class/:className/next", (req, res) => {
    const nextClass = storage.getNextClass(req.params.className);
    res.json({ nextClass });
  });

  app.get("/api/class/:className/previous", (req, res) => {
    const previousClass = storage.getPreviousClass(req.params.className);
    res.json({ previousClass });
  });

  // Get dropout students
  app.get("/api/schools/:schoolId/students/dropouts", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const dropouts = await storage.getDropoutStudents(schoolId);
      res.json(dropouts);
    } catch (error) {
      console.error("Error fetching dropout students:", error);
      res.status(500).json({ message: "Failed to fetch dropout students" });
    }
  });

  // Get students by status
  app.get("/api/schools/:schoolId/students/status/:status", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const status = req.params.status;
      
      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      const students = await storage.getStudentsByStatus(schoolId, status);
      res.json(students);
    } catch (error) {
      console.error("Error fetching students by status:", error);
      res.status(500).json({ message: "Failed to fetch students by status" });
    }
  });

  // Culture Categories endpoints
  app.get("/api/culture-categories", async (req, res) => {
    try {
      const cacheKey = "culture_categories";
      let categories = cache.get(cacheKey);
      
      if (!categories) {
        categories = await storage.getCultureCategories();
        cache.set(cacheKey, categories, 5 * 60 * 1000);
      }
      
      res.set('Cache-Control', 'public, max-age=300');
      res.json(categories);
    } catch (error) {
      console.error("Error fetching culture categories:", error);
      res.status(500).json({ message: "Failed to fetch culture categories" });
    }
  });

  // Update culture category content (PUT endpoint for ContentEditor)
  app.put("/api/culture-categories/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getCultureCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Culture category not found" });
      }

      // Update culture category with the content data from ContentEditor
      const updatedCategory = await storage.updateCultureCategory(categoryId, {
        aboutSection: req.body.aboutSection,
        detailedDescription: req.body.detailedDescription,
        objectives: req.body.objectives,
        activities: req.body.activities,
        instructorInfo: req.body.instructorInfo,
        scheduleInfo: req.body.scheduleInfo,
        requirements: req.body.requirements,
        achievements: req.body.achievements,
        history: req.body.history,
        philosophy: req.body.philosophy,
        youtubeChannelUrl: req.body.youtubeChannelUrl
      });

      // Clear cache after update
      cache.delete("culture_categories");
      cache.delete(`culture_category_${categoryId}`);

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating culture category content:", error);
      res.status(500).json({ message: "Failed to update culture category content" });
    }
  });

  // Culture Wing Audit endpoints
  app.get("/api/culture-wing-audit/:wingId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const wingId = parseInt(req.params.wingId);
      if (isNaN(wingId)) {
        return res.status(400).json({ message: "Invalid wing ID" });
      }

      const transactions = await storage.getCultureWingTransactions(wingId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching culture wing transactions:", error);
      res.status(500).json({ message: "Failed to fetch culture wing transactions" });
    }
  });

  app.post("/api/culture-wing-audit", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { wingId, transactionType, amount, description, participantName, instructorName, programName, date, notes } = req.body;

      if (!wingId || !transactionType || !amount || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const transaction = await storage.createCultureWingTransaction({
        wingId,
        transactionType,
        amount: parseFloat(amount).toString(),
        description,
        participantName,
        instructorName,
        programName,
        date: new Date(date),
        notes,
        recordedBy: req.user!.id
      });

      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating culture wing transaction:", error);
      res.status(500).json({ message: "Failed to create culture wing transaction" });
    }
  });

  app.patch("/api/culture-wing-audit/:id/verify", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const transaction = await storage.verifyCultureWingTransaction(transactionId, req.user!.id);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error verifying culture wing transaction:", error);
      res.status(500).json({ message: "Failed to verify culture wing transaction" });
    }
  });

  // Platform Settings endpoints
  app.get("/api/platform-settings", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching platform settings:", error);
      res.status(500).json({ message: "Failed to fetch platform settings" });
    }
  });

  app.put("/api/platform-settings", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const settings = await storage.updatePlatformSettings(req.body);
      if (!settings) {
        return res.status(404).json({ message: "Platform settings not found" });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error updating platform settings:", error);
      res.status(500).json({ message: "Failed to update platform settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for Excel filename parsing
function extractClassFromFilename(filename: string): string | null {
  // Extract class from filenames like "XII_arts.xlsx", "Kuhi.xlsx", "I.xlsx"
  const name = filename.toLowerCase().replace(/\.(xlsx|xls)$/, '');
  
  // Check for class patterns
  const patterns = [
    /^(ankur)$/i,
    /^(kuhi)$/i, 
    /^(sopan)$/i,
    /^([ivx]+)$/i, // Roman numerals I-X
    /^([ivx]+)_(arts?|commerce?|science?)$/i, // XI_arts, XII_science
  ];
  
  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      if (match[2]) {
        // Handle stream classes like XI_arts
        const classNum = match[1].toUpperCase();
        const stream = match[2].toLowerCase();
        if (stream.startsWith('art')) return `${classNum} Arts`;
        if (stream.startsWith('comm')) return `${classNum} Commerce`;
        if (stream.startsWith('sci')) return `${classNum} Science`;
      } else {
        // Handle simple classes
        const className = match[1];
        if (className.match(/^[ivx]+$/i)) return className.toUpperCase();
        return className.charAt(0).toUpperCase() + className.slice(1).toLowerCase();
      }
    }
  }
  
  return null;
}

function extractStreamFromFilename(filename: string): string | null {
  const name = filename.toLowerCase();
  if (name.includes('art')) return 'Arts';
  if (name.includes('comm')) return 'Commerce';
  if (name.includes('sci')) return 'Science';
  return null;
}

// Enhanced data mapping function based on actual CSV structure
function mapExcelRowToStudentEnhanced(row: any, extractedClass: string | null, extractedStream: string | null, schoolId: number) {
  // Handle full name construction from separate fields
  let fullName = '';
  if (row.first_name || row.First_Name || row['First Name']) {
    const firstName = row.first_name || row.First_Name || row['First Name'] || '';
    const middleName = row.middlename || row.Middle_Name || row['Middle Name'] || '';
    const lastName = row.last_name || row.Last_Name || row['Last Name'] || '';
    fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  }
  
  // Fallback to single name field
  if (!fullName) {
    fullName = row.Name || row.name || row['Student Name'] || row.student_name || '';
  }
  
  return {
    schoolId,
    name: fullName.trim(),
    rollNumber: (row.roll_no || row.RollNumber || row.roll_number || row['Roll Number'] || row.Roll || '').toString(),
    className: extractedClass || row.Class || row.class || '',
    stream: extractedStream || row.Stream || row.stream || null,
    parentName: row.father_name || row.Father_Name || row['Father Name'] || 
                row.mother_name || row.Mother_Name || row['Mother Name'] ||
                row.ParentName || row.parent_name || row['Parent Name'] || null,
    contactNumber: row.mobile_no || row.Mobile_No || row['Mobile No'] || 
                  row.ContactNumber || row.contact_number || row['Contact Number'] || 
                  row.father_phone || row.mother_phone || null,
    address: row.current_address || row.permanent_address || row.Address || row.address || 
            row['Current Address'] || row['Permanent Address'] || null,
    dateOfBirth: row.date_of_birth || row['Date of Birth'] || row.dob || null,
    gender: row.gender || row.Gender || null,
    bloodGroup: row.blood_group || row['Blood Group'] || null,
    category: row.category || row.Category || row.caste || row.Caste || null,
    religion: row.religion || row.Religion || null,
    previousSchool: row.previous_school || row['Previous School'] || null,
    admissionDate: new Date(),
    status: 'active'
  };
}

// Data cleaning and validation function
function cleanAndValidateStudentData(studentData: any, rowNumber: number) {
  const cleaned = { ...studentData };
  
  // Clean name
  if (!cleaned.name || cleaned.name.trim() === '') {
    throw new Error('Student name is required');
  }
  cleaned.name = cleaned.name.trim().replace(/\s+/g, ' ');
  
  // Clean roll number
  if (!cleaned.rollNumber || cleaned.rollNumber.trim() === '') {
    throw new Error('Roll number is required');
  }
  cleaned.rollNumber = cleaned.rollNumber.toString().trim();
  
  // Clean class name
  if (!cleaned.className || cleaned.className.trim() === '') {
    throw new Error('Class is required');
  }
  
  // Clean phone number (handle scientific notation)
  if (cleaned.contactNumber) {
    let phoneStr = cleaned.contactNumber.toString();
    
    // Handle scientific notation (e.g., 9.15255E+11)
    if (phoneStr.includes('E+') || phoneStr.includes('e+')) {
      const num = parseFloat(phoneStr);
      phoneStr = num.toFixed(0);
    }
    
    // Remove any non-digits except + at start
    phoneStr = phoneStr.replace(/[^\d+]/g, '');
    
    // Validate Indian phone number format
    if (phoneStr.length === 10 && /^[6-9]/.test(phoneStr)) {
      cleaned.contactNumber = phoneStr;
    } else if (phoneStr.length === 11 && phoneStr.startsWith('0')) {
      cleaned.contactNumber = phoneStr.substring(1);
    } else if (phoneStr.length > 10) {
      // Take last 10 digits if longer
      cleaned.contactNumber = phoneStr.slice(-10);
    } else {
      cleaned.contactNumber = phoneStr; // Keep as is for now
    }
  }
  
  // Clean date of birth
  if (cleaned.dateOfBirth && cleaned.dateOfBirth !== 'xxx' && cleaned.dateOfBirth !== '') {
    try {
      // Handle various date formats
      const dateStr = cleaned.dateOfBirth.toString();
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        cleaned.dateOfBirth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
      } else if (dateStr.includes('-')) {
        cleaned.dateOfBirth = new Date(dateStr).toISOString();
      }
    } catch (error) {
      cleaned.dateOfBirth = null;
    }
  } else {
    cleaned.dateOfBirth = null;
  }
  
  // Clean gender
  if (cleaned.gender) {
    const genderLower = cleaned.gender.toString().toLowerCase();
    if (genderLower.includes('male')) cleaned.gender = 'male';
    else if (genderLower.includes('female')) cleaned.gender = 'female';
    else cleaned.gender = 'other';
  }
  
  // Clean parent name
  if (cleaned.parentName && cleaned.parentName !== 'xxxxx' && cleaned.parentName !== 'XXXXXXXXXXX') {
    cleaned.parentName = cleaned.parentName.trim().replace(/\s+/g, ' ');
  } else {
    cleaned.parentName = null;
  }
  
  return cleaned;
}

// Detect column mapping from the data
function detectColumnMapping(row: any): Record<string, string[]> {
  const mapping: Record<string, string[]> = {
    name: [],
    rollNumber: [],
    parentName: [],
    contactNumber: [],
    address: [],
    dateOfBirth: [],
    gender: [],
    other: []
  };
  
  Object.keys(row || {}).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('name') && !lowerKey.includes('parent') && !lowerKey.includes('father') && !lowerKey.includes('mother')) {
      mapping.name.push(key);
    } else if (lowerKey.includes('roll')) {
      mapping.rollNumber.push(key);
    } else if (lowerKey.includes('parent') || lowerKey.includes('father') || lowerKey.includes('mother')) {
      mapping.parentName.push(key);
    } else if (lowerKey.includes('mobile') || lowerKey.includes('phone') || lowerKey.includes('contact')) {
      mapping.contactNumber.push(key);
    } else if (lowerKey.includes('address')) {
      mapping.address.push(key);
    } else if (lowerKey.includes('birth') || lowerKey.includes('dob')) {
      mapping.dateOfBirth.push(key);
    } else if (lowerKey.includes('gender')) {
      mapping.gender.push(key);
    } else {
      mapping.other.push(key);
    }
  });
  
  return mapping;
}

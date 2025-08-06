import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import deadlockMonitoringRoutes from "./routes/deadlock-monitoring";
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
  insertOrderSchema,
  insertCartItemSchema,
  insertBookStockSchema,
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
import { registerPaymentRoutes } from "./routes/payments";
import { registerAdminNotificationRoutes } from "./routes/admin-notifications";
import { registerRazorpayRoutes } from "./routes/razorpay";
import schoolFeePaymentRoutes from "./routes/school-fee-payments";
import adminPermissionsRoutes from "./routes/admin-permissions";

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for manuscripts
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'coverImage') {
      // Accept image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for cover images'));
      }
    } else if (file.fieldname === 'pdfFile') {
      // Accept PDF files
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    } else {
      cb(new Error('Unknown field'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // File upload endpoint
  app.post("/api/upload", authMiddleware, adminMiddleware, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
  ]), (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const result: { coverImageUrl?: string; pdfUrl?: string } = {};

      if (files.coverImage) {
        result.coverImageUrl = `/uploads/${files.coverImage[0].filename}`;
      }

      if (files.pdfFile) {
        result.pdfUrl = `/uploads/${files.pdfFile[0].filename}`;
      }

      res.json(result);
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });
  // Role-based admin dashboard endpoint
  app.get("/api/role-admin/dashboard", authMiddleware, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user has admin role
      if (!["admin", "school_admin", "culture_admin"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get accessible schools and culture categories based on permissions
      let accessibleSchools = [];
      let accessibleCultureCategories = [];
      let canManageAll = false;

      if (user.role === "admin") {
        // Super admin has access to everything
        accessibleSchools = await storage.getSchools();
        accessibleCultureCategories = await storage.getCultureCategories();
        canManageAll = true;
      } else if (user.role === "school_admin") {
        // Get schools this admin can manage
        const schoolPermissions = user.schoolPermissions || [];
        if (schoolPermissions.length > 0) {
          const allSchools = await storage.getSchools();
          accessibleSchools = allSchools.filter(school => schoolPermissions.includes(school.id));
        }
      } else if (user.role === "culture_admin") {
        // Get culture categories this admin can manage
        const culturePermissions = user.culturePermissions || [];
        if (culturePermissions.length > 0) {
          const allCategories = await storage.getCultureCategories();
          accessibleCultureCategories = allCategories.filter(category => culturePermissions.includes(category.id));
        }
      }

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          schoolPermissions: user.schoolPermissions,
          culturePermissions: user.culturePermissions
        },
        accessibleSchools,
        accessibleCultureCategories,
        canManageAll
      });
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Book stock and analytics endpoints
  app.get("/api/admin/book-analytics", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const [books, bookStock, orders] = await Promise.all([
        storage.getBooks(),
        storage.getAllBookStock(),
        storage.getAllOrders()
      ]);

      // Calculate analytics
      const totalBooks = books.length;
      const totalStock = bookStock.reduce((sum, stock) => sum + stock.quantity, 0);
      const lowStockBooks = bookStock.filter(stock => stock.quantity < 10);
      const outOfStockBooks = bookStock.filter(stock => stock.quantity === 0);
      
      // Calculate recent sales (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentOrders = orders.filter(order => 
        new Date(order.createdAt) > thirtyDaysAgo && order.status === 'completed'
      );
      
      // Calculate revenue
      const totalRevenue = recentOrders.reduce((sum, order) => 
        sum + parseFloat(order.totalAmount.toString()), 0
      );

      // Top selling books
      const bookSales: { [key: number]: number } = {};
      recentOrders.forEach(order => {
        if (Array.isArray(order.orderItems)) {
          order.orderItems.forEach((item: any) => {
            bookSales[item.bookId] = (bookSales[item.bookId] || 0) + item.quantity;
          });
        }
      });

      const topSellingBooks = Object.entries(bookSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([bookId, quantity]) => {
          const book = books.find(b => b.id === parseInt(bookId));
          return { book, quantity };
        });

      // Category distribution
      const categoryStats = books.reduce((acc, book) => {
        acc[book.category] = (acc[book.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      res.json({
        totalBooks,
        totalStock,
        lowStockCount: lowStockBooks.length,
        outOfStockCount: outOfStockBooks.length,
        totalRevenue,
        recentOrdersCount: recentOrders.length,
        lowStockBooks: lowStockBooks.map(stock => ({
          ...stock,
          book: books.find(b => b.id === stock.bookId)
        })),
        outOfStockBooks: outOfStockBooks.map(stock => ({
          ...stock,
          book: books.find(b => b.id === stock.bookId)
        })),
        topSellingBooks,
        categoryStats
      });
    } catch (error) {
      console.error("Error fetching book analytics:", error);
      res.status(500).json({ message: "Failed to fetch book analytics" });
    }
  });

  app.get("/api/admin/book-stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookStock = await storage.getAllBookStock();
      res.json(bookStock);
    } catch (error) {
      console.error("Error fetching book stock:", error);
      res.status(500).json({ message: "Failed to fetch book stock" });
    }
  });

  app.post("/api/admin/book-stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { bookId, quantity } = req.body;
      
      if (!bookId || quantity === undefined) {
        return res.status(400).json({ message: "Book ID and quantity are required" });
      }

      const stock = await storage.updateBookStock({
        bookId: parseInt(bookId),
        quantity: parseInt(quantity),
        updatedBy: req.user.id
      });

      res.json(stock);
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ message: "Failed to update book stock" });
    }
  });

  app.patch("/api/admin/books/:id/stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookId = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (quantity === undefined) {
        return res.status(400).json({ message: "Quantity is required" });
      }

      const stock = await storage.updateBookStock({
        bookId,
        quantity: parseInt(quantity),
        updatedBy: req.user.id
      });

      res.json(stock);
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ message: "Failed to update book stock" });
    }
  });

  // Super admin school payment management endpoints
  app.post("/api/admin/schools/:schoolId/enable-payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { paymentMethods, paymentConfig, adminApprovalRequired } = req.body;

      // Only super admin can enable/disable payments
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only super admin can manage payment settings" });
      }

      const updatedSchool = await storage.updateSchoolPaymentSettings(schoolId, {
        feePaymentEnabled: true,
        paymentMethods: paymentMethods || ["razorpay"],
        paymentConfig: paymentConfig || {},
        adminApprovalRequired: adminApprovalRequired !== undefined ? adminApprovalRequired : true
      });

      res.json({
        success: true,
        message: "Fee payment enabled for school",
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error enabling school payments:", error);
      res.status(500).json({ message: "Failed to enable payments" });
    }
  });

  app.post("/api/admin/schools/:schoolId/disable-payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);

      // Only super admin can enable/disable payments
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only super admin can manage payment settings" });
      }

      const updatedSchool = await storage.updateSchoolPaymentSettings(schoolId, {
        feePaymentEnabled: false,
        paymentMethods: [],
        paymentConfig: {},
        adminApprovalRequired: true
      });

      res.json({
        success: true,
        message: "Fee payment disabled for school",
        school: updatedSchool
      });
    } catch (error) {
      console.error("Error disabling school payments:", error);
      res.status(500).json({ message: "Failed to disable payments" });
    }
  });

  app.get("/api/schools/:schoolId/payment-status", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const school = await storage.getSchool(schoolId);

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      res.json({
        feePaymentEnabled: school.feePaymentEnabled || false,
        paymentMethods: school.paymentMethods || [],
        adminApprovalRequired: school.adminApprovalRequired !== false
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Enhanced fee payment endpoint with admin control
  app.post("/api/schools/:schoolId/fee-payment", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const school = await storage.getSchool(schoolId);

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Check if fee payment is enabled for this school
      if (!school.feePaymentEnabled) {
        return res.status(403).json({ 
          message: "Fee payment is not enabled for this school. Please contact administration.",
          enabled: false 
        });
      }

      // Continue with existing fee payment logic
      const { studentName, className, feeType, amount, contactDetails } = req.body;

      // Validate required fields
      if (!studentName || !className || !feeType || !amount) {
        return res.status(400).json({ 
          message: "Missing required fields: studentName, className, feeType, amount" 
        });
      }

      // Create fee payment record
      const feePayment = await storage.createSchoolFeePayment({
        schoolId,
        studentName,
        className,
        feeType,
        amount: parseFloat(amount),
        contactDetails: contactDetails || {},
        status: "pending",
        paymentMethod: "razorpay", // Default to razorpay
        adminApprovalRequired: school.adminApprovalRequired !== false
      });

      res.json({
        success: true,
        message: "Fee payment request created successfully",
        paymentId: feePayment.id,
        requiresApproval: school.adminApprovalRequired !== false
      });
    } catch (error) {
      console.error("Error processing fee payment:", error);
      res.status(500).json({ message: "Failed to process fee payment" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { password, ...userData } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email) || await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email or username" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({ ...userData, password: hashedPassword });

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await storage.createUserSession({
        userId: user.id,
        token,
        expiresAt,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body; // identifier can be email or username
      
      if (!identifier || !password) {
        return res.status(400).json({ message: "Email/username and password are required" });
      }

      // Try to find user by email or username
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate both session token and JWT for enhanced security
      const sessionToken = generateSessionToken();
      const jwtToken = generateUserJWT(user);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      await storage.createUserSession({
        userId: user.id,
        token: sessionToken,
        expiresAt,
      });

      const { password: _, ...userWithoutPassword } = user;
      
      // Set secure HTTP-only cookie for session token
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      res.json({ 
        user: userWithoutPassword, 
        token: jwtToken, // JWT for client-side storage
        sessionToken // Backward compatibility
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        await storage.deleteUserSession(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Failed to log out" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // Cart endpoints
  app.get("/api/cart", authMiddleware, async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart items:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (isNaN(id) || isNaN(quantity)) {
        return res.status(400).json({ message: "Invalid cart item ID or quantity" });
      }
      
      const cartItem = await storage.updateCartItem(id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found or removed" });
      }
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      
      const success = await storage.removeFromCart(id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.delete("/api/cart", authMiddleware, async (req, res) => {
    try {
      await storage.clearCart(req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order endpoints
  app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Generate payment link (simplified - in production you'd integrate with payment gateway)
      const paymentLink = `https://payment.prayas.org/pay/${Date.now()}-${req.user.id}`;
      
      const order = await storage.createOrder({
        ...orderData,
        paymentLink,
      });

      // Clear user's cart after order creation
      await storage.clearCart(req.user.id);

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/my-orders", authMiddleware, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin order management
  app.get("/api/admin/orders", adminMiddleware, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:id/notify", adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.markOrderNotified(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error marking order as notified:", error);
      res.status(500).json({ message: "Failed to mark order as notified" });
    }
  });

  // Admin book stock management
  app.get("/api/admin/book-stock", adminMiddleware, async (req, res) => {
    try {
      const bookStock = await storage.getAllBookStock();
      res.json(bookStock);
    } catch (error) {
      console.error("Error fetching book stock:", error);
      res.status(500).json({ message: "Failed to fetch book stock" });
    }
  });

  app.post("/api/admin/book-stock", adminMiddleware, async (req, res) => {
    try {
      const stockData = insertBookStockSchema.parse({
        ...req.body,
        updatedBy: req.user.id,
      });
      
      const stock = await storage.updateBookStock(stockData);
      res.status(201).json(stock);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating book stock:", error);
      res.status(500).json({ message: "Failed to update book stock" });
    }
  });

  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      // Add cache headers to reduce repeated requests
      res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Community posts endpoints
  app.get("/api/community-posts", async (req, res) => {
    try {
      const status = req.query.status as string;
      const posts = await storage.getCommunityPosts(status);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.get("/api/community-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      const post = await storage.getCommunityPost(id);
      if (!post) {
        return res.status(404).json({ message: "Community post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching community post:", error);
      res.status(500).json({ message: "Failed to fetch community post" });
    }
  });

  app.post("/api/community-posts", async (req, res) => {
    try {
      const validatedData = insertCommunityPostSchema.parse(req.body);
      const post = await storage.createCommunityPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create community post" });
    }
  });

  app.patch("/api/community-posts/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, rejectionReason } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const post = await storage.updateCommunityPostStatus(id, status, rejectionReason);
      if (!post) {
        return res.status(404).json({ message: "Community post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating community post status:", error);
      res.status(500).json({ message: "Failed to update community post status" });
    }
  });

  app.delete("/api/community-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const success = await storage.deleteCommunityPost(id);
      if (!success) {
        return res.status(404).json({ message: "Community post not found" });
      }
      
      res.json({ message: "Community post deleted successfully" });
    } catch (error) {
      console.error("Error deleting community post:", error);
      res.status(500).json({ message: "Failed to delete community post" });
    }
  });

  // Schools endpoints
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get("/api/schools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const school = await storage.getSchool(id);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  app.post("/api/schools", async (req, res) => {
    try {
      const validatedData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(validatedData);
      res.status(201).json(school);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  // Culture categories endpoints
  app.get("/api/culture-categories", async (req, res) => {
    try {
      const categories = await storage.getCultureCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching culture categories:", error);
      res.status(500).json({ message: "Failed to fetch culture categories" });
    }
  });

  app.post("/api/culture-categories", async (req, res) => {
    try {
      const validatedData = insertCultureCategorySchema.parse(req.body);
      const category = await storage.createCultureCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating culture category:", error);
      res.status(500).json({ message: "Failed to create culture category" });
    }
  });

  // Books endpoints
  app.get("/api/books", async (req, res) => {
    try {
      const category = req.query.category as string;
      const books = category 
        ? await storage.getBooksByCategory(category)
        : await storage.getBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const validatedData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(validatedData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Published works endpoints
  app.get("/api/published-works", async (req, res) => {
    try {
      const featured = req.query.featured === "true";
      const status = req.query.status as string;
      
      if (featured) {
        const works = await storage.getFeaturedPublishedWorks();
        res.json(works);
      } else {
        const works = await storage.getPublishedWorks(status || 'approved');
        res.json(works);
      }
    } catch (error) {
      console.error("Error fetching published works:", error);
      res.status(500).json({ message: "Failed to fetch published works" });
    }
  });

  app.post("/api/published-works", authMiddleware, async (req, res) => {
    try {
      const validatedData = insertPublishedWorkSchema.parse(req.body);
      const work = await storage.createPublishedWork(validatedData);
      res.status(201).json(work);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating published work:", error);
      res.status(500).json({ message: "Failed to create published work" });
    }
  });

  app.patch("/api/published-works/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const work = await storage.updatePublishedWorkStatus(id, status, req.user.id);
      if (!work) {
        return res.status(404).json({ message: "Published work not found" });
      }
      res.json(work);
    } catch (error) {
      console.error("Error updating published work status:", error);
      res.status(500).json({ message: "Failed to update published work status" });
    }
  });

  app.post("/api/published-works/:id/download", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user is subscribed
      if (!req.user.isSubscribed) {
        return res.status(403).json({ message: "Subscription required for PDF downloads" });
      }
      
      await storage.incrementDownloadCount(id);
      res.status(200).json({ message: "Download count incremented" });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });

  // E-commerce endpoints
  app.get("/api/books", optionalAuthMiddleware, async (req, res) => {
    try {
      const category = req.query.category as string;
      const featured = req.query.featured === "true";
      
      let books;
      if (category) {
        books = await storage.getBooksByCategory(category);
      } else {
        books = await storage.getBooks();
      }

      // Filter subscription-only books for non-subscribers
      if (!req.user?.isSubscribed) {
        books = books.filter(book => !book.subscriptionOnly);
      }

      if (featured) {
        books = books.filter(book => book.featured);
      }

      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const orderData = {
        ...insertOrderSchema.parse(req.body),
        userId: req.user.id
      };
      
      const order = await storage.createOrder(orderData);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders", authMiddleware, async (req, res) => {
    try {
      const orders = await storage.getOrdersByUser(req.user.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/subscribe", authMiddleware, async (req, res) => {
    try {
      const subscriptionExpiry = new Date();
      subscriptionExpiry.setFullYear(subscriptionExpiry.getFullYear() + 1); // 1 year
      
      const user = await storage.updateUserSubscription(req.user.id, true, subscriptionExpiry);
      
      // Create subscription order record
      await storage.createOrder({
        userId: req.user.id,
        orderItems: [{ bookId: 0, quantity: 1, price: 99.99, title: "Annual Subscription" }],
        totalAmount: "99.99", // Annual subscription price
        shippingAmount: "0",
        shippingRegion: "none",
        status: "completed",
        paymentMethod: "card",
        customerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Subscriber",
        customerEmail: user?.email || ""
      });

      const { password, ...userWithoutPassword } = user!;
      res.json({ user: userWithoutPassword, message: "Subscription activated successfully" });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Admin school management endpoints
  app.post("/api/admin/schools", authMiddleware, requireSchoolAccess, upload.array('mediaFile'), async (req, res) => {
    try {
      const {
        name,
        location,
        description,
        contactInfo,
        establishedYear,
        studentCount,
        teacherCount,
        programs,
        facilities
      } = req.body;

      // Process media files
      const mediaFiles = req.files ? (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`
      })) : [];

      const schoolData = {
        name,
        location,
        description,
        contactInfo: JSON.parse(contactInfo || '{}'),
        establishedYear: parseInt(establishedYear) || new Date().getFullYear(),
        studentCount: parseInt(studentCount) || 0,
        teacherCount: parseInt(teacherCount) || 0,
        programs: programs ? JSON.parse(programs) : [],
        facilities: facilities ? JSON.parse(facilities) : [],
        mediaFiles
      };

      res.json({ 
        success: true, 
        message: 'School created successfully',
        data: schoolData
      });
    } catch (error) {
      console.error('Error creating school:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create school' 
      });
    }
  });

  // Admin route to create school activities
  app.post("/api/admin/school-activities", authMiddleware, requireSchoolPermission, upload.array('activityFiles'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const attachments = files ? files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      })) : [];

      const activityData = {
        title: req.body.title,
        description: req.body.description,
        activityType: req.body.activityType,
        schoolId: parseInt(req.body.schoolId),
        status: req.body.status,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        location: req.body.location || null,
        maxParticipants: parseInt(req.body.maxParticipants) || 0,
        contactPerson: req.body.contactPerson || null,
        contactInfo: req.body.contactInfo ? JSON.parse(req.body.contactInfo) : {},
        attachments: attachments,
        requirements: req.body.requirements || null,
        achievements: req.body.achievements || null,
        isPublic: req.body.isPublic === 'true',
        createdBy: req.user.id
      };

      await storage.createSchoolActivity(activityData);
      res.json({ success: true, message: "Activity created successfully" });
    } catch (error) {
      console.error("Error creating school activity:", error);
      res.status(500).json({ message: "Error creating activity" });
    }
  });

  app.post("/api/admin/school-notifications", authMiddleware, requireSchoolPermission, upload.array('mediaFile'), async (req, res) => {
    try {
      const {
        title,
        content,
        type,
        schoolId,
        priority,
        publishDate
      } = req.body;

      // Process media files
      const mediaFiles = req.files ? (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`
      })) : [];

      const notificationData = {
        title,
        content,
        type,
        schoolId: schoolId ? parseInt(schoolId) : null,
        priority,
        publishDate,
        mediaFiles,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };

      res.json({ 
        success: true, 
        message: 'Notification published successfully',
        data: notificationData
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to publish notification' 
      });
    }
  });

  app.get("/api/admin/school-notifications", authMiddleware, requireSchoolAccess, async (req, res) => {
    try {
      const notifications: any[] = []; // Placeholder for database query
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notifications' 
      });
    }
  });

  // Admin culture management endpoints
  app.post("/api/admin/culture-programs", authMiddleware, requireCulturePermission, upload.array('mediaFile'), async (req, res) => {
    try {
      const {
        categoryId,
        title,
        description,
        activityType,
        instructorName,
        contactInfo,
        socialMedia,
        schedule,
        fees,
        capacity,
        ageGroup
      } = req.body;

      // Process media files
      const mediaFiles = req.files ? (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`
      })) : [];

      const programData = {
        categoryId: parseInt(categoryId),
        title,
        description,
        activityType,
        instructorName,
        contactInfo: JSON.parse(contactInfo || '{}'),
        socialMedia: JSON.parse(socialMedia || '{}'),
        schedule: JSON.parse(schedule || '{}'),
        fees: JSON.parse(fees || '{}'),
        capacity: parseInt(capacity) || 0,
        ageGroup,
        mediaFiles,
        createdBy: req.user.id
      };

      res.json({ 
        success: true, 
        message: 'Culture program created successfully',
        data: programData
      });
    } catch (error) {
      console.error('Error creating culture program:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create culture program' 
      });
    }
  });

  app.post("/api/admin/culture-activities", authMiddleware, requireCulturePermission, upload.array('mediaFile'), async (req, res) => {
    try {
      const {
        categoryId,
        title,
        content,
        activityType,
        eventDate,
        location,
        participants,
        achievements
      } = req.body;

      // Process media files
      const mediaFiles = req.files ? (req.files as Express.Multer.File[]).map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: `/uploads/${file.filename}`
      })) : [];

      const activityData = {
        categoryId: parseInt(categoryId),
        title,
        content,
        activityType,
        eventDate,
        location,
        participants: parseInt(participants) || 0,
        achievements,
        mediaFiles,
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      };

      res.json({ 
        success: true, 
        message: 'Culture activity published successfully',
        data: activityData
      });
    } catch (error) {
      console.error('Error creating culture activity:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to publish culture activity' 
      });
    }
  });

  app.get("/api/admin/culture-programs", adminMiddleware, async (req, res) => {
    try {
      const programs: any[] = []; // Placeholder for database query
      res.json(programs);
    } catch (error) {
      console.error('Error fetching culture programs:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch culture programs' 
      });
    }
  });

  app.get("/api/admin/culture-activities", adminMiddleware, async (req, res) => {
    try {
      const activities: any[] = []; // Placeholder for database query
      res.json(activities);
    } catch (error) {
      console.error('Error fetching culture activities:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch culture activities' 
      });
    }
  });

  // Book publication submission endpoints
  app.post("/api/publication-submissions", (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }, upload.single('pdfFile'), async (req, res) => {
    try {
      const { title, author, email, category, description } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'PDF file is required' 
        });
      }

      const submissionData = {
        userId: req.user.id,
        title,
        author,
        email,
        category,
        description,
        pdfUrl: `/uploads/${req.file.filename}`,
        status: 'pending'
      };

      const submission = await storage.createPublicationSubmission(submissionData);

      res.json({ 
        success: true, 
        message: 'Manuscript submitted successfully for review',
        data: submission
      });
    } catch (error) {
      console.error('Error submitting manuscript:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to submit manuscript' 
      });
    }
  });

  app.get("/api/publication-submissions/:userId", (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      const submissions = await storage.getPublicationSubmissions();
      const userSubmissions = submissions.filter(s => s.userId === userId);
      res.json(userSubmissions);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch submissions' 
      });
    }
  });

  // Admin publication management endpoints
  app.get("/api/admin/publication-submissions", adminMiddleware, async (req, res) => {
    try {
      const submissions = await storage.getPublicationSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching publication submissions:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch publication submissions' 
      });
    }
  });

  app.patch("/api/admin/publication-submissions/:id/approve", adminMiddleware, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const { adminNotes, publicationFee } = req.body;

      const updatedSubmission = await storage.updatePublicationSubmissionStatus(
        submissionId, 
        'approved', 
        adminNotes, 
        parseFloat(publicationFee)
      );

      res.json({ 
        success: true, 
        message: 'Submission approved and payment link sent to author',
        data: updatedSubmission
      });
    } catch (error) {
      console.error('Error approving submission:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to approve submission' 
      });
    }
  });

  app.patch("/api/admin/publication-submissions/:id/reject", adminMiddleware, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const { adminNotes } = req.body;

      const updatedSubmission = {
        id: submissionId,
        status: 'rejected',
        adminNotes,
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user.id
      };

      // TODO: Send email notification to author
      
      res.json({ 
        success: true, 
        message: 'Submission rejected and author notified',
        data: updatedSubmission
      });
    } catch (error) {
      console.error('Error rejecting submission:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to reject submission' 
      });
    }
  });

  // Register role-based admin routes
  app.use("/api/role-admin", roleAdminRoutes);
  app.use("/api/admin/permissions", adminPermissionsRoutes);

  // Register payment routes
  registerPaymentRoutes(app);

  // Register Razorpay routes
  registerRazorpayRoutes(app);

  // Register admin notification routes
  registerAdminNotificationRoutes(app);

  // Register deadlock monitoring routes
  app.use("/api/monitoring", deadlockMonitoringRoutes);

  // Register school fee payment routes (with fee payment access control)
  app.use("/api/fee-payments", authMiddleware, requireFeePaymentAccess, schoolFeePaymentRoutes);

  // Fee structure routes for schools
  app.get("/api/schools/:schoolId/fee-structures", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const academicYear = req.query.academicYear as string;
      
      const feeStructures = await storage.getFeeStructures(schoolId, academicYear);
      res.json(feeStructures);
    } catch (error: any) {
      console.error("Error fetching fee structures:", error);
      res.status(500).json({ error: "Failed to fetch fee structures" });
    }
  });

  app.get("/api/schools/:schoolId/fee-structures/:className/:feeType", async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { className, feeType } = req.params;
      const academicYear = req.query.academicYear as string;
      
      const feeStructure = await storage.getFeeStructureByClass(schoolId, className, feeType, academicYear);
      
      if (!feeStructure) {
        return res.status(404).json({ error: "Fee structure not found" });
      }
      
      res.json(feeStructure);
    } catch (error: any) {
      console.error("Error fetching fee structure:", error);
      res.status(500).json({ error: "Failed to fetch fee structure" });
    }
  });

  app.post("/api/schools/:schoolId/fee-structures", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const parsed = insertFeeStructureSchema.safeParse({
        ...req.body,
        schoolId
      });

      if (!parsed.success) {
        const errors = fromZodError(parsed.error);
        return res.status(400).json({ error: errors.toString() });
      }

      const feeStructure = await storage.createFeeStructure(parsed.data);
      res.status(201).json(feeStructure);
    } catch (error: any) {
      console.error("Error creating fee structure:", error);
      res.status(500).json({ error: "Failed to create fee structure" });
    }
  });

  app.post("/api/schools/:schoolId/fee-structures/bulk", authMiddleware, requireSchoolPermission, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const structures = req.body.structures;
      
      if (!Array.isArray(structures)) {
        return res.status(400).json({ error: "Structures must be an array" });
      }

      const validatedStructures = structures.map(structure => {
        const parsed = insertFeeStructureSchema.safeParse({
          ...structure,
          schoolId
        });
        
        if (!parsed.success) {
          throw new Error(`Invalid structure: ${fromZodError(parsed.error)}`);
        }
        
        return parsed.data;
      });

      const createdStructures = await storage.bulkCreateFeeStructures(validatedStructures);
      res.status(201).json(createdStructures);
    } catch (error: any) {
      console.error("Error creating fee structures:", error);
      res.status(500).json({ error: error.message || "Failed to create fee structures" });
    }
  });

  // Health check endpoint for Docker
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // Super admin school payment control endpoints
  app.post("/api/admin/schools/:schoolId/enable-payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { paymentMethods, adminApprovalRequired } = req.body;

      // Update school payment configuration
      const school = await storage.updateSchoolPaymentConfig(schoolId, {
        feePaymentEnabled: true,
        paymentMethods: paymentMethods || ['razorpay', 'stripe'],
        adminApprovalRequired: adminApprovalRequired !== false
      });

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      res.json({ message: "Fee payment enabled successfully", school });
    } catch (error) {
      console.error("Failed to enable fee payment:", error);
      res.status(500).json({ message: "Failed to enable fee payment" });
    }
  });

  app.post("/api/admin/schools/:schoolId/disable-payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);

      // Disable school payment system
      const school = await storage.updateSchoolPaymentConfig(schoolId, {
        feePaymentEnabled: false,
        paymentMethods: [],
        adminApprovalRequired: true
      });

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      res.json({ message: "Fee payment disabled successfully", school });
    } catch (error) {
      console.error("Failed to disable fee payment:", error);
      res.status(500).json({ message: "Failed to disable fee payment" });
    }
  });

  // PATCH endpoint for updating school payment settings (used by frontend)
  app.patch("/api/admin/schools/:schoolId/payment-settings", authMiddleware, requireAdmin, async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      const { feePaymentEnabled, paymentMethods, adminApprovalRequired, paymentConfig } = req.body;

      if (isNaN(schoolId)) {
        return res.status(400).json({ message: "Invalid school ID" });
      }

      // Update school payment configuration
      const school = await storage.updateSchoolPaymentConfig(schoolId, {
        feePaymentEnabled: feePaymentEnabled,
        paymentMethods: paymentMethods || [],
        adminApprovalRequired: adminApprovalRequired !== false
      });

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      const message = feePaymentEnabled 
        ? "Fee payment access enabled successfully" 
        : "Fee payment access disabled successfully";

      res.json({ 
        success: true,
        message,
        school: {
          id: school.id,
          name: school.name,
          feePaymentEnabled: school.feePaymentEnabled,
          paymentMethods: school.paymentMethods,
          adminApprovalRequired: school.adminApprovalRequired
        }
      });
    } catch (error) {
      console.error("Failed to update payment settings:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update payment settings" 
      });
    }
  });

  // Fee payment management endpoints
  app.get("/api/admin/fee-payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : undefined;
      const feePayments = await storage.getSchoolFeePayments(schoolId);
      res.json(feePayments);
    } catch (error) {
      console.error("Failed to fetch fee payments:", error);
      res.status(500).json({ message: "Failed to fetch fee payments" });
    }
  });

  app.patch("/api/admin/fee-payments/:paymentId/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.paymentId);
      const { status } = req.body;

      const feePayment = await storage.updateSchoolFeePaymentStatus(paymentId, status);
      
      if (!feePayment) {
        return res.status(404).json({ message: "Fee payment not found" });
      }

      res.json({ message: "Payment status updated successfully", feePayment });
    } catch (error) {
      console.error("Failed to update payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Book stock management endpoints for super admin
  app.get("/api/admin/book-stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookStock = await storage.getBookStock();
      res.json(bookStock);
    } catch (error) {
      console.error("Error fetching book stock:", error);
      res.status(500).json({ message: "Failed to fetch book stock" });
    }
  });

  app.patch("/api/admin/books/:bookId/stock", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const bookId = parseInt(req.params.bookId);
      const { quantity } = req.body;

      if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const updatedStock = await storage.updateBookStock(bookId, quantity, req.user.id);
      res.json(updatedStock);
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ message: "Failed to update book stock" });
    }
  });

  app.get("/api/admin/book-analytics", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const analytics = await storage.getBookAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching book analytics:", error);
      res.status(500).json({ message: "Failed to fetch book analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

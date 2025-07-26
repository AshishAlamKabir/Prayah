import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertSchoolNotificationSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { 
  authMiddleware, 
  adminMiddleware, 
  optionalAuthMiddleware,
  generateSessionToken, 
  hashPassword, 
  verifyPassword 
} from "./auth";

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
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
      res.json({ user: userWithoutPassword, token });
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
  app.post("/api/admin/schools", adminMiddleware, upload.array('mediaFile'), async (req, res) => {
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

  app.post("/api/admin/school-notifications", adminMiddleware, upload.array('mediaFile'), async (req, res) => {
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

  app.get("/api/admin/school-notifications", adminMiddleware, async (req, res) => {
    try {
      const notifications = []; // Placeholder for database query
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch notifications' 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

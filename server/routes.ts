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
  insertFeeStructureSchema,
  insertCartItemSchema,
  insertOrderSchema,
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
import * as XLSX from 'xlsx';

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

      res.json({ message: "Stock updated successfully", book: updatedBook });
    } catch (error) {
      console.error("Error updating book stock:", error);
      res.status(500).json({ message: "Failed to update stock" });
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

  // ===== STUDENT MANAGEMENT SYSTEM ROUTES =====
  // Based on Bokaghat Jatiya Vidyalay requirements

  // Get all students for a school (with optional filters)
  app.get("/api/schools/:schoolId/students", authMiddleware, requireSchoolPermission, async (req, res) => {
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

      const validatedData = insertStudentSchema.parse({
        ...req.body,
        schoolId,
        createdBy: req.user.id
      });

      const student = await storage.addStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error adding student:", error);
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

  // Excel upload for students
  app.post("/api/schools/:schoolId/students/upload", authMiddleware, requireSchoolPermission, studentUpload.single('file'), async (req, res) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (isNaN(schoolId) || !req.file) {
        return res.status(400).json({ message: "Invalid school ID or no file provided" });
      }

      // Extract class and stream from filename
      const fileName = req.file.originalname;
      const extractedClass = extractClassFromFilename(fileName);
      const extractedStream = extractStreamFromFilename(fileName);
      
      // Read Excel file
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      const errors: string[] = [];
      let successfulImports = 0;
      let failedImports = 0;
      
      // Process each row
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          const studentData = {
            schoolId,
            name: row.Name || row.name || row['Student Name'] || '',
            rollNumber: row.RollNumber || row.roll_number || row['Roll Number'] || row.Roll || '',
            className: extractedClass || row.Class || row.class || '',
            stream: extractedStream || row.Stream || row.stream || null,
            admissionDate: new Date(),
            parentName: row.ParentName || row.parent_name || row['Parent Name'] || null,
            contactNumber: row.ContactNumber || row.contact_number || row['Contact Number'] || null,
            address: row.Address || row.address || null,
            createdBy: req.user.id
          };
          
          if (!studentData.name || !studentData.rollNumber) {
            errors.push(`Row ${i + 1}: Missing name or roll number`);
            failedImports++;
            continue;
          }
          
          await storage.addStudent(studentData);
          successfulImports++;
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
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
        totalRows: data.length,
        successfulImports,
        failedImports,
        errors: errors.length > 0 ? errors.slice(0, 10) : [] // Return first 10 errors
      });
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
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
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

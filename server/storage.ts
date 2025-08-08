import {
  users,
  communityPosts,
  schools,
  cultureCategories,
  books,
  publishedWorks,
  userSessions,
  cartItems,
  orders,
  orderItems,
  bookStock,
  schoolActivities,
  publicationSubmissions,
  payments,
  adminNotifications,
  feeStructures,
  type User,
  type InsertUser,
  type CommunityPost,
  type InsertCommunityPost,
  type School,
  type InsertSchool,
  type CultureCategory,
  type InsertCultureCategory,
  type Book,
  type InsertBook,
  type PublishedWork,
  type InsertPublishedWork,
  type UserSession,
  type InsertUserSession,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type BookStock,
  type InsertBookStock,
  type SchoolActivity,
  type InsertSchoolActivity,
  type PublicationSubmission,
  type InsertPublicationSubmission,
  type Payment,
  type InsertPayment,
  type AdminNotification,
  type InsertAdminNotification,
  schoolFeePayments,
  type SchoolFeePayment,
  type InsertSchoolFeePayment,
  feePaymentNotifications,
  type FeePaymentNotification,
  type InsertFeePaymentNotification,
  type FeeStructure,
  type InsertFeeStructure,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: number, isSubscribed: boolean, expiry?: Date): Promise<User | undefined>;
  updateUserPermissions(userId: number, permissions: {
    role?: string;
    schoolPermissions?: number[];
    culturePermissions?: number[];
    permissions?: string[];
  }): Promise<User | undefined>;
  getAllUsersWithPermissions(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersWithSchoolPermission(schoolId: number): Promise<User[]>;
  createSchoolAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    schoolPermissions: number[];
  }): Promise<User>;
  createCultureAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    culturePermissions: number[];
  }): Promise<User>;
  
  // Authentication operations
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserBySessionToken(token: string): Promise<User | undefined>;
  deleteUserSession(token: string): Promise<boolean>;
  
  // Cart operations
  getCartItems(userId: number): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, updates: Partial<InsertCartItem>): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined>;

  // Community post operations
  getCommunityPosts(status?: string): Promise<CommunityPost[]>;
  getCommunityPost(id: number): Promise<CommunityPost | undefined>;
  createCommunityPost(post: InsertCommunityPost): Promise<CommunityPost>;
  updateCommunityPostStatus(id: number, status: string): Promise<CommunityPost | undefined>;
  deleteCommunityPost(id: number): Promise<boolean>;

  // School operations
  getSchools(): Promise<School[]>;
  getSchool(id: number): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(id: number, school: Partial<InsertSchool>): Promise<School | undefined>;
  updateSchoolPaymentSettings(id: number, settings: {
    feePaymentEnabled: boolean;
    paymentMethods: string[];
    paymentConfig: any;
    adminApprovalRequired: boolean;
  }): Promise<School | undefined>;
  deleteSchool(id: number): Promise<boolean>;
  createSchoolActivity(activity: any): Promise<SchoolActivity>;

  // Culture category operations
  getCultureCategories(): Promise<CultureCategory[]>;
  getCultureCategory(id: number): Promise<CultureCategory | undefined>;
  createCultureCategory(category: InsertCultureCategory): Promise<CultureCategory>;
  updateCultureCategory(id: number, category: Partial<InsertCultureCategory>): Promise<CultureCategory | undefined>;
  deleteCultureCategory(id: number): Promise<boolean>;

  // Book operations
  getBooks(): Promise<Book[]>;
  getBook(id: number): Promise<Book | undefined>;
  getBooksByCategory(category: string): Promise<Book[]>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: number, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: number): Promise<boolean>;

  // Removed stock analytics - e-commerce removed
  getBookAnalytics(): Promise<{
    totalBooks: number;
    totalValue: number;
    averagePrice: number;
  }>;

  // Published work operations
  getPublishedWorks(status?: string): Promise<PublishedWork[]>;
  getPublishedWork(id: number): Promise<PublishedWork | undefined>;
  getFeaturedPublishedWorks(): Promise<PublishedWork[]>;
  createPublishedWork(work: InsertPublishedWork): Promise<PublishedWork>;
  updatePublishedWork(id: number, work: Partial<InsertPublishedWork>): Promise<PublishedWork | undefined>;
  updatePublishedWorkStatus(id: number, status: string, approvedBy?: number): Promise<PublishedWork | undefined>;
  incrementDownloadCount(id: number): Promise<void>;
  deletePublishedWork(id: number): Promise<boolean>;

  // Publication submission operations
  getPublicationSubmissions(status?: string): Promise<any[]>;
  getPublicationSubmission(id: number): Promise<any | undefined>;
  createPublicationSubmission(submission: any): Promise<any>;
  updatePublicationSubmissionStatus(id: number, status: string, note?: string, fee?: number): Promise<any | undefined>;
  deletePublicationSubmission(id: number): Promise<boolean>;

  // Payment operations
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentById(id: number): Promise<Payment | undefined>;
  getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined>;
  updatePaymentStatus(id: number, status: string, stripeChargeId?: string, failureReason?: string): Promise<Payment | undefined>;
  
  // School fee payment operations
  createSchoolFeePayment(feePayment: any): Promise<any>;
  getSchoolFeePayments(schoolId?: number): Promise<any[]>;
  updateSchoolFeePaymentStatus(id: number, status: string): Promise<any | undefined>;
  getPaymentsByUser(userId: number): Promise<Payment[]>;
  getPaymentsByType(paymentType: string): Promise<Payment[]>;
  markPaymentAdminsNotified(paymentId: number, notificationsSent: string[]): Promise<Payment | undefined>;

  // Admin notification operations
  createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification>;
  getAdminNotifications(adminUserId: number, unreadOnly?: boolean): Promise<AdminNotification[]>;
  markNotificationRead(notificationId: number): Promise<AdminNotification | undefined>;
  markNotificationEmailSent(notificationId: number): Promise<AdminNotification | undefined>;
  getUnreadNotificationCount(adminUserId: number): Promise<number>;
  getUsersByRole(role: string): Promise<User[]>;

  // School fee payment operations
  createSchoolFeePayment(payment: InsertSchoolFeePayment): Promise<SchoolFeePayment>;
  getSchoolFeePayment(id: number): Promise<SchoolFeePayment | undefined>;
  getSchoolFeePaymentByRazorpayOrderId(orderId: string): Promise<SchoolFeePayment | undefined>;
  updateSchoolFeePaymentStatus(id: number, updates: Partial<SchoolFeePayment>): Promise<SchoolFeePayment | undefined>;
  getSchoolFeePayments(schoolId?: number, userId?: number): Promise<SchoolFeePayment[]>;
  checkDuplicateFeePayment(schoolId: number, studentRollNo: string, feeMonth: string): Promise<SchoolFeePayment | undefined>;

  // Fee payment notification operations
  createFeePaymentNotification(notification: InsertFeePaymentNotification): Promise<FeePaymentNotification>;
  getFeePaymentNotifications(schoolId: number, adminUserId: number): Promise<FeePaymentNotification[]>;
  markFeeNotificationAsRead(notificationId: number): Promise<boolean>;

  // Statistics
  getStats(): Promise<{
    totalSchools: number;
    totalPosts: number;
    totalBooks: number;
    totalMembers: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }



  async getUsersWithSchoolPermission(schoolId: number): Promise<User[]> {
    return db.select().from(users).where(
      sql`${users.role} = 'admin' OR ${users.schoolPermissions} @> ${JSON.stringify([schoolId])}`
    );
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPermissions(userId: number, permissions: {
    role?: string;
    schoolPermissions?: number[];
    culturePermissions?: number[];
    permissions?: string[];
  }): Promise<User | undefined> {
    const updateData: any = { updatedAt: new Date() };
    
    if (permissions.role !== undefined) {
      updateData.role = permissions.role;
    }
    if (permissions.schoolPermissions !== undefined) {
      updateData.schoolPermissions = permissions.schoolPermissions;
    }
    if (permissions.culturePermissions !== undefined) {
      updateData.culturePermissions = permissions.culturePermissions;
    }
    if (permissions.permissions !== undefined) {
      updateData.permissions = permissions.permissions;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getAllUsersWithPermissions(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createSchoolAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    schoolPermissions: number[];
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: adminData.username,
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: "school_admin",
        schoolPermissions: adminData.schoolPermissions,
        culturePermissions: [],
        permissions: []
      })
      .returning();
    return user;
  }

  async createCultureAdmin(adminData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    culturePermissions: number[];
  }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: adminData.username,
        email: adminData.email,
        password: adminData.password,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        role: "culture_admin",
        schoolPermissions: [],
        culturePermissions: adminData.culturePermissions,
        permissions: []
      })
      .returning();
    return user;
  }

  async updateUserSubscription(id: number, isSubscribed: boolean, expiry?: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        isSubscribed, 
        subscriptionExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Authentication session operations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [userSession] = await db
      .insert(userSessions)
      .values(session)
      .returning();
    return userSession;
  }

  async getUserBySessionToken(token: string): Promise<User | undefined> {
    const result = await db
      .select({
        user: users
      })
      .from(userSessions)
      .leftJoin(users, eq(userSessions.userId, users.id))
      .where(and(
        eq(userSessions.token, token),
        gt(userSessions.expiresAt, new Date())
      ));
    
    return result[0]?.user || undefined;
  }

  async deleteUserSession(token: string): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.token, token));
    return (result.rowCount ?? 0) > 0;
  }

  // Community post operations
  async getCommunityPosts(status?: string): Promise<CommunityPost[]> {
    if (status) {
      return await db.select().from(communityPosts).where(eq(communityPosts.status, status)).orderBy(desc(communityPosts.createdAt));
    }
    return await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
  }

  async getCommunityPost(id: number): Promise<CommunityPost | undefined> {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post || undefined;
  }

  async createCommunityPost(insertPost: InsertCommunityPost): Promise<CommunityPost> {
    const [post] = await db
      .insert(communityPosts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updateCommunityPostStatus(id: number, status: string, rejectionReason?: string): Promise<CommunityPost | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    if (status === "approved") {
      updateData.approvedAt = new Date();
      // TODO: Add approvedBy when we have user context
    }
    
    const [post] = await db
      .update(communityPosts)
      .set(updateData)
      .where(eq(communityPosts.id, id))
      .returning();
    return post || undefined;
  }

  async deleteCommunityPost(id: number): Promise<boolean> {
    const result = await db.delete(communityPosts).where(eq(communityPosts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // School operations
  async getSchools(): Promise<School[]> {
    return await db.select().from(schools).orderBy(desc(schools.createdAt));
  }

  async getSchool(id: number): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school || undefined;
  }

  async createSchool(insertSchool: InsertSchool): Promise<School> {
    const [school] = await db
      .insert(schools)
      .values(insertSchool)
      .returning();
    return school;
  }

  async updateSchool(id: number, updateData: Partial<InsertSchool>): Promise<School | undefined> {
    const [school] = await db
      .update(schools)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schools.id, id))
      .returning();
    return school || undefined;
  }

  async updateSchoolPaymentSettings(id: number, settings: {
    feePaymentEnabled: boolean;
    paymentMethods: string[];
    paymentConfig: any;
    adminApprovalRequired: boolean;
  }): Promise<School | undefined> {
    const [school] = await db
      .update(schools)
      .set({
        feePaymentEnabled: settings.feePaymentEnabled,
        paymentMethods: settings.paymentMethods,
        paymentConfig: settings.paymentConfig,
        adminApprovalRequired: settings.adminApprovalRequired,
        updatedAt: new Date()
      })
      .where(eq(schools.id, id))
      .returning();
    return school || undefined;
  }

  async deleteSchool(id: number): Promise<boolean> {
    const result = await db.delete(schools).where(eq(schools.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createSchoolActivity(activityData: any): Promise<SchoolActivity> {
    const [activity] = await db
      .insert(schoolActivities)
      .values({
        title: activityData.title,
        description: activityData.description,
        activityType: activityData.activityType,
        schoolId: activityData.schoolId,
        status: activityData.status,
        startDate: activityData.startDate,
        endDate: activityData.endDate,
        location: activityData.location,
        maxParticipants: activityData.maxParticipants,
        contactPerson: activityData.contactPerson,
        contactInfo: activityData.contactInfo,
        attachments: activityData.attachments,
        requirements: activityData.requirements,
        achievements: activityData.achievements,
        isPublic: activityData.isPublic,
        createdBy: activityData.createdBy
      })
      .returning();
    return activity;
  }

  // Culture category operations
  async getCultureCategories(): Promise<CultureCategory[]> {
    return await db.select().from(cultureCategories).orderBy(desc(cultureCategories.createdAt));
  }

  async getCultureCategory(id: number): Promise<CultureCategory | undefined> {
    const [category] = await db.select().from(cultureCategories).where(eq(cultureCategories.id, id));
    return category || undefined;
  }

  async createCultureCategory(insertCategory: InsertCultureCategory): Promise<CultureCategory> {
    const [category] = await db
      .insert(cultureCategories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async updateCultureCategory(id: number, updateData: Partial<InsertCultureCategory>): Promise<CultureCategory | undefined> {
    const [category] = await db
      .update(cultureCategories)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(cultureCategories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCultureCategory(id: number): Promise<boolean> {
    const result = await db.delete(cultureCategories).where(eq(cultureCategories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Book operations
  async getBooks(): Promise<Book[]> {
    return await db.select().from(books).orderBy(desc(books.createdAt));
  }

  async getBook(id: number): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(eq(books.id, id));
    return book || undefined;
  }

  async getBooksByCategory(category: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.category, category)).orderBy(desc(books.createdAt));
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(insertBook)
      .returning();
    return book;
  }

  async updateBook(id: number, updateData: Partial<InsertBook>): Promise<Book | undefined> {
    const [book] = await db
      .update(books)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(books.id, id))
      .returning();
    return book || undefined;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await db.delete(books).where(eq(books.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Book stock operations
  async getBookStock(): Promise<any[]> {
    const booksWithStock = await db.select().from(books);
    return booksWithStock.map(book => ({
      bookId: book.id,
      quantity: book.stock || 0,
      reserved: 0,
      available: book.stock || 0,
      book: book
    }));
  }

  async getBookAnalytics(): Promise<{
    totalBooks: number;
    totalValue: number;
    averagePrice: number;
  }> {
    // Get total books count
    const totalBooksResult = await db.select({ count: count() }).from(books);
    const totalBooks = totalBooksResult[0]?.count || 0;

    // Get price analytics
    const priceResult = await db
      .select({
        totalValue: sql<number>`COALESCE(SUM(CAST(${books.price} AS DECIMAL)), 0)`,
        averagePrice: sql<number>`COALESCE(AVG(CAST(${books.price} AS DECIMAL)), 0)`
      })
      .from(books);

    return {
      totalBooks: Number(totalBooks),
      totalValue: Number(priceResult[0]?.totalValue || 0),
      averagePrice: Number(priceResult[0]?.averagePrice || 0)
    };
  }

  // Published work operations
  async getPublishedWorks(status?: string): Promise<PublishedWork[]> {
    if (status) {
      return await db.select().from(publishedWorks).where(eq(publishedWorks.status, status)).orderBy(desc(publishedWorks.createdAt));
    }
    return await db.select().from(publishedWorks).orderBy(desc(publishedWorks.createdAt));
  }

  async getPublishedWork(id: number): Promise<PublishedWork | undefined> {
    const [work] = await db.select().from(publishedWorks).where(eq(publishedWorks.id, id));
    return work || undefined;
  }

  async getFeaturedPublishedWorks(): Promise<PublishedWork[]> {
    return await db.select().from(publishedWorks).where(eq(publishedWorks.featured, true)).orderBy(desc(publishedWorks.createdAt));
  }

  async createPublishedWork(insertWork: InsertPublishedWork): Promise<PublishedWork> {
    const [work] = await db
      .insert(publishedWorks)
      .values(insertWork)
      .returning();
    return work;
  }

  async updatePublishedWork(id: number, updateData: Partial<InsertPublishedWork>): Promise<PublishedWork | undefined> {
    const [work] = await db
      .update(publishedWorks)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(publishedWorks.id, id))
      .returning();
    return work || undefined;
  }

  async updatePublishedWorkStatus(id: number, status: string, approvedBy?: number): Promise<PublishedWork | undefined> {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === "approved" && approvedBy) {
      updateData.approvedBy = approvedBy;
      updateData.approvedAt = new Date();
    }
    
    const [work] = await db
      .update(publishedWorks)
      .set(updateData)
      .where(eq(publishedWorks.id, id))
      .returning();
    return work || undefined;
  }

  async incrementDownloadCount(id: number): Promise<void> {
    await db
      .update(publishedWorks)
      .set({ 
        downloadCount: sql`${publishedWorks.downloadCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(publishedWorks.id, id));
  }

  async deletePublishedWork(id: number): Promise<boolean> {
    const result = await db.delete(publishedWorks).where(eq(publishedWorks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateBookStock(bookId: number, quantity: number): Promise<Book | undefined> {
    const [book] = await db
      .update(books)
      .set({ 
        stock: quantity,
        updatedAt: new Date()
      })
      .where(eq(books.id, bookId))
      .returning();
    return book || undefined;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<CartItem[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        bookId: cartItems.bookId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          price: books.price,
          imageUrl: books.imageUrl,
          stock: books.stock
        }
      })
      .from(cartItems)
      .leftJoin(books, eq(cartItems.bookId, books.id))
      .where(eq(cartItems.userId, userId))
      .orderBy(desc(cartItems.createdAt));
    
    return result as CartItem[];
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.userId, cartItem.userId),
        eq(cartItems.bookId, cartItem.bookId)
      ));

    if (existingItem.length > 0) {
      // Update quantity if item exists
      const [updatedItem] = await db
        .update(cartItems)
        .set({
          quantity: existingItem[0].quantity + (cartItem.quantity || 1),
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    } else {
      // Insert new item
      const [newItem] = await db
        .insert(cartItems)
        .values(cartItem)
        .returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, updates: Partial<InsertCartItem>): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, orderNumber })
      .returning();
    return newOrder;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    const result = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        paymentId: orders.paymentId,
        notes: orders.notes,
        adminNotes: orders.adminNotes,
        trackingNumber: orders.trackingNumber,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
    
    return result as Order[];
  }

  async updateOrderStatus(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async updateOrderTracking(id: number, trackingNumber: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ 
        trackingNumber,
        status: 'shipped',
        shippedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    const result = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNumber: orders.orderNumber,
        status: orders.status,
        totalAmount: orders.totalAmount,
        currency: orders.currency,
        shippingAddress: orders.shippingAddress,
        billingAddress: orders.billingAddress,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        paymentId: orders.paymentId,
        notes: orders.notes,
        adminNotes: orders.adminNotes,
        trackingNumber: orders.trackingNumber,
        shippedAt: orders.shippedAt,
        deliveredAt: orders.deliveredAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          email: users.email
        }
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));
    
    return result as Order[];
  }

  async markOrderNotified(id: number): Promise<any> {
    // TODO: Implement when order schema is ready
    return null;
  }

  // Publication submission operations
  async getPublicationSubmissions(status?: string): Promise<PublicationSubmission[]> {
    if (status) {
      return await db.select().from(publicationSubmissions).where(eq(publicationSubmissions.status, status));
    }
    
    return await db.select().from(publicationSubmissions);
  }

  async getPublicationSubmission(id: number): Promise<PublicationSubmission | undefined> {
    const [submission] = await db.select().from(publicationSubmissions).where(eq(publicationSubmissions.id, id));
    return submission || undefined;
  }

  async createPublicationSubmission(submission: InsertPublicationSubmission): Promise<PublicationSubmission> {
    const [newSubmission] = await db
      .insert(publicationSubmissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async updatePublicationSubmissionStatus(id: number, status: string, note?: string, fee?: number): Promise<PublicationSubmission | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (note) {
      updateData.adminNote = note;
    }
    
    if (fee !== undefined) {
      updateData.publicationFee = fee.toString();
    }

    const [submission] = await db
      .update(publicationSubmissions)
      .set(updateData)
      .where(eq(publicationSubmissions.id, id))
      .returning();
    return submission || undefined;
  }

  async deletePublicationSubmission(id: number): Promise<boolean> {
    const result = await db.delete(publicationSubmissions).where(eq(publicationSubmissions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Payment operations
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPaymentById(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, stripePaymentIntentId));
    return payment || undefined;
  }

  async updatePaymentStatus(id: number, status: string, stripeChargeId?: string, failureReason?: string): Promise<Payment | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (stripeChargeId) {
      updateData.stripeChargeId = stripeChargeId;
    }
    
    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async getPaymentsByUser(userId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async getPaymentsByType(paymentType: string): Promise<Payment[]> {
    if (paymentType === '') {
      // Return all payments if type is empty
      return await db.select().from(payments).orderBy(desc(payments.createdAt));
    }
    return await db.select().from(payments).where(eq(payments.paymentType, paymentType));
  }

  async markPaymentAdminsNotified(paymentId: number, notificationsSent: string[]): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({
        adminsNotified: true,
        notificationsSent: notificationsSent,
        updatedAt: new Date()
      })
      .where(eq(payments.id, paymentId))
      .returning();
    return payment || undefined;
  }

  // School fee payment operations
  async createSchoolFeePayment(feePayment: InsertSchoolFeePayment): Promise<SchoolFeePayment> {
    const [newFeePayment] = await db
      .insert(schoolFeePayments)
      .values(feePayment)
      .returning();
    return newFeePayment;
  }

  async getSchoolFeePayments(schoolId?: number): Promise<SchoolFeePayment[]> {
    if (schoolId) {
      return await db.select().from(schoolFeePayments).where(eq(schoolFeePayments.schoolId, schoolId)).orderBy(desc(schoolFeePayments.createdAt));
    }
    return await db.select().from(schoolFeePayments).orderBy(desc(schoolFeePayments.createdAt));
  }

  async updateSchoolFeePaymentStatus(id: number, status: string): Promise<SchoolFeePayment | undefined> {
    const [feePayment] = await db
      .update(schoolFeePayments)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(schoolFeePayments.id, id))
      .returning();
    return feePayment || undefined;
  }

  async updateSchoolPaymentConfig(schoolId: number, config: {
    feePaymentEnabled: boolean;
    paymentMethods: string[];
    adminApprovalRequired: boolean;
  }): Promise<School | undefined> {
    const [school] = await db
      .update(schools)
      .set({
        feePaymentEnabled: config.feePaymentEnabled,
        paymentMethods: config.paymentMethods,
        adminApprovalRequired: config.adminApprovalRequired,
        updatedAt: new Date()
      })
      .where(eq(schools.id, schoolId))
      .returning();
    return school || undefined;
  }

  // Admin notification operations
  async createAdminNotification(notification: InsertAdminNotification): Promise<AdminNotification> {
    const [newNotification] = await db
      .insert(adminNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getAdminNotifications(adminUserId: number, unreadOnly?: boolean): Promise<AdminNotification[]> {
    if (unreadOnly) {
      return await db.select().from(adminNotifications)
        .where(and(
          eq(adminNotifications.adminUserId, adminUserId),
          eq(adminNotifications.isRead, false)
        ))
        .orderBy(desc(adminNotifications.createdAt));
    }
    
    return await db.select().from(adminNotifications)
      .where(eq(adminNotifications.adminUserId, adminUserId))
      .orderBy(desc(adminNotifications.createdAt));
  }

  async markNotificationRead(notificationId: number): Promise<AdminNotification | undefined> {
    const [notification] = await db
      .update(adminNotifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(adminNotifications.id, notificationId))
      .returning();
    return notification || undefined;
  }

  async markNotificationEmailSent(notificationId: number): Promise<AdminNotification | undefined> {
    const [notification] = await db
      .update(adminNotifications)
      .set({
        emailSent: true,
        emailSentAt: new Date()
      })
      .where(eq(adminNotifications.id, notificationId))
      .returning();
    return notification || undefined;
  }

  async getUnreadNotificationCount(adminUserId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(adminNotifications)
      .where(and(
        eq(adminNotifications.adminUserId, adminUserId),
        eq(adminNotifications.isRead, false)
      ));
    return Number(result?.count) || 0;
  }

  // Statistics
  async getStats(): Promise<{
    totalSchools: number;
    totalPosts: number;
    totalBooks: number;
    totalMembers: number;
  }> {
    // Execute all count queries in parallel for better performance
    const [schoolCountResult, postCountResult, bookCountResult, memberCountResult] = await Promise.all([
      db.select({ count: count() }).from(schools),
      db.select({ count: count() }).from(communityPosts),
      db.select({ count: count() }).from(books),
      db.select({ count: count() }).from(users)
    ]);

    return {
      totalSchools: Number(schoolCountResult[0]?.count) || 0,
      totalPosts: Number(postCountResult[0]?.count) || 0,
      totalBooks: Number(bookCountResult[0]?.count) || 0,
      totalMembers: Number(memberCountResult[0]?.count) || 0,
    };
  }

  // School fee payment operations
  async createSchoolFeePayment(payment: InsertSchoolFeePayment): Promise<SchoolFeePayment> {
    const [feePayment] = await db
      .insert(schoolFeePayments)
      .values({
        userId: payment.userId,
        amount: payment.amount.toString(),
        schoolId: payment.schoolId,
        studentRollNo: payment.studentRollNo,
        studentName: payment.studentName,
        studentClass: payment.studentClass,
        feeMonth: payment.feeMonth,
        feeType: payment.feeType,
        academicYear: payment.academicYear,
        razorpayOrderId: payment.razorpayOrderId,
        receiptNumber: payment.receiptNumber,
        paymentStatus: payment.paymentStatus,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        transactionFee: payment.transactionFee,
        razorpayPaymentId: payment.razorpayPaymentId,
        adminNotified: payment.adminNotified || false
      })
      .returning();
    return feePayment;
  }

  async getSchoolFeePayment(id: number): Promise<SchoolFeePayment | undefined> {
    const [payment] = await db
      .select()
      .from(schoolFeePayments)
      .where(eq(schoolFeePayments.id, id));
    return payment || undefined;
  }

  async getSchoolFeePaymentByRazorpayOrderId(orderId: string): Promise<SchoolFeePayment | undefined> {
    const [payment] = await db
      .select()
      .from(schoolFeePayments)
      .where(eq(schoolFeePayments.razorpayOrderId, orderId));
    return payment || undefined;
  }

  async updateSchoolFeePaymentStatus(id: number, updates: Partial<SchoolFeePayment>): Promise<SchoolFeePayment | undefined> {
    const [payment] = await db
      .update(schoolFeePayments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schoolFeePayments.id, id))
      .returning();
    return payment || undefined;
  }

  async getSchoolFeePayments(schoolId?: number, userId?: number): Promise<SchoolFeePayment[]> {
    if (schoolId && userId) {
      return await db.select().from(schoolFeePayments)
        .where(and(eq(schoolFeePayments.schoolId, schoolId), eq(schoolFeePayments.userId, userId)))
        .orderBy(desc(schoolFeePayments.createdAt));
    } else if (schoolId) {
      return await db.select().from(schoolFeePayments)
        .where(eq(schoolFeePayments.schoolId, schoolId))
        .orderBy(desc(schoolFeePayments.createdAt));
    } else if (userId) {
      return await db.select().from(schoolFeePayments)
        .where(eq(schoolFeePayments.userId, userId))
        .orderBy(desc(schoolFeePayments.createdAt));
    }
    
    return await db.select().from(schoolFeePayments)
      .orderBy(desc(schoolFeePayments.createdAt));
  }

  async checkDuplicateFeePayment(schoolId: number, studentRollNo: string, feeMonth: string): Promise<SchoolFeePayment | undefined> {
    const [payment] = await db
      .select()
      .from(schoolFeePayments)
      .where(and(
        eq(schoolFeePayments.schoolId, schoolId),
        eq(schoolFeePayments.studentRollNo, studentRollNo),
        eq(schoolFeePayments.feeMonth, feeMonth),
        eq(schoolFeePayments.paymentStatus, "completed")
      ));
    return payment || undefined;
  }

  // Fee structure operations
  async createFeeStructure(feeStructure: InsertFeeStructure): Promise<FeeStructure> {
    const [structure] = await db
      .insert(feeStructures)
      .values(feeStructure)
      .returning();
    return structure;
  }

  async getFeeStructures(schoolId: number, academicYear?: string): Promise<FeeStructure[]> {
    if (academicYear) {
      return await db.select().from(feeStructures)
        .where(and(
          eq(feeStructures.schoolId, schoolId),
          eq(feeStructures.academicYear, academicYear)
        ))
        .orderBy(feeStructures.className, feeStructures.feeType);
    }
    
    return await db.select().from(feeStructures)
      .where(eq(feeStructures.schoolId, schoolId))
      .orderBy(feeStructures.className, feeStructures.feeType);
  }

  async getFeeStructureByClass(schoolId: number, className: string, feeType: string, academicYear?: string): Promise<FeeStructure | undefined> {
    if (academicYear) {
      const [structure] = await db.select().from(feeStructures)
        .where(and(
          eq(feeStructures.schoolId, schoolId),
          eq(feeStructures.className, className),
          eq(feeStructures.feeType, feeType),
          eq(feeStructures.academicYear, academicYear),
          eq(feeStructures.isActive, true)
        ));
      return structure || undefined;
    }
    
    const [structure] = await db.select().from(feeStructures)
      .where(and(
        eq(feeStructures.schoolId, schoolId),
        eq(feeStructures.className, className),
        eq(feeStructures.feeType, feeType),
        eq(feeStructures.isActive, true)
      ));
    return structure || undefined;
  }

  async updateFeeStructure(id: number, updates: Partial<InsertFeeStructure>): Promise<FeeStructure | undefined> {
    const [structure] = await db
      .update(feeStructures)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(feeStructures.id, id))
      .returning();
    return structure || undefined;
  }

  async deleteFeeStructure(id: number): Promise<boolean> {
    const result = await db
      .delete(feeStructures)
      .where(eq(feeStructures.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async bulkCreateFeeStructures(structures: InsertFeeStructure[]): Promise<FeeStructure[]> {
    const createdStructures = await db
      .insert(feeStructures)
      .values(structures)
      .returning();
    return createdStructures;
  }

  // Fee payment notification operations
  async createFeePaymentNotification(notification: InsertFeePaymentNotification): Promise<FeePaymentNotification> {
    const [feeNotification] = await db
      .insert(feePaymentNotifications)
      .values(notification)
      .returning();
    return feeNotification;
  }

  async getFeePaymentNotifications(schoolId: number, adminUserId: number): Promise<FeePaymentNotification[]> {
    return db
      .select()
      .from(feePaymentNotifications)
      .where(and(
        eq(feePaymentNotifications.schoolId, schoolId),
        eq(feePaymentNotifications.adminUserId, adminUserId)
      ))
      .orderBy(desc(feePaymentNotifications.createdAt));
  }

  async markFeeNotificationAsRead(notificationId: number): Promise<boolean> {
    const result = await db
      .update(feePaymentNotifications)
      .set({ isRead: true })
      .where(eq(feePaymentNotifications.id, notificationId));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();

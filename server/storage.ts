import {
  users,
  communityPosts,
  schools,
  cultureCategories,
  books,
  publishedWorks,
  userSessions,
  orders,
  cartItems,
  bookStock,
  schoolActivities,
  publicationSubmissions,
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
  type Order,
  type InsertOrder,
  type CartItem,
  type InsertCartItem,
  type BookStock,
  type InsertBookStock,
  type SchoolActivity,
  type InsertSchoolActivity,
  type PublicationSubmission,
  type InsertPublicationSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gt } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: number, isSubscribed: boolean, expiry?: Date): Promise<User | undefined>;
  
  // Authentication operations
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserBySessionToken(token: string): Promise<User | undefined>;
  deleteUserSession(token: string): Promise<boolean>;
  
  // Cart operations
  getCartItems(userId: number): Promise<(CartItem & { book: Book })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  markOrderNotified(id: number): Promise<Order | undefined>;

  // Book stock operations
  getBookStock(bookId: number): Promise<BookStock | undefined>;
  updateBookStock(stock: InsertBookStock): Promise<BookStock>;
  getAllBookStock(): Promise<(BookStock & { book: Book })[]>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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

  async incrementDownloadCount(id: number): Promise<void> {
    const [work] = await db.select().from(publishedWorks).where(eq(publishedWorks.id, id));
    if (work) {
      await db
        .update(publishedWorks)
        .set({ downloadCount: (work.downloadCount || 0) + 1 })
        .where(eq(publishedWorks.id, id));
    }
  }

  async deletePublishedWork(id: number): Promise<boolean> {
    const result = await db.delete(publishedWorks).where(eq(publishedWorks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User subscription operations
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

  // Authentication operations
  async createUserSession(insertSession: InsertUserSession): Promise<UserSession> {
    const [session] = await db
      .insert(userSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getUserBySessionToken(token: string): Promise<User | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.token, token), gt(userSessions.expiresAt, new Date())));
    
    if (!session) return undefined;
    
    return await this.getUser(session.userId);
  }

  async deleteUserSession(token: string): Promise<boolean> {
    const result = await db.delete(userSessions).where(eq(userSessions.token, token));
    return (result.rowCount ?? 0) > 0;
  }

  // Order operations
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db
      .insert(orders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async markOrderNotified(id: number): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ adminNotified: true })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<(CartItem & { book: Book })[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        bookId: cartItems.bookId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        book: books
      })
      .from(cartItems)
      .leftJoin(books, eq(cartItems.bookId, books.id))
      .where(eq(cartItems.userId, userId));
    
    return result.map(item => ({
      id: item.id,
      userId: item.userId,
      bookId: item.bookId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      book: item.book!
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart, update quantity if so
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.bookId, item.bookId)));

    if (existingItem.length > 0) {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem[0].quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    }

    const [cartItem] = await db
      .insert(cartItems)
      .values(item)
      .returning();
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeFromCart(id);
      return undefined;
    }

    const [item] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return item || undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return (result.rowCount ?? 0) > 0;
  }

  // Book stock operations
  async getBookStock(bookId: number): Promise<BookStock | undefined> {
    const [stock] = await db.select().from(bookStock).where(eq(bookStock.bookId, bookId));
    return stock || undefined;
  }

  async updateBookStock(stock: InsertBookStock): Promise<BookStock> {
    const existingStock = await this.getBookStock(stock.bookId);
    
    if (existingStock) {
      const [updatedStock] = await db
        .update(bookStock)
        .set({ 
          quantity: stock.quantity, 
          lastUpdated: new Date(), 
          updatedBy: stock.updatedBy 
        })
        .where(eq(bookStock.bookId, stock.bookId))
        .returning();
      return updatedStock;
    }

    const [newStock] = await db
      .insert(bookStock)
      .values(stock)
      .returning();
    return newStock;
  }

  async getAllBookStock(): Promise<(BookStock & { book: Book })[]> {
    const result = await db
      .select({
        id: bookStock.id,
        bookId: bookStock.bookId,
        quantity: bookStock.quantity,
        lastUpdated: bookStock.lastUpdated,
        updatedBy: bookStock.updatedBy,
        book: books
      })
      .from(bookStock)
      .leftJoin(books, eq(bookStock.bookId, books.id));

    return result.map(item => ({
      id: item.id,
      bookId: item.bookId,
      quantity: item.quantity,
      lastUpdated: item.lastUpdated,
      updatedBy: item.updatedBy,
      book: item.book || {} as Book
    }));
  }

  // Enhanced published work operations
  async updatePublishedWorkStatus(id: number, status: string, approvedBy?: number): Promise<PublishedWork | undefined> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    
    if (status === 'approved' && approvedBy) {
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

  // Publication submission operations
  async getPublicationSubmissions(status?: string): Promise<PublicationSubmission[]> {
    let query = db.select().from(publicationSubmissions);
    
    if (status) {
      query = query.where(eq(publicationSubmissions.status, status));
    }
    
    return await query;
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

  // Statistics
  async getStats(): Promise<{
    totalSchools: number;
    totalPosts: number;
    totalBooks: number;
    totalMembers: number;
  }> {
    const [schoolCount] = await db.select({ count: schools.id }).from(schools);
    const [postCount] = await db.select({ count: communityPosts.id }).from(communityPosts);
    const [bookCount] = await db.select({ count: books.id }).from(books);
    const [memberCount] = await db.select({ count: users.id }).from(users);

    return {
      totalSchools: schoolCount?.count || 0,
      totalPosts: postCount?.count || 0,
      totalBooks: bookCount?.count || 0,
      totalMembers: memberCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();

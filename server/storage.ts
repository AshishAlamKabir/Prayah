import {
  users,
  communityPosts,
  schools,
  cultureCategories,
  books,
  publishedWorks,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  getPublishedWorks(): Promise<PublishedWork[]>;
  getPublishedWork(id: number): Promise<PublishedWork | undefined>;
  getFeaturedPublishedWorks(): Promise<PublishedWork[]>;
  createPublishedWork(work: InsertPublishedWork): Promise<PublishedWork>;
  updatePublishedWork(id: number, work: Partial<InsertPublishedWork>): Promise<PublishedWork | undefined>;
  incrementDownloadCount(id: number): Promise<void>;
  deletePublishedWork(id: number): Promise<boolean>;

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

  async updateCommunityPostStatus(id: number, status: string): Promise<CommunityPost | undefined> {
    const [post] = await db
      .update(communityPosts)
      .set({ status, updatedAt: new Date() })
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
  async getPublishedWorks(): Promise<PublishedWork[]> {
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

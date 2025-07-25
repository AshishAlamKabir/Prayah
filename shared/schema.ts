import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - Enhanced with subscription and authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user"), // user, admin, moderator
  isSubscribed: boolean("is_subscribed").default(false),
  subscriptionExpiry: timestamp("subscription_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community posts table
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schools table - Enhanced with detailed media and descriptions
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  detailedDescription: text("detailed_description"),
  studentCount: integer("student_count").default(0),
  imageUrl: text("image_url"),
  logo: text("logo"),
  mediaFiles: jsonb("media_files").default([]), // Array of image/video URLs
  programs: text("programs").array(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  achievements: text("achievements").array(),
  facilities: text("facilities").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Culture categories table - Enhanced with media and YouTube links
export const cultureCategories = pgTable("culture_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // music, fine-arts, dance-drama-poems
  description: text("description").notNull(),
  detailedDescription: text("detailed_description"),
  icon: text("icon").notNull(),
  programs: jsonb("programs").default([]),
  mediaFiles: jsonb("media_files").default([]), // Images, videos, audio files
  youtubeChannelUrl: text("youtube_channel_url"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User sessions table for authentication
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Books table - Enhanced for e-commerce with subscription access
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  pdfUrl: text("pdf_url"),
  inStock: boolean("in_stock").default(true),
  isbn: text("isbn"),
  publishedYear: integer("published_year"),
  subscriptionOnly: boolean("subscription_only").default(false), // Only for subscribers
  featured: boolean("featured").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Published works table - Enhanced with admin approval
export const publishedWorks = pgTable("published_works", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // article, research, manifesto, etc.
  pdfUrl: text("pdf_url"),
  downloadCount: integer("download_count").default(0),
  featured: boolean("featured").default(false),
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"), // admin user id
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table for e-commerce
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id"),
  isSubscription: boolean("is_subscription").default(false),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, completed, cancelled
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCultureCategorySchema = createInsertSchema(cultureCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPublishedWorkSchema = createInsertSchema(publishedWorks).omit({
  id: true,
  downloadCount: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;

export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export type CultureCategory = typeof cultureCategories.$inferSelect;
export type InsertCultureCategory = z.infer<typeof insertCultureCategorySchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type PublishedWork = typeof publishedWorks.$inferSelect;
export type InsertPublishedWork = z.infer<typeof insertPublishedWorkSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Stats type
export interface Stats {
  totalSchools: number;
  totalPosts: number;
  totalBooks: number;
  totalMembers: number;
}

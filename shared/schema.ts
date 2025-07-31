import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - Enhanced with granular role-based permissions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user"), // user, admin, moderator, school_admin, culture_admin
  isSubscribed: boolean("is_subscribed").default(false),
  subscriptionExpiry: timestamp("subscription_expiry"),
  // Granular permissions for specific sections
  schoolPermissions: jsonb("school_permissions").default([]), // Array of school IDs user can manage
  culturePermissions: jsonb("culture_permissions").default([]), // Array of culture category IDs user can manage
  permissions: jsonb("permissions").default([]), // Additional specific permissions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Community posts table - Enhanced with media support
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  userId: integer("user_id"), // Optional: link to registered user
  mediaFiles: jsonb("media_files").default([]), // Array of media file URLs/paths
  tags: text("tags").array(), // Optional tags for categorization
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by"), // Admin user who approved
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
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
  editor: text("editor"), // Optional editor field
  contributorRole: text("contributor_role").default("author"), // author, editor, author-editor
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  pdfUrl: text("pdf_url"),
  bookType: text("book_type").notNull().default("paperback"), // paperback, pdf, both
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
  contributorRole: text("contributor_role").default("author"), // author, editor, author-editor
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

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table - Comprehensive payment tracking with admin notifications
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  stripeChargeId: text("stripe_charge_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd"),
  status: text("status").notNull(), // pending, succeeded, failed, canceled, refunded
  paymentType: text("payment_type").notNull(), // book_purchase, subscription, publication_fee, school_fee, culture_program
  userId: integer("user_id").notNull(),
  orderId: integer("order_id"), // For book purchases
  publicationSubmissionId: integer("publication_submission_id"), // For publication fees
  schoolId: integer("school_id"), // For school-related payments
  cultureId: integer("culture_id"), // For culture program payments
  description: text("description"),
  customerEmail: text("customer_email").notNull(),
  customerName: text("customer_name").notNull(),
  billingAddress: jsonb("billing_address"), // Address information
  metadata: jsonb("metadata").default({}), // Additional payment context
  adminsNotified: boolean("admins_notified").default(false),
  notificationsSent: jsonb("notifications_sent").default([]), // Track which admins were notified
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  refundReason: text("refund_reason"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin notifications table - Track notifications sent to role-based admins
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull(),
  notificationType: text("notification_type").notNull(), // payment_received, order_placed, publication_submitted, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  relatedEntityType: text("related_entity_type"), // payment, order, publication, school, culture
  relatedEntityId: integer("related_entity_id"),
  paymentId: integer("payment_id"), // Link to payment if applicable
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table for e-commerce - Enhanced with multiple books support and shipping
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  orderItems: jsonb("order_items").notNull(), // Array of {bookId, quantity, price, title}
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  shippingRegion: text("shipping_region"), // northeast, west-bengal, rest-of-india
  status: text("status").default("pending"), // pending, completed, cancelled
  paymentMethod: text("payment_method"),
  paymentLink: text("payment_link"), // Generated payment link
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  shippingAddress: text("shipping_address"),
  adminNotified: boolean("admin_notified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Book stock table for inventory management
export const bookStock = pgTable("book_stock", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  quantity: integer("quantity").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: integer("updated_by").notNull(), // admin user id
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

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  adminNotified: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookStockSchema = createInsertSchema(bookStock).omit({
  id: true,
  lastUpdated: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({
  id: true,
  createdAt: true,
});

// School notifications table
export const schoolNotifications = pgTable("school_notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("announcement"), // announcement, event, admission, examination, holiday, activity
  schoolId: integer("school_id"), // null means all schools
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  mediaFiles: jsonb("media_files").default([]), // Array of uploaded media files
  publishDate: timestamp("publish_date").notNull(),
  isActive: boolean("is_active").default(true),
  views: integer("views").default(0),
  createdBy: integer("created_by").notNull(), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSchoolNotificationSchema = createInsertSchema(schoolNotifications).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

// School activities table for tracking events, programs, and achievements
export const schoolActivities = pgTable("school_activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  activityType: text("activity_type").notNull().default("event"), // event, program, achievement, competition, workshop
  schoolId: integer("school_id").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, ongoing, completed, cancelled
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  contactPerson: text("contact_person"),
  contactInfo: jsonb("contact_info").default({}), // {phone, email}
  attachments: jsonb("attachments").default([]), // Array of uploaded files
  requirements: text("requirements"), // Prerequisites or requirements
  achievements: text("achievements"), // Awards or recognition received
  isPublic: boolean("is_public").default(true),
  createdBy: integer("created_by").notNull(), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSchoolActivitySchema = createInsertSchema(schoolActivities).omit({
  id: true,
  currentParticipants: true,
  createdAt: true,
  updatedAt: true,
});

// Culture programs table for enhanced program management
export const culturePrograms = pgTable("culture_programs", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  activityType: text("activity_type").notNull().default("regular"), // regular, workshop, masterclass, competition, performance
  instructorName: text("instructor_name"),
  contactInfo: jsonb("contact_info").default({}), // {phone, email, address}
  socialMedia: jsonb("social_media").default({}), // {facebook, instagram, youtube, twitter, website}
  schedule: jsonb("schedule").default({}), // {days: [], time, duration}
  fees: jsonb("fees").default({}), // {monthly, registration}
  capacity: integer("capacity").default(0),
  ageGroup: text("age_group").default("all"), // all, children, teens, adults, seniors
  mediaFiles: jsonb("media_files").default([]), // Array of uploaded media files
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull(), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Culture activities table for recent activities and events
export const cultureActivities = pgTable("culture_activities", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  activityType: text("activity_type").notNull().default("event"), // event, performance, competition, workshop, exhibition, award
  eventDate: timestamp("event_date").notNull(),
  location: text("location"),
  participants: integer("participants").default(0),
  achievements: text("achievements"), // Awards and recognitions
  mediaFiles: jsonb("media_files").default([]), // Array of uploaded media files
  views: integer("views").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").notNull(), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCultureProgramSchema = createInsertSchema(culturePrograms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCultureActivitySchema = createInsertSchema(cultureActivities).omit({
  id: true,
  views: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type SchoolActivity = typeof schoolActivities.$inferSelect;
export type InsertSchoolActivity = typeof insertSchoolActivitySchema._type;
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

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type BookStock = typeof bookStock.$inferSelect;
export type InsertBookStock = z.infer<typeof insertBookStockSchema>;

export type SchoolNotification = typeof schoolNotifications.$inferSelect;
export type InsertSchoolNotification = z.infer<typeof insertSchoolNotificationSchema>;

export type CultureProgram = typeof culturePrograms.$inferSelect;
export type InsertCultureProgram = z.infer<typeof insertCultureProgramSchema>;

export type CultureActivity = typeof cultureActivities.$inferSelect;
export type InsertCultureActivity = z.infer<typeof insertCultureActivitySchema>;

// Publication submissions table for manuscript review and publication workflow
export const publicationSubmissions = pgTable("publication_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(), // fiction, non-fiction, poetry, academic, etc.
  description: text("description").notNull(),
  pdfUrl: text("pdf_url").notNull(), // Path to uploaded manuscript PDF
  status: text("status").notNull().default("pending"), // pending, approved, rejected, payment_pending, published
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by"), // admin user id
  adminNotes: text("admin_notes"), // Review feedback or rejection reason
  publicationFee: decimal("publication_fee", { precision: 10, scale: 2 }), // Fee amount if approved
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  paymentId: text("payment_id"), // Stripe payment intent ID
  publishedAt: timestamp("published_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPublicationSubmissionSchema = createInsertSchema(publicationSubmissions).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type PublicationSubmission = typeof publicationSubmissions.$inferSelect;
export type InsertPublicationSubmission = z.infer<typeof insertPublicationSubmissionSchema>;

// Payment types
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Admin notification types
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

// Stats type
export interface Stats {
  totalSchools: number;
  totalPosts: number;
  totalBooks: number;
  totalMembers: number;
}

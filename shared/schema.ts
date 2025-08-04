import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
}, (table) => {
  return {
    usernameIdx: uniqueIndex('users_username_idx').on(table.username),
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
    subscriptionIdx: index('users_subscription_idx').on(table.isSubscribed, table.subscriptionExpiry),
  };
});

// Community posts table - Enhanced with media support
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }), // Optional: link to registered user
  mediaFiles: jsonb("media_files").default([]), // Array of media file URLs/paths
  tags: text("tags").array(), // Optional tags for categorization
  status: text("status").default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: 'set null' }), // Admin user who approved
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    statusIdx: index('community_posts_status_idx').on(table.status),
    categoryIdx: index('community_posts_category_idx').on(table.category),
    userIdx: index('community_posts_user_idx').on(table.userId),
    createdAtIdx: index('community_posts_created_at_idx').on(table.createdAt),
  };
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    tokenIdx: uniqueIndex('user_sessions_token_idx').on(table.token),
    userIdx: index('user_sessions_user_idx').on(table.userId),
    expiresIdx: index('user_sessions_expires_idx').on(table.expiresAt),
  };
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    userBookIdx: uniqueIndex('cart_items_user_book_idx').on(table.userId, table.bookId),
    userIdx: index('cart_items_user_idx').on(table.userId),
    bookIdx: index('cart_items_book_idx').on(table.bookId),
  };
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
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'restrict' }),
  orderId: integer("order_id").references(() => orders.id, { onDelete: 'set null' }), // For book purchases
  publicationSubmissionId: integer("publication_submission_id"), // For publication fees
  schoolId: integer("school_id").references(() => schools.id, { onDelete: 'set null' }), // For school-related payments
  cultureId: integer("culture_id").references(() => cultureCategories.id, { onDelete: 'set null' }), // For culture program payments
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
}, (table) => {
  return {
    stripePaymentIntentIdx: uniqueIndex('payments_stripe_intent_idx').on(table.stripePaymentIntentId),
    statusIdx: index('payments_status_idx').on(table.status),
    userIdx: index('payments_user_idx').on(table.userId),
    typeIdx: index('payments_type_idx').on(table.paymentType),
    orderIdx: index('payments_order_idx').on(table.orderId),
    createdAtIdx: index('payments_created_at_idx').on(table.createdAt),
  };
});

// Admin notifications table - Track notifications sent to role-based admins
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationType: text("notification_type").notNull(), // payment_received, order_placed, publication_submitted, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  relatedEntityType: text("related_entity_type"), // payment, order, publication, school, culture
  relatedEntityId: integer("related_entity_id"),
  paymentId: integer("payment_id").references(() => payments.id, { onDelete: 'set null' }), // Link to payment if applicable
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    adminUserIdx: index('admin_notifications_user_idx').on(table.adminUserId),
    typeIdx: index('admin_notifications_type_idx').on(table.notificationType),
    readIdx: index('admin_notifications_read_idx').on(table.isRead),
    priorityIdx: index('admin_notifications_priority_idx').on(table.priority),
    paymentIdx: index('admin_notifications_payment_idx').on(table.paymentId),
    createdAtIdx: index('admin_notifications_created_at_idx').on(table.createdAt),
  };
});

// Orders table for e-commerce - Enhanced with multiple books support and shipping
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'restrict' }),
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
}, (table) => {
  return {
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
    emailIdx: index('orders_email_idx').on(table.customerEmail),
  };
});

// Book stock table for inventory management
export const bookStock = pgTable("book_stock", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: integer("updated_by").notNull().references(() => users.id, { onDelete: 'restrict' }), // admin user id
}, (table) => {
  return {
    bookIdx: uniqueIndex('book_stock_book_idx').on(table.bookId),
    quantityIdx: index('book_stock_quantity_idx').on(table.quantity),
    updatedByIdx: index('book_stock_updated_by_idx').on(table.updatedBy),
  };
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

// School fee payments table for fee collection system
export const schoolFeePayments = pgTable("school_fee_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  studentRollNo: varchar("student_roll_no", { length: 50 }).notNull(),
  studentName: varchar("student_name", { length: 100 }).notNull(),
  studentClass: varchar("student_class", { length: 50 }).notNull(),
  feeMonth: varchar("fee_month", { length: 20 }).notNull(), // e.g., "January 2024"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("INR"),
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("pending"), // pending, completed, failed, refunded
  razorpayOrderId: varchar("razorpay_order_id", { length: 100 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 100 }),
  paymentMethod: varchar("payment_method", { length: 50 }), // UPI, card, netbanking, wallet
  transactionFee: decimal("transaction_fee", { precision: 8, scale: 2 }).default("0.00"),
  receiptNumber: varchar("receipt_number", { length: 50 }),
  adminNotified: boolean("admin_notified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Indexes for performance and preventing duplicate payments
  index("idx_school_fee_student_month").on(table.schoolId, table.studentRollNo, table.feeMonth),
  index("idx_school_fee_user").on(table.userId),
  index("idx_school_fee_status").on(table.paymentStatus),
  index("idx_school_fee_school").on(table.schoolId),
  index("idx_razorpay_order").on(table.razorpayOrderId),
  // Prevent duplicate fee payments for same student/month
  uniqueIndex("unique_student_fee_month").on(table.schoolId, table.studentRollNo, table.feeMonth)
]);

export const insertSchoolFeePaymentSchema = createInsertSchema(schoolFeePayments, {
  amount: z.string().transform((val) => parseFloat(val)),
  studentRollNo: z.string().min(1, "Roll number is required"),
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  studentClass: z.string().min(1, "Class is required"),
  feeMonth: z.string().min(1, "Fee month is required"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  receiptNumber: true,
  adminNotified: true,
  paymentStatus: true,
  currency: true,
  paymentMethod: true,
  transactionFee: true,
});

// Fee payment notification table for school admins
export const feePaymentNotifications = pgTable("fee_payment_notifications", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  feePaymentId: integer("fee_payment_id").notNull().references(() => schoolFeePayments.id),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  notificationType: varchar("notification_type", { length: 30 }).notNull().default("fee_payment_received"),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_fee_notification_school_admin").on(table.schoolId, table.adminUserId),
  index("idx_fee_notification_payment").on(table.feePaymentId),
  index("idx_fee_notification_unread").on(table.isRead),
]);

export const insertFeePaymentNotificationSchema = createInsertSchema(feePaymentNotifications).omit({
  id: true,
  createdAt: true,
  notificationType: true,
});

// Fee structures table for schools - Enhanced with Razorpay charges
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
  className: varchar("class_name", { length: 50 }).notNull(),
  feeType: varchar("fee_type", { length: 20 }).notNull(), // 'monthly', 'renewal', 'admission'
  schoolAmount: decimal("school_amount", { precision: 10, scale: 2 }).notNull(), // Amount school receives
  razorpayChargePercent: decimal("razorpay_charge_percent", { precision: 5, scale: 4 }).default("2.36"), // 2.36%
  razorpayFixedCharge: decimal("razorpay_fixed_charge", { precision: 10, scale: 2 }).default("0.00"),
  studentPaysAmount: decimal("student_pays_amount", { precision: 10, scale: 2 }).notNull(), // Total amount student pays
  installments: integer("installments").default(1),
  academicYear: varchar("academic_year", { length: 20 }).default("2025-26"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    schoolClassIdx: index('fee_structures_school_class_idx').on(table.schoolId, table.className),
    feeTypeIdx: index('fee_structures_fee_type_idx').on(table.feeType),
    academicYearIdx: index('fee_structures_academic_year_idx').on(table.academicYear),
  };
});

export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// School fee payment types
export type SchoolFeePayment = typeof schoolFeePayments.$inferSelect;
export type InsertSchoolFeePayment = z.infer<typeof insertSchoolFeePaymentSchema>;

// Fee payment notification types
export type FeePaymentNotification = typeof feePaymentNotifications.$inferSelect;
export type InsertFeePaymentNotification = z.infer<typeof insertFeePaymentNotificationSchema>;

// Fee structure types
export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;

// Database Relations for referential integrity and query optimization
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  cartItems: many(cartItems),
  orders: many(orders),
  payments: many(payments),
  adminNotifications: many(adminNotifications),
  approvedPosts: many(communityPosts, { relationName: "approvedBy" }),
  submittedPosts: many(communityPosts, { relationName: "submittedBy" }),
  feePayments: many(schoolFeePayments),
  feeNotifications: many(feePaymentNotifications),
}));

export const booksRelations = relations(books, ({ many, one }) => ({
  cartItems: many(cartItems),
  stock: one(bookStock),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  book: one(books, { fields: [cartItems.bookId], references: [books.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  school: one(schools, { fields: [payments.schoolId], references: [schools.id] }),
  cultureCategory: one(cultureCategories, { fields: [payments.cultureId], references: [cultureCategories.id] }),
}));

export const adminNotificationsRelations = relations(adminNotifications, ({ one }) => ({
  admin: one(users, { fields: [adminNotifications.adminUserId], references: [users.id] }),
  payment: one(payments, { fields: [adminNotifications.paymentId], references: [payments.id] }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, { fields: [userSessions.userId], references: [users.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  author: one(users, { fields: [communityPosts.userId], references: [users.id], relationName: "submittedBy" }),
  approver: one(users, { fields: [communityPosts.approvedBy], references: [users.id], relationName: "approvedBy" }),
}));

export const bookStockRelations = relations(bookStock, ({ one }) => ({
  book: one(books, { fields: [bookStock.bookId], references: [books.id] }),
  updatedByUser: one(users, { fields: [bookStock.updatedBy], references: [users.id] }),
}));

export const schoolFeePaymentsRelations = relations(schoolFeePayments, ({ one, many }) => ({
  user: one(users, { fields: [schoolFeePayments.userId], references: [users.id] }),
  school: one(schools, { fields: [schoolFeePayments.schoolId], references: [schools.id] }),
  notifications: many(feePaymentNotifications),
}));

export const feePaymentNotificationsRelations = relations(feePaymentNotifications, ({ one }) => ({
  school: one(schools, { fields: [feePaymentNotifications.schoolId], references: [schools.id] }),
  feePayment: one(schoolFeePayments, { fields: [feePaymentNotifications.feePaymentId], references: [schoolFeePayments.id] }),
  admin: one(users, { fields: [feePaymentNotifications.adminUserId], references: [users.id] }),
}));

export const feeStructuresRelations = relations(feeStructures, ({ one }) => ({
  school: one(schools, { fields: [feeStructures.schoolId], references: [schools.id] }),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  feePayments: many(schoolFeePayments),
  feeNotifications: many(feePaymentNotifications),
  feeStructures: many(feeStructures),
}));



// Stats type
export interface Stats {
  totalSchools: number;
  totalPosts: number;
  totalBooks: number;
  totalMembers: number;
}

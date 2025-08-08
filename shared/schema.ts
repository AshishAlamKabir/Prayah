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
  // Fee payment configuration
  feePaymentEnabled: boolean("fee_payment_enabled").default(false),
  paymentMethods: jsonb("payment_methods").default(["razorpay"]), // Available payment methods
  paymentConfig: jsonb("payment_config").default({}), // Payment gateway configurations
  adminApprovalRequired: boolean("admin_approval_required").default(true),
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
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  imageUrl: text("image_url"),
  pdfUrl: text("pdf_url"),
  bookType: text("book_type").notNull().default("paperback"), // paperback, pdf, both
  stock: integer("stock").notNull().default(0), // Available quantity for purchase
  isbn: text("isbn"),
  publishedYear: integer("published_year"),
  // Removed subscription restrictions - all books are now accessible
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
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    userIdx: index('cart_items_user_idx').on(table.userId),
    bookIdx: index('cart_items_book_idx').on(table.bookId),
    userBookIdx: uniqueIndex('cart_items_user_book_idx').on(table.userId, table.bookId),
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
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("inr"),
  shippingAddress: jsonb("shipping_address"), // {name, address, city, state, country, postalCode, phone}
  billingAddress: jsonb("billing_address"), // {name, address, city, state, country, postalCode, phone}
  paymentMethod: text("payment_method"), // razorpay, stripe, cod
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed, refunded
  paymentId: text("payment_id"), // Payment gateway transaction ID
  notes: text("notes"), // Customer notes
  adminNotes: text("admin_notes"), // Admin notes
  trackingNumber: text("tracking_number"), // Shipping tracking number
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    orderNumberIdx: uniqueIndex('orders_order_number_idx').on(table.orderNumber),
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
    paymentStatusIdx: index('orders_payment_status_idx').on(table.paymentStatus),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  };
});

// Order items table for storing ordered books
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: 'cascade' }),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: 'restrict' }),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price at time of order
  title: text("title").notNull(), // Book title at time of order
  author: text("author").notNull(), // Book author at time of order
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    orderIdx: index('order_items_order_idx').on(table.orderId),
    bookIdx: index('order_items_book_idx').on(table.bookId),
  };
});

// Book stock table for inventory management
export const bookStock = pgTable("book_stock", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id, { onDelete: 'cascade' }),
  quantity: integer("quantity").notNull().default(0),
  reservedQuantity: integer("reserved_quantity").notNull().default(0), // For pending orders
  lowStockThreshold: integer("low_stock_threshold").default(10),
  lastRestockedAt: timestamp("last_restocked_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    bookIdx: uniqueIndex('book_stock_book_idx').on(table.bookId),
    quantityIdx: index('book_stock_quantity_idx').on(table.quantity),
  };
});

// School fee payments table for managing student fee payments
export const schoolFeePayments = pgTable("school_fee_payments", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
  studentName: text("student_name").notNull(),
  className: text("class_name").notNull(),
  feeType: text("fee_type").notNull(), // monthly, annual, admission, examination, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  contactDetails: jsonb("contact_details").default({}), // phone, email, address
  status: text("status").default("pending"), // pending, approved, completed, cancelled
  paymentMethod: text("payment_method"), // razorpay, stripe, cash
  paymentLink: text("payment_link"), // Generated payment gateway link
  adminApprovalRequired: boolean("admin_approval_required").default(true),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: 'set null' }),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    schoolIdx: index('school_fee_payments_school_idx').on(table.schoolId),
    statusIdx: index('school_fee_payments_status_idx').on(table.status),
    studentIdx: index('school_fee_payments_student_idx').on(table.studentName),
    createdAtIdx: index('school_fee_payments_created_at_idx').on(table.createdAt),
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
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  shippedAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertBookStockSchema = createInsertSchema(bookStock).omit({
  id: true,
  lastRestockedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSchoolFeePaymentSchema = createInsertSchema(schoolFeePayments).omit({
  id: true,
  approvedBy: true,
  approvedAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
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

// Payment types
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Admin notification types
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;

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

// Cart item types
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Order types
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Order item types
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Book stock types
export type BookStock = typeof bookStock.$inferSelect;
export type InsertBookStock = z.infer<typeof insertBookStockSchema>;

// School fee payment types
export type SchoolFeePayment = typeof schoolFeePayments.$inferSelect;
export type InsertSchoolFeePayment = z.infer<typeof insertSchoolFeePaymentSchema>;

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



// Fee payment notification table for school admins
export const feePaymentNotifications = pgTable("fee_payment_notifications", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  feePaymentId: integer("fee_payment_id").notNull().references(() => schoolFeePayments.id),
  adminUserId: integer("admin_user_id").notNull().references(() => users.id),
  notificationType: text("notification_type").notNull().default("fee_payment_received"),
  title: text("title").notNull(),
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
  orderItems: many(orderItems),
  stock: one(bookStock, { fields: [books.id], references: [bookStock.bookId] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, { fields: [cartItems.userId], references: [users.id] }),
  book: one(books, { fields: [cartItems.bookId], references: [books.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  book: one(books, { fields: [orderItems.bookId], references: [books.id] }),
}));

export const bookStockRelations = relations(bookStock, ({ one }) => ({
  book: one(books, { fields: [bookStock.bookId], references: [books.id] }),
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

// Removed bookStock relations - e-commerce removed

export const schoolFeePaymentsRelations = relations(schoolFeePayments, ({ one, many }) => ({
  school: one(schools, { fields: [schoolFeePayments.schoolId], references: [schools.id] }),
  approver: one(users, { fields: [schoolFeePayments.approvedBy], references: [users.id] }),
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



// Students table for school management
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  rollNumber: text("roll_number").notNull(),
  className: text("class_name").notNull(), // Using the class hierarchy from prompt
  stream: text("stream"), // For XI/XII classes: Arts, Commerce, Science
  admissionDate: timestamp("admission_date").notNull(),
  status: text("status").notNull().default("active"), // active, promoted, demoted, dropped_out
  parentName: text("parent_name"),
  contactNumber: text("contact_number"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // male, female, other
  previousSchool: text("previous_school"),
  remarks: text("remarks"),
  createdBy: integer("created_by").notNull().references(() => users.id), // Admin who added the student
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    schoolIdx: index('students_school_idx').on(table.schoolId),
    classIdx: index('students_class_idx').on(table.className),
    statusIdx: index('students_status_idx').on(table.status),
    rollIdx: index('students_roll_idx').on(table.rollNumber),
    schoolRollIdx: uniqueIndex('students_school_roll_idx').on(table.schoolId, table.rollNumber),
  };
});

// Student status changes table for tracking promotions/demotions
export const studentStatusChanges = pgTable("student_status_changes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  previousStatus: text("previous_status").notNull(),
  newStatus: text("new_status").notNull(),
  previousClass: text("previous_class"),
  newClass: text("new_class"),
  reason: text("reason"),
  remarks: text("remarks"),
  changedBy: integer("changed_by").notNull().references(() => users.id), // Admin who made the change
  changedAt: timestamp("changed_at").defaultNow(),
}, (table) => {
  return {
    studentIdx: index('status_changes_student_idx').on(table.studentId),
    changedAtIdx: index('status_changes_date_idx').on(table.changedAt),
  };
});

// Student fee payments table (separate from school fee payments)
export const studentFeePayments = pgTable("student_fee_payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id, { onDelete: 'cascade' }),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMode: text("payment_mode").notNull(), // cash, website, upi
  paymentDate: timestamp("payment_date").notNull(),
  feeType: text("fee_type").notNull(), // monthly, annual, admission, examination, etc.
  academicYear: text("academic_year").default("2025-26"),
  month: text("month"), // For monthly fees
  receiptNumber: text("receipt_number"),
  remarks: text("remarks"),
  paymentReference: text("payment_reference"), // For UPI/online payments
  collectedBy: integer("collected_by").notNull().references(() => users.id), // Admin who recorded the payment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    studentIdx: index('student_payments_student_idx').on(table.studentId),
    schoolIdx: index('student_payments_school_idx').on(table.schoolId),
    paymentDateIdx: index('student_payments_date_idx').on(table.paymentDate),
    paymentModeIdx: index('student_payments_mode_idx').on(table.paymentMode),
    academicYearIdx: index('student_payments_year_idx').on(table.academicYear),
  };
});

// Excel upload history table for tracking imports
export const studentExcelUploads = pgTable("student_excel_uploads", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id, { onDelete: 'cascade' }),
  fileName: text("file_name").notNull(),
  extractedClass: text("extracted_class"), // Extracted from filename
  extractedStream: text("extracted_stream"), // Extracted from filename
  totalRows: integer("total_rows").default(0),
  successfulImports: integer("successful_imports").default(0),
  failedImports: integer("failed_imports").default(0),
  errors: jsonb("errors").default([]), // Array of error messages
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
}, (table) => {
  return {
    schoolIdx: index('excel_uploads_school_idx').on(table.schoolId),
    uploadDateIdx: index('excel_uploads_date_idx').on(table.uploadedAt),
  };
});

// Insert schemas for new tables
export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentStatusChangeSchema = createInsertSchema(studentStatusChanges).omit({
  id: true,
  changedAt: true,
});

export const insertStudentFeePaymentSchema = createInsertSchema(studentFeePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStudentExcelUploadSchema = createInsertSchema(studentExcelUploads).omit({
  id: true,
  uploadedAt: true,
});

// Types for new tables
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type StudentStatusChange = typeof studentStatusChanges.$inferSelect;
export type InsertStudentStatusChange = z.infer<typeof insertStudentStatusChangeSchema>;

export type StudentFeePayment = typeof studentFeePayments.$inferSelect;
export type InsertStudentFeePayment = z.infer<typeof insertStudentFeePaymentSchema>;

export type StudentExcelUpload = typeof studentExcelUploads.$inferSelect;
export type InsertStudentExcelUpload = z.infer<typeof insertStudentExcelUploadSchema>;

// Class hierarchy order for promotions (as specified in prompt)
export const CLASS_ORDER = {
  "Ankur": 1,
  "Kuhi": 2,
  "Sopan": 3,
  "I": 4,
  "II": 5,
  "III": 6,
  "IV": 7,
  "V": 8,
  "VI": 9,
  "VII": 10,
  "VIII": 11,
  "IX": 12,
  "X": 13,
  "XI Arts": 14,
  "XI Commerce": 15,
  "XI Science": 16,
  "XII Arts": 17,
  "XII Commerce": 18,
  "XII Science": 19
} as const;

// Stats type
export interface Stats {
  totalSchools: number;
  totalPosts: number;
  totalBooks: number;
  totalMembers: number;
}
// Add student-related relations
export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  creator: one(users, { fields: [students.createdBy], references: [users.id] }),
  statusChanges: many(studentStatusChanges),
  feePayments: many(studentFeePayments),
}));

export const studentStatusChangesRelations = relations(studentStatusChanges, ({ one }) => ({
  student: one(students, { fields: [studentStatusChanges.studentId], references: [students.id] }),
  changedByUser: one(users, { fields: [studentStatusChanges.changedBy], references: [users.id] }),
}));

export const studentFeePaymentsRelations = relations(studentFeePayments, ({ one }) => ({
  student: one(students, { fields: [studentFeePayments.studentId], references: [students.id] }),
  school: one(schools, { fields: [studentFeePayments.schoolId], references: [schools.id] }),
  collector: one(users, { fields: [studentFeePayments.collectedBy], references: [users.id] }),
}));

export const studentExcelUploadsRelations = relations(studentExcelUploads, ({ one }) => ({
  school: one(schools, { fields: [studentExcelUploads.schoolId], references: [schools.id] }),
  uploader: one(users, { fields: [studentExcelUploads.uploadedBy], references: [users.id] }),
}));
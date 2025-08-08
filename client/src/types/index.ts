// Centralized type definitions for better type safety across the application

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'school_admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: number;
  name: string;
  location: string;
  contactInfo?: string;
  feePaymentEnabled: boolean;
  paymentMethods: string[];
  adminApprovalRequired: boolean;
  paymentConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  coverImage?: string;
  category: string;
  stock: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  userId: number;
  bookId: number;
  quantity: number;
  book?: Book;
  createdAt: string;
  updatedAt: string;
}

export interface InsertCartItem {
  userId: number;
  bookId: number;
  quantity: number;
}

export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  currency: string;
  shippingAddress?: any;
  billingAddress?: any;
  paymentMethod?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  notes?: string;
  adminNotes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  user?: User;
}

export interface OrderItem {
  id: number;
  orderId: number;
  bookId: number;
  quantity: number;
  price: number;
  title: string;
  author: string;
  book?: Book;
  createdAt: string;
}

export interface InsertOrder {
  userId: number;
  totalAmount: number;
  currency?: string;
  shippingAddress?: any;
  billingAddress?: any;
  paymentMethod?: string;
  notes?: string;
}

export interface InsertOrderItem {
  orderId: number;
  bookId: number;
  quantity: number;
  price: number;
  title: string;
  author: string;
}

export interface PaymentNotification {
  id: number;
  schoolId: number;
  schoolName: string;
  amount: number;
  studentName: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface BookForm {
  title: string;
  author: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  published: boolean;
  coverImage?: string;
}

export interface SchoolForm {
  name: string;
  location: string;
  contactInfo?: string;
  feePaymentEnabled: boolean;
  paymentMethods: string[];
  adminApprovalRequired: boolean;
}

// Filter types
export interface BookFilters {
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  published?: boolean;
}

export interface SchoolFilters {
  location?: string;
  feePaymentEnabled?: boolean;
  search?: string;
}

// Stats types
export interface PaymentStats {
  totalSchools: number;
  enabledSchools: number;
  pendingNotifications: number;
  recentPayments: number;
}

export interface AdminStats {
  totalUsers: number;
  totalBooks: number;
  totalOrders: number;
  totalRevenue: number;
  activeSchools: number;
  pendingPublications: number;
}

// Business logic types
export interface PaymentSettings {
  feePaymentEnabled?: boolean;
  paymentMethods?: string[];
  adminApprovalRequired?: boolean;
  paymentConfig?: Record<string, any>;
}

export interface FeePayment {
  studentName: string;
  amount: number;
  paymentMethod: string;
  schoolId: number;
}

// UI State types
export interface TableState {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view' | 'delete';
  data?: any;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
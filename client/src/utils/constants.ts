// Application constants and configuration

export const APP_CONFIG = {
  name: "PrayasAdhayanChakra E-commerce Platform",
  version: "1.0.0",
  description: "Comprehensive e-commerce bookstore integrated with educational management",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    REGISTER: "/api/auth/register",
  },
  BOOKS: {
    LIST: "/api/books",
    CREATE: "/api/books",
    UPDATE: (id: number) => `/api/books/${id}`,
    DELETE: (id: number) => `/api/books/${id}`,
    SEARCH: "/api/books/search",
    CATEGORY: (category: string) => `/api/books/category/${category}`,
  },
  SCHOOLS: {
    LIST: "/api/schools",
    CREATE: "/api/schools",
    UPDATE: (id: number) => `/api/schools/${id}`,
    DELETE: (id: number) => `/api/schools/${id}`,
    PAYMENT_SETTINGS: (id: number) => `/api/admin/schools/${id}/payment-settings`,
  },
  PAYMENTS: {
    NOTIFICATIONS: "/api/admin/payment-notifications",
    CREATE: "/api/fee-payments",
    PROCESS: "/api/payments/process",
  },
  ADMIN: {
    DASHBOARD: "/api/admin/dashboard",
    STATS: "/api/admin/stats",
    NOTIFICATIONS: "/api/admin/notifications",
    EXPORT: (type: string) => `/api/admin/export/${type}`,
  },
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  SCHOOL_ADMIN: "school_admin",
  USER: "user",
} as const;

export const PAYMENT_METHODS = {
  RAZORPAY: "razorpay",
  STRIPE: "stripe",
  UPI: "upi",
  BANK_TRANSFER: "bank_transfer",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

export const NOTIFICATION_TYPES = {
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SUCCESS: "success",
} as const;

export const BOOK_CATEGORIES = [
  "Fiction",
  "Non-Fiction", 
  "Science",
  "Mathematics",
  "History",
  "Geography",
  "Literature",
  "Philosophy",
  "Technology",
  "Biography",
  "Children",
  "Educational",
  "Reference",
] as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
  },
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
  },
  BOOK: {
    TITLE_MAX_LENGTH: 200,
    AUTHOR_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000,
    MIN_PRICE: 0,
    MAX_PRICE: 10000,
    MIN_STOCK: 0,
    MAX_STOCK: 10000,
  },
  SCHOOL: {
    NAME_MAX_LENGTH: 100,
    LOCATION_MAX_LENGTH: 100,
    CONTACT_MAX_LENGTH: 500,
  },
} as const;

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  LOADING_TIMEOUT: 30000,
  SKELETON_LINES: 3,
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER: "user",
  THEME: "theme",
  LANGUAGE: "language",
  CART: "cart",
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access denied. Insufficient permissions.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Internal server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN: "Logged in successfully",
  LOGOUT: "Logged out successfully",
  SAVE: "Changes saved successfully",
  DELETE: "Deleted successfully",
  CREATE: "Created successfully",
  UPDATE: "Updated successfully",
  PAYMENT: "Payment processed successfully",
} as const;
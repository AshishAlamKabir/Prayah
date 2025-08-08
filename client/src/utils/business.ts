// Business logic utility functions

import { PaymentNotification, Book, School } from "@/types";

/**
 * Calculate payment statistics from schools and notifications
 */
export function calculatePaymentStats(
  schools: School[],
  notifications: PaymentNotification[]
) {
  const totalSchools = schools.length;
  const enabledSchools = schools.filter(s => s.feePaymentEnabled).length;
  const pendingNotifications = notifications.filter(n => n.status === 'pending').length;
  
  // Calculate recent payments (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentPayments = notifications.filter(n => {
    const notifDate = new Date(n.createdAt);
    return notifDate > weekAgo;
  }).length;

  return {
    totalSchools,
    enabledSchools,
    pendingNotifications,
    recentPayments,
  };
}

/**
 * Calculate book inventory statistics
 */
export function calculateBookStats(books: Book[]) {
  const totalBooks = books.length;
  const publishedBooks = books.filter(b => b.published).length;
  const lowStockBooks = books.filter(b => b.stock <= 5).length;
  const outOfStockBooks = books.filter(b => b.stock === 0).length;
  
  const totalValue = books.reduce((sum, book) => sum + (book.price * book.stock), 0);
  
  return {
    totalBooks,
    publishedBooks,
    lowStockBooks,
    outOfStockBooks,
    totalValue,
  };
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format dates consistently across the application
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-IN');
    case 'long':
      return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'relative':
      return getRelativeTime(dateObj);
    default:
      return dateObj.toLocaleDateString('en-IN');
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString('en-IN');
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Check if user has permission for an action
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = ['user', 'school_admin', 'admin'];
  const userLevel = roleHierarchy.indexOf(userRole);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  
  return userLevel >= requiredLevel;
}

/**
 * Filter and sort data
 */
export function filterAndSort<T>(
  data: T[],
  filters: Record<string, any>,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  let filtered = data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return true;
      }
      
      const itemValue = (item as any)[key];
      
      if (typeof value === 'string') {
        return itemValue?.toString().toLowerCase().includes(value.toLowerCase());
      }
      
      return itemValue === value;
    });
  });
  
  if (sortBy) {
    filtered.sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];
      
      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
  
  return filtered;
}

/**
 * Paginate data
 */
export function paginate<T>(data: T[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: data.slice(startIndex, endIndex),
    total: data.length,
    page,
    limit,
    totalPages: Math.ceil(data.length / limit),
    hasNext: endIndex < data.length,
    hasPrev: startIndex > 0,
  };
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
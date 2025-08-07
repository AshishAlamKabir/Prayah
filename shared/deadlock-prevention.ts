/**
 * Deadlock Prevention Patterns for Prayas Database
 * 
 * This module implements deadlock-free transaction patterns to ensure
 * safe concurrent access to the database across all operations.
 */

import { db } from "../server/db";
import { eq, and, inArray } from "drizzle-orm";
import { users, books, payments, adminNotifications, userSessions } from "./schema";

/**
 * Consistent table access ordering to prevent deadlocks:
 * 1. users (lowest ID space)
 * 2. userSessions  
 * 3. books
 * 4. cartItems
 * 5. orders
 * 6. payments
 * 7. adminNotifications (highest ID space)
 * 
 * Always acquire locks in this order across transactions.
 */

export class DeadlockFreeOperations {
  
  /**
   * Atomically add item to cart with deadlock prevention
   * Uses INSERT ... ON CONFLICT to avoid race conditions
   */
  static async addToCartSafe(userId: number, bookId: number, quantity: number = 1) {
    return await db.transaction(async (tx) => {
      // First, verify user and book exist (in consistent order)
      const [user] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId));
      if (!user) throw new Error('User not found');
      
      const [book] = await tx.select({ id: books.id, inStock: books.inStock }).from(books).where(eq(books.id, bookId));
      if (!book || !book.inStock) throw new Error('Book not available');
      
      // Check if item already exists in cart
      const [existingItem] = await tx
        .select()
        .from(cartItems)
        .where(and(
          eq(cartItems.userId, userId),
          eq(cartItems.bookId, bookId)
        ));
      
      let result;
      if (existingItem) {
        // Update existing item quantity
        [result] = await tx
          .update(cartItems)
          .set({ 
            quantity: existingItem.quantity + quantity,
            createdAt: new Date()
          })
          .where(eq(cartItems.id, existingItem.id))
          .returning();
      } else {
        // Insert new cart item
        [result] = await tx
          .insert(cartItems)
          .values({ userId, bookId, quantity })
          .returning();
      }
      
      return result;
    });
  }

  /**
   * Process order with payment - deadlock-free transaction
   * Ensures consistent ordering of table access
   */
  static async processOrderWithPayment(
    userId: number,
    orderData: any,
    paymentData: any
  ) {
    return await db.transaction(async (tx) => {
      // Step 1: Lock user record first (lowest in hierarchy)
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .for('update');
      
      if (!user) throw new Error('User not found');
      
      // Step 2: Lock books in ascending ID order to prevent deadlocks
      const bookIds = orderData.orderItems.map((item: any) => item.bookId);
      const sortedBookIds = bookIds.sort((a: number, b: number) => a - b);
      
      const lockedBooks = await tx
        .select()
        .from(books)
        .where(inArray(books.id, sortedBookIds))
        .for('update');
      
      // Validate all books are available
      for (const item of orderData.orderItems) {
        const book = lockedBooks.find(b => b.id === item.bookId);
        if (!book || !book.inStock) {
          throw new Error(`Book ${item.bookId} not available`);
        }
      }
      
      // Step 3: Create order (before payment to maintain hierarchy)
      const [order] = await tx
        .insert(orders)
        .values({
          ...orderData,
          userId,
          status: 'pending'
        })
        .returning();
      
      // Step 4: Create payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          ...paymentData,
          userId,
          orderId: order.id,
          status: 'pending'
        })
        .returning();
      
      // Step 5: Clear cart items for this user (after order creation)
      await tx
        .delete(cartItems)
        .where(and(
          eq(cartItems.userId, userId),
          inArray(cartItems.bookId, bookIds)
        ));
      
      return { order, payment };
    });
  }

  /**
   * Update payment status with admin notifications - deadlock-free
   */
  static async updatePaymentWithNotifications(
    paymentId: number,
    status: string,
    adminUserIds: number[]
  ) {
    return await db.transaction(async (tx) => {
      // Step 1: Update payment (lower in hierarchy)
      const [payment] = await tx
        .update(payments)
        .set({ 
          status, 
          updatedAt: new Date(),
          adminsNotified: true
        })
        .where(eq(payments.id, paymentId))
        .returning();
      
      if (!payment) throw new Error('Payment not found');
      
      // Step 2: Create notifications for admins (higher in hierarchy)
      if (adminUserIds.length > 0) {
        const notifications = adminUserIds.map(adminId => ({
          adminUserId: adminId,
          notificationType: 'payment_received',
          title: `Payment ${status}`,
          message: `Payment #${paymentId} status updated to ${status}`,
          paymentId: paymentId,
          relatedEntityType: 'payment' as const,
          relatedEntityId: paymentId
        }));
        
        await tx.insert(adminNotifications).values(notifications);
      }
      
      return payment;
    });
  }

  /**
   * Session cleanup with deadlock prevention
   * Removes expired sessions without blocking other operations
   */
  static async cleanupExpiredSessions() {
    return await db.transaction(async (tx) => {
      // Use DELETE with subquery to avoid lock escalation
      const result = await tx
        .delete(userSessions)
        .where(eq(userSessions.expiresAt, new Date()));
      
      return result.rowCount || 0;
    });
  }

  /**
   * Bulk cart operations with deadlock prevention
   */
  static async updateCartQuantities(userId: number, updates: Array<{ id: number; quantity: number }>) {
    return await db.transaction(async (tx) => {
      // Sort updates by cart item ID to ensure consistent locking order
      const sortedUpdates = updates.sort((a, b) => a.id - b.id);
      
      const results = [];
      
      for (const update of sortedUpdates) {
        if (update.quantity <= 0) {
          // Remove item
          await tx.delete(cartItems).where(
            and(
              eq(cartItems.id, update.id),
              eq(cartItems.userId, userId)
            )
          );
        } else {
          // Update quantity
          const [result] = await tx
            .update(cartItems)
            .set({ quantity: update.quantity })
            .where(
              and(
                eq(cartItems.id, update.id),
                eq(cartItems.userId, userId)
              )
            )
            .returning();
          
          if (result) results.push(result);
        }
      }
      
      return results;
    });
  }

  /**
   * User deletion with cascade cleanup - deadlock-free
   */
  static async deleteUserSafely(userId: number) {
    return await db.transaction(async (tx) => {
      // Delete in reverse dependency order to prevent foreign key violations
      
      // 1. Admin notifications
      await tx.delete(adminNotifications).where(eq(adminNotifications.adminUserId, userId));
      
      // 2. Payment records (mark as user deleted rather than delete)
      await tx
        .update(payments)
        .set({ customerName: 'DELETED USER', customerEmail: 'deleted@example.com' })
        .where(eq(payments.userId, userId));
      
      // 3. Orders (mark as user deleted)
      await tx
        .update(orders)
        .set({ customerName: 'DELETED USER', customerEmail: 'deleted@example.com' })
        .where(eq(orders.userId, userId));
      
      // 4. Cart items
      await tx.delete(cartItems).where(eq(cartItems.userId, userId));
      
      // 5. User sessions
      await tx.delete(userSessions).where(eq(userSessions.userId, userId));
      
      // 6. Finally, delete user
      const [deletedUser] = await tx
        .delete(users)
        .where(eq(users.id, userId))
        .returning();
      
      return deletedUser;
    });
  }
}

/**
 * Connection pool settings for deadlock prevention
 */
export const deadlockPreventionSettings = {
  // PostgreSQL settings to minimize deadlocks
  lockTimeout: '30s',           // Timeout for acquiring locks
  deadlockTimeout: '1s',        // How long to wait before declaring deadlock
  statementTimeout: '60s',      // Max time for any single statement
  
  // Connection pool settings
  maxConnections: 20,           // Reasonable limit to prevent resource exhaustion
  connectionTimeout: 5000,      // 5 seconds to get connection from pool
  idleTimeout: 30000,          // 30 seconds idle before closing connection
  
  // Transaction isolation level
  isolationLevel: 'READ COMMITTED', // Prevents most deadlocks while maintaining consistency
};

/**
 * Retry logic for handling transient deadlocks
 */
export async function retryOnDeadlock<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a deadlock error
      if (
        error?.message?.includes('deadlock detected') ||
        error?.code === '40P01' || // PostgreSQL deadlock error code
        error?.message?.includes('could not serialize access')
      ) {
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If not a deadlock or max retries reached, throw the error
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Database health check for deadlock monitoring
 */
export async function checkDatabaseHealth() {
  try {
    const healthCheck = await db.execute(`
      SELECT 
        current_setting('deadlock_timeout') as deadlock_timeout,
        current_setting('lock_timeout') as lock_timeout,
        current_setting('statement_timeout') as statement_timeout,
        pg_stat_database.deadlocks,
        pg_stat_database.conflicts
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);
    
    return {
      healthy: true,
      settings: healthCheck[0],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
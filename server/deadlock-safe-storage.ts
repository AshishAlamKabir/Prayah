/**
 * Deadlock-Safe Storage Operations
 * 
 * This module provides transaction-safe storage operations that prevent
 * deadlocks through consistent table access ordering and proper locking.
 */

import { db } from "./db";
import { eq, and, inArray, desc, count, gte, lt } from "drizzle-orm";
import { DeadlockFreeOperations, retryOnDeadlock } from "../shared/deadlock-prevention";
import { 
  users, cartItems, books, payments, orders, adminNotifications, 
  userSessions, bookStock, InsertCartItem, InsertPayment, InsertOrder 
} from "../shared/schema";

export class DeadlockSafeStorage {
  
  /**
   * Safe cart operations with deadlock prevention
   */
  async addToCartSafe(userId: number, bookId: number, quantity: number = 1) {
    return retryOnDeadlock(async () => {
      return DeadlockFreeOperations.addToCartSafe(userId, bookId, quantity);
    });
  }

  async updateCartQuantitiesSafe(userId: number, updates: Array<{ id: number; quantity: number }>) {
    return retryOnDeadlock(async () => {
      return DeadlockFreeOperations.updateCartQuantities(userId, updates);
    });
  }

  async clearCartSafe(userId: number) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        const result = await tx.delete(cartItems).where(eq(cartItems.userId, userId));
        return (result.rowCount ?? 0) > 0;
      });
    });
  }

  /**
   * Safe order processing with payment integration
   */
  async createOrderWithPaymentSafe(
    userId: number,
    orderData: Omit<InsertOrder, 'userId'>,
    paymentData: Omit<InsertPayment, 'userId' | 'orderId'>
  ) {
    return retryOnDeadlock(async () => {
      return DeadlockFreeOperations.processOrderWithPayment(userId, orderData, paymentData);
    });
  }

  async updateOrderStatusSafe(orderId: number, status: string) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        const [order] = await tx
          .update(orders)
          .set({ status, updatedAt: new Date() })
          .where(eq(orders.id, orderId))
          .returning();
        return order;
      });
    });
  }

  /**
   * Safe payment operations with notifications
   */
  async updatePaymentStatusSafe(
    paymentId: number, 
    status: string, 
    adminUserIds: number[] = [],
    stripeChargeId?: string,
    failureReason?: string
  ) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        // Update payment first
        const updateData: any = { 
          status, 
          updatedAt: new Date() 
        };
        
        if (stripeChargeId) updateData.stripeChargeId = stripeChargeId;
        if (failureReason) updateData.failureReason = failureReason;
        if (adminUserIds.length > 0) updateData.adminsNotified = true;

        const [payment] = await tx
          .update(payments)
          .set(updateData)
          .where(eq(payments.id, paymentId))
          .returning();

        if (!payment) throw new Error('Payment not found');

        // Create admin notifications if needed
        if (adminUserIds.length > 0) {
          const notifications = adminUserIds.map(adminId => ({
            adminUserId: adminId,
            notificationType: 'payment_received' as const,
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
    });
  }

  /**
   * Safe user session management
   */
  async createUserSessionSafe(userId: number, token: string, expiresAt: Date) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        // Clean up old sessions for this user first
        await tx
          .delete(userSessions)
          .where(and(
            eq(userSessions.userId, userId),
            lt(userSessions.expiresAt, new Date())
          ));

        // Create new session
        const [session] = await tx
          .insert(userSessions)
          .values({ userId, token, expiresAt })
          .returning();

        return session;
      });
    });
  }

  async getUserBySessionTokenSafe(token: string) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        const [session] = await tx
          .select()
          .from(userSessions)
          .where(and(
            eq(userSessions.token, token),
            gte(userSessions.expiresAt, new Date())
          ));
        
        if (!session) return undefined;
        
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, session.userId));
        
        return user;
      });
    });
  }

  /**
   * Safe bulk operations
   */
  async bulkUpdateBookStockSafe(updates: Array<{ bookId: number; quantity: number; updatedBy: number }>) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        // Sort by bookId to ensure consistent locking order
        const sortedUpdates = updates.sort((a, b) => a.bookId - b.bookId);
        
        const results = [];
        
        for (const update of sortedUpdates) {
          // Lock the book first
          const [book] = await tx
            .select()
            .from(books)
            .where(eq(books.id, update.bookId))
            .for('update');
          
          if (!book) continue;
          
          // Update or insert stock record
          const [stockRecord] = await tx
            .select()
            .from(bookStock)
            .where(eq(bookStock.bookId, update.bookId));
          
          if (stockRecord) {
            const [updated] = await tx
              .update(bookStock)
              .set({
                quantity: update.quantity,
                lastUpdated: new Date(),
                updatedBy: update.updatedBy
              })
              .where(eq(bookStock.id, stockRecord.id))
              .returning();
            
            results.push(updated);
          } else {
            const [inserted] = await tx
              .insert(bookStock)
              .values({
                bookId: update.bookId,
                quantity: update.quantity,
                updatedBy: update.updatedBy
              })
              .returning();
            
            results.push(inserted);
          }
          
          // Update book availability
          await tx
            .update(books)
            .set({ inStock: update.quantity > 0 })
            .where(eq(books.id, update.bookId));
        }
        
        return results;
      });
    });
  }

  /**
   * Safe user deletion with proper cleanup
   */
  async deleteUserSafe(userId: number) {
    return retryOnDeadlock(async () => {
      return DeadlockFreeOperations.deleteUserSafely(userId);
    });
  }

  /**
   * Safe notification operations
   */
  async markNotificationsReadSafe(notificationIds: number[], userId: number) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        // Sort notification IDs to ensure consistent locking order
        const sortedIds = notificationIds.sort((a, b) => a - b);
        
        const result = await tx
          .update(adminNotifications)
          .set({ 
            isRead: true, 
            readAt: new Date() 
          })
          .where(and(
            inArray(adminNotifications.id, sortedIds),
            eq(adminNotifications.adminUserId, userId)
          ))
          .returning();
        
        return result;
      });
    });
  }

  async getUnreadNotificationCountSafe(adminUserId: number) {
    return retryOnDeadlock(async () => {
      const [result] = await db
        .select({ count: count() })
        .from(adminNotifications)
        .where(and(
          eq(adminNotifications.adminUserId, adminUserId),
          eq(adminNotifications.isRead, false)
        ));
      
      return Number(result?.count) || 0;
    });
  }

  /**
   * Safe cart retrieval with book details
   */
  async getCartItemsSafe(userId: number) {
    return retryOnDeadlock(async () => {
      return await db
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
        .where(eq(cartItems.userId, userId))
        .orderBy(desc(cartItems.createdAt));
    });
  }

  /**
   * Periodic cleanup operations
   */
  async cleanupExpiredSessionsSafe() {
    return retryOnDeadlock(async () => {
      return DeadlockFreeOperations.cleanupExpiredSessions();
    });
  }

  async cleanupOldNotificationsSafe(daysOld: number = 30) {
    return retryOnDeadlock(async () => {
      return await db.transaction(async (tx) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await tx
          .delete(adminNotifications)
          .where(and(
            eq(adminNotifications.isRead, true),
            lt(adminNotifications.createdAt, cutoffDate)
          ));
        
        return result.rowCount || 0;
      });
    });
  }

  /**
   * Health check and monitoring
   */
  async performHealthCheck() {
    try {
      // Test basic connectivity
      await db.select({ count: count() }).from(users).limit(1);
      
      // Check for deadlocks in the last hour
      const deadlockCheck = await db.execute(`
        SELECT COUNT(*) as deadlock_count
        FROM pg_stat_database 
        WHERE datname = current_database() 
        AND deadlocks > 0
      `);
      
      // Check connection pool status
      const poolCheck = await db.execute(`
        SELECT 
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          deadlocks
        FROM pg_stat_database 
        WHERE datname = current_database()
      `);
      
      const deadlockCount = (deadlockCheck[0] as any)?.deadlock_count || 0;
      const poolStats = poolCheck[0] as any;
      
      return {
        healthy: true,
        deadlocks: deadlockCount,
        poolStats: poolStats,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        healthy: false,
        error: error?.message || 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const deadlockSafeStorage = new DeadlockSafeStorage();
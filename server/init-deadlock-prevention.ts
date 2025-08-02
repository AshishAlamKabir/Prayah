/**
 * Initialize Deadlock Prevention System
 * 
 * This module sets up the deadlock prevention and monitoring system
 * when the server starts up.
 */

import { deadlockMonitor } from "./services/deadlock-monitor";
import { checkDatabaseHealth } from "../shared/deadlock-prevention";

export async function initializeDeadlockPrevention() {
  console.log('🛡️  Initializing deadlock prevention system...');
  
  try {
    // Check initial database health
    const healthCheck = await checkDatabaseHealth();
    console.log('📊 Initial database health check:', healthCheck);
    
    // Start monitoring with 30-second intervals
    await deadlockMonitor.startMonitoring(30000);
    console.log('👁️  Deadlock monitoring started (30-second intervals)');
    
    // Run initial test of deadlock prevention mechanisms
    const testResults = await deadlockMonitor.testDeadlockPrevention();
    if (testResults.errors.length === 0) {
      console.log('✅ Deadlock prevention test passed');
    } else {
      console.warn('⚠️  Deadlock prevention test had issues:', testResults.errors);
    }
    
    // Set up graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 Gracefully shutting down deadlock monitoring...');
      deadlockMonitor.stopMonitoring();
    });
    
    process.on('SIGINT', () => {
      console.log('🔄 Gracefully shutting down deadlock monitoring...');
      deadlockMonitor.stopMonitoring();
      process.exit(0);
    });
    
    console.log('🚀 Deadlock prevention system initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize deadlock prevention system:', error);
    throw error;
  }
}

/**
 * Periodic maintenance tasks
 */
export function scheduleMaintenanceTasks() {
  // Clean up expired sessions every hour
  setInterval(async () => {
    try {
      const { deadlockSafeStorage } = await import("./deadlock-safe-storage");
      const cleaned = await deadlockSafeStorage.cleanupExpiredSessionsSafe();
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
      }
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }, 3600000); // 1 hour
  
  // Clean up old notifications every 24 hours
  setInterval(async () => {
    try {
      const { deadlockSafeStorage } = await import("./deadlock-safe-storage");
      const cleaned = await deadlockSafeStorage.cleanupOldNotificationsSafe(30);
      if (cleaned > 0) {
        console.log(`🧹 Cleaned up ${cleaned} old notifications`);
      }
    } catch (error) {
      console.error('Error during notification cleanup:', error);
    }
  }, 86400000); // 24 hours
}
/**
 * Deadlock Monitoring Routes
 * Provides endpoints for monitoring database health and deadlock prevention
 */

import { Router } from "express";
import { deadlockMonitor } from "../services/deadlock-monitor";
import { deadlockSafeStorage } from "../deadlock-safe-storage";
import { checkDatabaseHealth } from "../../shared/deadlock-prevention";

const router = Router();

/**
 * Get current database health status
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = await deadlockSafeStorage.performHealthCheck();
    const monitorStatus = deadlockMonitor.getLatestHealthStatus();
    
    res.json({
      database: healthStatus,
      monitoring: monitorStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get detailed performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = deadlockMonitor.getCurrentMetrics();
    const report = deadlockMonitor.generatePerformanceReport();
    
    res.json({
      currentMetrics: metrics.slice(-10), // Last 10 measurements
      performanceReport: report,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Start monitoring (admin only)
 */
router.post('/start-monitoring', async (req, res) => {
  try {
    const { interval = 60000 } = req.body; // Default 1 minute
    
    await deadlockMonitor.startMonitoring(interval);
    
    res.json({
      message: 'Deadlock monitoring started',
      interval: interval,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to start monitoring',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Stop monitoring (admin only)
 */
router.post('/stop-monitoring', async (req, res) => {
  try {
    deadlockMonitor.stopMonitoring();
    
    res.json({
      message: 'Deadlock monitoring stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to stop monitoring',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test deadlock prevention mechanisms
 */
router.post('/test-prevention', async (req, res) => {
  try {
    const testResults = await deadlockMonitor.testDeadlockPrevention();
    
    res.json({
      message: 'Deadlock prevention test completed',
      results: testResults,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Manual cleanup operations
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { type = 'all' } = req.body;
    const results: any = {};
    
    if (type === 'sessions' || type === 'all') {
      results.sessionsCleared = await deadlockSafeStorage.cleanupExpiredSessionsSafe();
    }
    
    if (type === 'notifications' || type === 'all') {
      results.notificationsCleared = await deadlockSafeStorage.cleanupOldNotificationsSafe(7);
    }
    
    res.json({
      message: 'Cleanup operations completed',
      results: results,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Cleanup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get deadlock prevention statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await deadlockSafeStorage.performHealthCheck();
    const metrics = deadlockMonitor.getCurrentMetrics();
    
    // Calculate statistics from metrics
    const recentMetrics = metrics.slice(-24); // Last 24 measurements
    
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length 
      : 0;
    
    const deadlockCount = recentMetrics.length > 0 
      ? recentMetrics[recentMetrics.length - 1].totalDeadlocks - recentMetrics[0].totalDeadlocks 
      : 0;
    
    res.json({
      database: {
        healthy: stats.healthy,
        deadlocks: stats.deadlocks,
        activeConnections: stats.poolStats?.active_connections || 0,
      },
      performance: {
        averageResponseTime: Math.round(avgResponseTime),
        deadlocksInLast24h: deadlockCount,
        measurementCount: recentMetrics.length,
      },
      monitoring: {
        status: deadlockMonitor.getLatestHealthStatus(),
        uptime: metrics.length > 0 ? metrics.length : 0,
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
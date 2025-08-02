/**
 * Deadlock Monitoring and Prevention Service
 * 
 * This service monitors database health and prevents deadlocks through
 * proactive monitoring, alerting, and automatic recovery mechanisms.
 */

import { deadlockSafeStorage } from "../deadlock-safe-storage";
import { DeadlockFreeOperations } from "../../shared/deadlock-prevention";

export interface DeadlockMetrics {
  timestamp: string;
  totalDeadlocks: number;
  activeConnections: number;
  transactionCommitted: number;
  transactionRolledBack: number;
  averageResponseTime: number;
  healthScore: number;
}

export class DeadlockMonitorService {
  private metrics: DeadlockMetrics[] = [];
  private alertThreshold = 5; // Alert if more than 5 deadlocks detected
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start continuous monitoring
   */
  async startMonitoring(intervalMs: number = 60000) { // 1 minute default
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
    }, intervalMs);
    
    console.log('Deadlock monitoring started');
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Deadlock monitoring stopped');
  }
  
  /**
   * Collect current database metrics
   */
  private async collectMetrics() {
    try {
      const startTime = Date.now();
      const healthCheck = await deadlockSafeStorage.performHealthCheck();
      const responseTime = Date.now() - startTime;
      
      const metric: DeadlockMetrics = {
        timestamp: new Date().toISOString(),
        totalDeadlocks: healthCheck.deadlocks || 0,
        activeConnections: healthCheck.poolStats?.active_connections || 0,
        transactionCommitted: healthCheck.poolStats?.transactions_committed || 0,
        transactionRolledBack: healthCheck.poolStats?.transactions_rolled_back || 0,
        averageResponseTime: responseTime,
        healthScore: this.calculateHealthScore(healthCheck)
      };
      
      this.metrics.push(metric);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }
      
      // Check for alerts
      await this.checkAlerts(metric);
      
    } catch (error) {
      console.error('Error collecting deadlock metrics:', error);
    }
  }
  
  /**
   * Calculate overall health score (0-100)
   */
  private calculateHealthScore(healthCheck: any): number {
    if (!healthCheck.healthy) return 0;
    
    let score = 100;
    
    // Reduce score based on deadlocks
    if (healthCheck.deadlocks > 0) {
      score -= Math.min(healthCheck.deadlocks * 10, 50);
    }
    
    // Reduce score based on connection count
    const connectionRatio = (healthCheck.poolStats?.active_connections || 0) / 20; // Assuming max 20 connections
    if (connectionRatio > 0.8) {
      score -= 20;
    }
    
    // Reduce score based on transaction rollback ratio
    const committed = healthCheck.poolStats?.transactions_committed || 1;
    const rolledBack = healthCheck.poolStats?.transactions_rolled_back || 0;
    const rollbackRatio = rolledBack / (committed + rolledBack);
    
    if (rollbackRatio > 0.1) { // More than 10% rollbacks
      score -= 30;
    }
    
    return Math.max(score, 0);
  }
  
  /**
   * Check for alert conditions
   */
  private async checkAlerts(metric: DeadlockMetrics) {
    // Check for deadlock spike
    if (metric.totalDeadlocks > this.alertThreshold) {
      await this.triggerAlert('deadlock_spike', {
        deadlockCount: metric.totalDeadlocks,
        timestamp: metric.timestamp
      });
    }
    
    // Check for low health score
    if (metric.healthScore < 50) {
      await this.triggerAlert('low_health_score', {
        healthScore: metric.healthScore,
        timestamp: metric.timestamp
      });
    }
    
    // Check for high response time
    if (metric.averageResponseTime > 5000) { // 5 seconds
      await this.triggerAlert('high_response_time', {
        responseTime: metric.averageResponseTime,
        timestamp: metric.timestamp
      });
    }
  }
  
  /**
   * Trigger alert (implement notification logic here)
   */
  private async triggerAlert(alertType: string, data: any) {
    console.warn(`🚨 Database Alert: ${alertType}`, data);
    
    // In production, you would:
    // 1. Send email notifications
    // 2. Log to monitoring system
    // 3. Create admin notifications in database
    // 4. Trigger automatic recovery if needed
    
    try {
      // Automatic recovery for certain conditions
      if (alertType === 'deadlock_spike') {
        await this.performAutomaticRecovery();
      }
    } catch (error) {
      console.error('Error during automatic recovery:', error);
    }
  }
  
  /**
   * Perform automatic recovery operations
   */
  private async performAutomaticRecovery() {
    console.log('🔧 Performing automatic deadlock recovery...');
    
    try {
      // Clean up expired sessions that might be holding locks
      const cleanedSessions = await deadlockSafeStorage.cleanupExpiredSessionsSafe();
      console.log(`Cleaned up ${cleanedSessions} expired sessions`);
      
      // Clean up old notifications to reduce contention
      const cleanedNotifications = await deadlockSafeStorage.cleanupOldNotificationsSafe(7);
      console.log(`Cleaned up ${cleanedNotifications} old notifications`);
      
      console.log('✅ Automatic recovery completed');
    } catch (error) {
      console.error('❌ Automatic recovery failed:', error);
    }
  }
  
  /**
   * Get current metrics
   */
  getCurrentMetrics(): DeadlockMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Get latest health status
   */
  getLatestHealthStatus() {
    if (this.metrics.length === 0) {
      return { status: 'unknown', message: 'No metrics available' };
    }
    
    const latest = this.metrics[this.metrics.length - 1];
    
    if (latest.healthScore >= 80) {
      return { status: 'healthy', score: latest.healthScore };
    } else if (latest.healthScore >= 50) {
      return { status: 'warning', score: latest.healthScore };
    } else {
      return { status: 'critical', score: latest.healthScore };
    }
  }
  
  /**
   * Generate performance report
   */
  generatePerformanceReport() {
    if (this.metrics.length === 0) {
      return { error: 'No metrics available' };
    }
    
    const recentMetrics = this.metrics.slice(-10); // Last 10 measurements
    
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / recentMetrics.length;
    const totalDeadlocks = recentMetrics[recentMetrics.length - 1].totalDeadlocks - recentMetrics[0].totalDeadlocks;
    const avgHealthScore = recentMetrics.reduce((sum, m) => sum + m.healthScore, 0) / recentMetrics.length;
    
    return {
      timeRange: {
        start: recentMetrics[0].timestamp,
        end: recentMetrics[recentMetrics.length - 1].timestamp
      },
      metrics: {
        averageResponseTime: Math.round(avgResponseTime),
        deadlocksInPeriod: totalDeadlocks,
        averageHealthScore: Math.round(avgHealthScore),
        totalSamples: recentMetrics.length
      },
      status: this.getLatestHealthStatus(),
      recommendations: this.generateRecommendations(recentMetrics)
    };
  }
  
  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(metrics: DeadlockMetrics[]): string[] {
    const recommendations: string[] = [];
    const latest = metrics[metrics.length - 1];
    
    if (latest.averageResponseTime > 1000) {
      recommendations.push('Consider optimizing slow queries or increasing connection pool size');
    }
    
    if (latest.totalDeadlocks > 0) {
      recommendations.push('Review transaction patterns and implement consistent table access ordering');
    }
    
    if (latest.healthScore < 70) {
      recommendations.push('Database health is below optimal - consider maintenance during low traffic period');
    }
    
    const connectionRatio = latest.activeConnections / 20;
    if (connectionRatio > 0.8) {
      recommendations.push('High connection usage detected - consider connection pooling optimization');
    }
    
    return recommendations;
  }
  
  /**
   * Test deadlock prevention mechanisms
   */
  async testDeadlockPrevention() {
    console.log('🧪 Testing deadlock prevention mechanisms...');
    
    const testResults = {
      cartOperations: false,
      paymentProcessing: false,
      sessionManagement: false,
      bulkOperations: false,
      errors: [] as string[]
    };
    
    try {
      // Test cart operations
      const testUserId = 1;
      const testBookId = 1;
      
      await deadlockSafeStorage.addToCartSafe(testUserId, testBookId, 1);
      await deadlockSafeStorage.clearCartSafe(testUserId);
      testResults.cartOperations = true;
      
    } catch (error: any) {
      testResults.errors.push(`Cart operations: ${error.message}`);
    }
    
    try {
      // Test session management
      const testToken = `test_${Date.now()}`;
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      
      await deadlockSafeStorage.createUserSessionSafe(1, testToken, expiresAt);
      testResults.sessionManagement = true;
      
    } catch (error: any) {
      testResults.errors.push(`Session management: ${error.message}`);
    }
    
    console.log('✅ Deadlock prevention test completed:', testResults);
    return testResults;
  }
}

// Export singleton instance
export const deadlockMonitor = new DeadlockMonitorService();
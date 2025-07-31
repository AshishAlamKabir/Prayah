import Razorpay from 'razorpay';
import { storage } from '../storage';
import { emailService } from './email-service';
import type { InsertPayment, User } from '@shared/schema';

// Initialize Razorpay - will work once API keys are provided
let razorpay: Razorpay | null = null;

function initializeRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay not initialized: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET not found');
    return null;
  }
  
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface CreatePaymentParams {
  amount: number; // in paise (1 INR = 100 paise)
  currency?: string;
  paymentType: 'book_purchase' | 'subscription' | 'publication_fee' | 'school_fee' | 'culture_program';
  userId: number;
  customerEmail: string;
  customerName: string;
  description: string;
  orderId?: number;
  publicationSubmissionId?: number;
  schoolId?: number;
  cultureId?: number;
  metadata?: Record<string, any>;
}

export class RazorpayService {
  
  /**
   * Creates a Razorpay Order for processing payments
   */
  async createOrder(params: CreatePaymentParams): Promise<RazorpayOrder> {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      throw new Error('Payment service not available. Please configure Razorpay API keys.');
    }

    try {
      const receipt = `order_${Date.now()}_${params.userId}`;
      
      const orderOptions = {
        amount: params.amount, // Amount in paise
        currency: params.currency || 'INR',
        receipt,
        notes: {
          paymentType: params.paymentType,
          userId: params.userId.toString(),
          orderId: params.orderId?.toString() || '',
          publicationSubmissionId: params.publicationSubmissionId?.toString() || '',
          schoolId: params.schoolId?.toString() || '',
          cultureId: params.cultureId?.toString() || '',
          customerName: params.customerName,
          customerEmail: params.customerEmail,
          ...params.metadata,
        },
      };

      const order = await razorpayInstance.orders.create(orderOptions);

      // Store payment record in database
      const paymentData: InsertPayment = {
        stripePaymentIntentId: order.id, // Using same field for Razorpay order ID
        amount: (params.amount / 100).toString(), // Convert paise to rupees
        currency: params.currency || 'INR',
        status: 'pending',
        paymentType: params.paymentType,
        userId: params.userId,
        orderId: params.orderId,
        publicationSubmissionId: params.publicationSubmissionId,
        schoolId: params.schoolId,
        cultureId: params.cultureId,
        description: params.description,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        metadata: params.metadata || {},
      };

      await storage.createPayment(paymentData);

      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      };
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verifies Razorpay payment signature
   */
  async verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      throw new Error('Payment service not available');
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Handles successful payment completion
   */
  async handlePaymentSuccess(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<void> {
    try {
      // Verify payment signature first
      const isValidSignature = await this.verifyPaymentSignature(orderId, paymentId, signature);
      if (!isValidSignature) {
        throw new Error('Invalid payment signature');
      }

      // Update payment status
      const payment = await storage.getPaymentByStripeId(orderId); // Using same field
      if (!payment) {
        console.error('Payment not found for Order ID:', orderId);
        return;
      }

      await storage.updatePaymentStatus(payment.id, 'succeeded', paymentId);

      // Notify relevant admins
      await this.notifyAdminsOfPayment(payment.id);

      // Handle specific payment type actions
      await this.handlePaymentTypeSpecificActions(payment);

    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  /**
   * Handles payment failure
   */
  async handlePaymentFailure(orderId: string, errorReason: string): Promise<void> {
    try {
      const payment = await storage.getPaymentByStripeId(orderId);
      if (!payment) {
        console.error('Payment not found for Order ID:', orderId);
        return;
      }

      await storage.updatePaymentStatus(payment.id, 'failed', undefined, errorReason);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  /**
   * Notifies relevant role-based admins about successful payments
   */
  private async notifyAdminsOfPayment(paymentId: number): Promise<void> {
    try {
      const payment = await storage.getPaymentById(paymentId);
      if (!payment || payment.adminsNotified) {
        return;
      }

      const adminsToNotify = await this.getRelevantAdmins(payment);
      const notificationsSent: string[] = [];

      for (const admin of adminsToNotify) {
        // Create in-app notification
        await storage.createAdminNotification({
          adminUserId: admin.id,
          notificationType: 'payment_received',
          title: `New Payment Received - ${payment.paymentType.replace('_', ' ').toUpperCase()}`,
          message: this.generatePaymentNotificationMessage(payment),
          priority: this.getPaymentPriority(payment.paymentType),
          relatedEntityType: 'payment',
          relatedEntityId: payment.id,
          paymentId: payment.id,
        });

        // Send email notification
        if (admin.email) {
          await emailService.sendPaymentNotification(admin, payment);
          notificationsSent.push(admin.username);
        }
      }

      // Mark payment as notified
      await storage.markPaymentAdminsNotified(paymentId, notificationsSent);

    } catch (error) {
      console.error('Error notifying admins of payment:', error);
    }
  }

  /**
   * Gets relevant admins based on payment type and associated entities
   */
  private async getRelevantAdmins(payment: any): Promise<User[]> {
    const allAdmins: User[] = [];

    // Always notify main admin
    const mainAdmins = await storage.getUsersByRole('admin');
    allAdmins.push(...mainAdmins);

    // Notify role-specific admins based on payment type
    switch (payment.paymentType) {
      case 'school_fee':
        if (payment.schoolId) {
          const schoolAdmins = await storage.getUsersByRole('school_admin');
          const relevantSchoolAdmins = schoolAdmins.filter(admin => 
            admin.schoolPermissions && 
            Array.isArray(admin.schoolPermissions) && 
            admin.schoolPermissions.includes(payment.schoolId)
          );
          allAdmins.push(...relevantSchoolAdmins);
        }
        break;

      case 'culture_program':
        if (payment.cultureId) {
          const cultureAdmins = await storage.getUsersByRole('culture_admin');
          const relevantCultureAdmins = cultureAdmins.filter(admin => 
            admin.culturePermissions && 
            Array.isArray(admin.culturePermissions) && 
            admin.culturePermissions.includes(payment.cultureId)
          );
          allAdmins.push(...relevantCultureAdmins);
        }
        break;

      case 'publication_fee':
        // Notify publication admins (main admins handle publications)
        break;

      case 'book_purchase':
      case 'subscription':
        // Main admins handle these
        break;
    }

    // Remove duplicates
    const uniqueAdmins = allAdmins.filter((admin, index, self) => 
      index === self.findIndex(a => a.id === admin.id)
    );

    return uniqueAdmins;
  }

  /**
   * Generates notification message based on payment details
   */
  private generatePaymentNotificationMessage(payment: any): string {
    const amount = `₹${parseFloat(payment.amount).toFixed(2)}`;
    
    switch (payment.paymentType) {
      case 'book_purchase':
        return `New book purchase: ${amount} from ${payment.customerName} (${payment.customerEmail})`;
      case 'subscription':
        return `New subscription payment: ${amount} from ${payment.customerName} (${payment.customerEmail})`;
      case 'publication_fee':
        return `Publication fee received: ${amount} from ${payment.customerName} for manuscript submission`;
      case 'school_fee':
        return `School fee payment: ${amount} from ${payment.customerName} for school services`;
      case 'culture_program':
        return `Culture program payment: ${amount} from ${payment.customerName} for cultural activities`;
      default:
        return `Payment received: ${amount} from ${payment.customerName} (${payment.customerEmail})`;
    }
  }

  /**
   * Determines notification priority based on payment type
   */
  private getPaymentPriority(paymentType: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (paymentType) {
      case 'publication_fee':
        return 'high';
      case 'school_fee':
      case 'culture_program':
        return 'medium';
      case 'book_purchase':
      case 'subscription':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Handles payment-type specific actions after successful payment
   */
  private async handlePaymentTypeSpecificActions(payment: any): Promise<void> {
    switch (payment.paymentType) {
      case 'book_purchase':
        if (payment.orderId) {
          await storage.updateOrderStatus(payment.orderId, 'completed');
        }
        break;

      case 'subscription':
        // Update user subscription status
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year subscription
        await storage.updateUserSubscription(payment.userId, true, expiryDate);
        break;

      case 'publication_fee':
        if (payment.publicationSubmissionId) {
          await storage.updatePublicationSubmissionStatus(
            payment.publicationSubmissionId, 
            'published',
            'Payment received and processed'
          );
        }
        break;

      case 'school_fee':
      case 'culture_program':
        // These may require specific handling based on your requirements
        break;
    }
  }

  /**
   * Retrieves payment history for a user
   */
  async getUserPaymentHistory(userId: number): Promise<any[]> {
    return await storage.getPaymentsByUser(userId);
  }

  /**
   * Retrieves payments by type for admin dashboard
   */
  async getPaymentsByType(paymentType: string): Promise<any[]> {
    return await storage.getPaymentsByType(paymentType);
  }

  /**
   * Create refund for a payment
   */
  async createRefund(paymentId: string, amount?: number, reason?: string): Promise<any> {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      throw new Error('Payment service not available');
    }

    try {
      const refundOptions: any = {};
      
      if (amount) {
        refundOptions.amount = amount; // Amount in paise
      }
      
      if (reason) {
        refundOptions.notes = { reason };
      }

      const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw new Error('Failed to create refund');
    }
  }

  /**
   * Get payment details from Razorpay
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      throw new Error('Payment service not available');
    }

    try {
      const payment = await razorpayInstance.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw new Error('Failed to fetch payment details');
    }
  }
}

export const razorpayService = new RazorpayService();
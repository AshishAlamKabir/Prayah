import Stripe from 'stripe';
import { storage } from '../storage';
import { emailService } from './email-service';
import type { InsertPayment, User } from '@shared/schema';

// Initialize Stripe - will work once API keys are provided
let stripe: Stripe | null = null;

function initializeStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('Stripe not initialized: STRIPE_SECRET_KEY not found');
    return null;
  }
  
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CreatePaymentParams {
  amount: number; // in cents
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

export class PaymentService {
  
  /**
   * Creates a Stripe Payment Intent for processing payments
   */
  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    const stripeInstance = initializeStripe();
    if (!stripeInstance) {
      throw new Error('Payment service not available. Please configure Stripe API keys.');
    }

    try {
      const paymentIntent = await stripeInstance.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || 'usd',
        metadata: {
          paymentType: params.paymentType,
          userId: params.userId.toString(),
          orderId: params.orderId?.toString() || '',
          publicationSubmissionId: params.publicationSubmissionId?.toString() || '',
          schoolId: params.schoolId?.toString() || '',
          cultureId: params.cultureId?.toString() || '',
          ...params.metadata,
        },
        description: params.description,
        receipt_email: params.customerEmail,
      });

      // Store payment record in database
      const paymentData: InsertPayment = {
        stripePaymentIntentId: paymentIntent.id,
        amount: (params.amount / 100).toString(), // Convert cents to dollars
        currency: params.currency || 'usd',
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
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  /**
   * Handles successful payment completion
   */
  async handlePaymentSuccess(stripePaymentIntentId: string, stripeChargeId: string): Promise<void> {
    try {
      // Update payment status
      const payment = await storage.getPaymentByStripeId(stripePaymentIntentId);
      if (!payment) {
        console.error('Payment not found for Stripe ID:', stripePaymentIntentId);
        return;
      }

      await storage.updatePaymentStatus(payment.id, 'succeeded', stripeChargeId);

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
  async handlePaymentFailure(stripePaymentIntentId: string, failureReason: string): Promise<void> {
    try {
      const payment = await storage.getPaymentByStripeId(stripePaymentIntentId);
      if (!payment) {
        console.error('Payment not found for Stripe ID:', stripePaymentIntentId);
        return;
      }

      await storage.updatePaymentStatus(payment.id, 'failed', undefined, failureReason);
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
    const amount = `$${parseFloat(payment.amount).toFixed(2)}`;
    
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
}

export const paymentService = new PaymentService();
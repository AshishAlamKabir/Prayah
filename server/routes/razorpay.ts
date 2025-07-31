import type { Express } from "express";
import { razorpayService } from "../services/razorpay-service";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import crypto from "crypto";

export function registerRazorpayRoutes(app: Express): void {
  
  // Create Razorpay order for payment
  app.post("/api/razorpay/create-order", authMiddleware, async (req: any, res) => {
    try {
      const { amount, paymentType, description, orderId, publicationSubmissionId, schoolId, cultureId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount required" });
      }

      const user = req.user;
      const order = await razorpayService.createOrder({
        amount: Math.round(amount * 100), // Convert rupees to paise
        paymentType,
        userId: user.id,
        customerEmail: user.email,
        customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        description: description || `${paymentType.replace('_', ' ')} payment`,
        orderId,
        publicationSubmissionId,
        schoolId,
        cultureId,
      });

      // Return order details and Razorpay key for frontend
      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        customerEmail: user.email,
        description: description || `${paymentType.replace('_', ' ')} payment`,
      });
    } catch (error: any) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ message: error.message || "Failed to create payment order" });
    }
  });

  // Verify Razorpay payment
  app.post("/api/razorpay/verify-payment", authMiddleware, async (req: any, res) => {
    try {
      const { orderId, paymentId, signature } = req.body;
      
      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ message: "Missing required payment verification data" });
      }

      // Verify signature
      const isValidSignature = await razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
      
      if (!isValidSignature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Handle successful payment
      await razorpayService.handlePaymentSuccess(orderId, paymentId, signature);

      res.json({ 
        success: true, 
        message: "Payment verified successfully",
        paymentId,
        orderId 
      });
    } catch (error: any) {
      console.error("Error verifying Razorpay payment:", error);
      res.status(500).json({ message: error.message || "Payment verification failed" });
    }
  });

  // Razorpay webhook for payment updates
  app.post("/api/razorpay/webhook", async (req, res) => {
    try {
      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn('Razorpay webhook secret not configured');
        return res.status(200).json({ status: 'ok' });
      }

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (webhookSignature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }

      const event = req.body.event;
      const paymentEntity = req.body.payload.payment.entity;
      const orderEntity = req.body.payload.order?.entity;

      switch (event) {
        case 'payment.captured':
          await razorpayService.handlePaymentSuccess(
            paymentEntity.order_id,
            paymentEntity.id,
            '' // Signature already verified
          );
          break;

        case 'payment.failed':
          await razorpayService.handlePaymentFailure(
            paymentEntity.order_id,
            paymentEntity.error_description || 'Payment failed'
          );
          break;

        case 'order.paid':
          // Additional handling if needed
          break;

        default:
          console.log(`Unhandled Razorpay webhook event: ${event}`);
      }

      res.json({ status: 'ok' });
    } catch (error) {
      console.error('Razorpay webhook error:', error);
      res.status(400).json({ error: 'Webhook handler failed' });
    }
  });

  // Manual payment status update (for testing or manual verification)
  app.post("/api/razorpay/:orderId/update-status", authMiddleware, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const { status, paymentId, failureReason } = req.body;
      
      // Only admins can manually update payment status
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const payment = await storage.updatePaymentStatus(
        parseInt(orderId), // Assuming orderId is numeric in DB
        status, 
        paymentId, 
        failureReason
      );

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // If manually marking as succeeded, trigger admin notifications
      if (status === 'succeeded') {
        await razorpayService.handlePaymentSuccess(payment.stripePaymentIntentId!, paymentId, '');
      }

      res.json(payment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Create subscription payment
  app.post("/api/razorpay/subscribe", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Check if user already has active subscription
      if (user.isSubscribed && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()) {
        return res.status(400).json({ message: "User already has active subscription" });
      }

      const order = await razorpayService.createOrder({
        amount: 299900, // ₹2999 for annual subscription (in paise)
        paymentType: 'subscription',
        userId: user.id,
        customerEmail: user.email,
        customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        description: 'Annual Premium Subscription - Prayas',
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        customerEmail: user.email,
        description: 'Annual Premium Subscription - Prayas',
      });
    } catch (error: any) {
      console.error("Error creating subscription payment:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription payment" });
    }
  });

  // Process publication fee payment
  app.post("/api/razorpay/publication-fee", authMiddleware, async (req: any, res) => {
    try {
      const { submissionId, amount } = req.body;
      
      if (!submissionId || !amount) {
        return res.status(400).json({ message: "Submission ID and amount required" });
      }

      // Verify submission exists and belongs to user
      const submission = await storage.getPublicationSubmission(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Publication submission not found" });
      }

      if (submission.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const order = await razorpayService.createOrder({
        amount: Math.round(amount * 100), // Convert rupees to paise
        paymentType: 'publication_fee',
        userId: req.user.id,
        customerEmail: req.user.email,
        customerName: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : req.user.username,
        description: `Publication fee for "${submission.title}"`,
        publicationSubmissionId: submissionId,
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        customerName: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : req.user.username,
        customerEmail: req.user.email,
        description: `Publication fee for "${submission.title}"`,
      });
    } catch (error: any) {
      console.error("Error creating publication fee payment:", error);
      res.status(500).json({ message: error.message || "Failed to create publication fee payment" });
    }
  });

  // Get payment details
  app.get("/api/razorpay/payment/:paymentId", authMiddleware, async (req: any, res) => {
    try {
      const { paymentId } = req.params;
      
      // Only admins can fetch detailed payment info from Razorpay
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const paymentDetails = await razorpayService.getPaymentDetails(paymentId);
      res.json(paymentDetails);
    } catch (error: any) {
      console.error("Error fetching payment details:", error);
      res.status(500).json({ message: error.message || "Failed to fetch payment details" });
    }
  });

  // Create refund
  app.post("/api/razorpay/refund", authMiddleware, async (req: any, res) => {
    try {
      const { paymentId, amount, reason } = req.body;
      
      // Only admins can create refunds
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (!paymentId) {
        return res.status(400).json({ message: "Payment ID required" });
      }

      const refund = await razorpayService.createRefund(
        paymentId, 
        amount ? Math.round(amount * 100) : undefined, // Convert to paise if provided
        reason
      );

      res.json({ 
        success: true, 
        message: "Refund created successfully", 
        refund 
      });
    } catch (error: any) {
      console.error("Error creating refund:", error);
      res.status(500).json({ message: error.message || "Failed to create refund" });
    }
  });
}
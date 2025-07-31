import type { Express } from "express";
import { paymentService } from "../services/payment-service";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { insertPaymentSchema } from "@shared/schema";

export function registerPaymentRoutes(app: Express): void {
  
  // Create payment intent for book purchases
  app.post("/api/payments/create-intent", authMiddleware, async (req: any, res) => {
    try {
      const { amount, paymentType, description, orderId, publicationSubmissionId, schoolId, cultureId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount required" });
      }

      const user = req.user;
      const paymentIntent = await paymentService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
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

      res.json(paymentIntent);
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message || "Failed to create payment intent" });
    }
  });

  // Stripe webhook for payment status updates
  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const event = req.body;
      
      // In production, you should verify the webhook signature
      // const sig = req.headers['stripe-signature'];
      // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          await paymentService.handlePaymentSuccess(
            paymentIntent.id,
            paymentIntent.charges?.data[0]?.id
          );
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          await paymentService.handlePaymentFailure(
            failedPayment.id,
            failedPayment.last_payment_error?.message || 'Payment failed'
          );
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: 'Webhook handler failed' });
    }
  });

  // Manual payment status update (for testing or manual verification)
  app.post("/api/payments/:id/update-status", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, stripeChargeId, failureReason } = req.body;
      
      // Only admins can manually update payment status
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const payment = await storage.updatePaymentStatus(
        parseInt(id), 
        status, 
        stripeChargeId, 
        failureReason
      );

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // If manually marking as succeeded, trigger admin notifications
      if (status === 'succeeded') {
        await paymentService.handlePaymentSuccess(payment.stripePaymentIntentId!, stripeChargeId);
      }

      res.json(payment);
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Get user's payment history
  app.get("/api/payments/user", authMiddleware, async (req: any, res) => {
    try {
      const payments = await paymentService.getUserPaymentHistory(req.user.id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  });

  // Get payments by type (admin only)
  app.get("/api/payments/by-type/:type", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { type } = req.params;
      const payments = await paymentService.getPaymentsByType(type);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments by type:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get all payments (admin only)
  app.get("/api/payments/all", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get all payments from the database
      const payments = await storage.getPaymentsByType(''); // This will need to be implemented to get all payments
      res.json(payments);
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Get payment details by ID (admin or payment owner)
  app.get("/api/payments/:id", authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPaymentById(parseInt(id));

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Only admin or payment owner can view payment details
      if (req.user.role !== 'admin' && req.user.id !== payment.userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(payment);
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  // Create subscription payment intent
  app.post("/api/payments/subscribe", authMiddleware, async (req: any, res) => {
    try {
      const user = req.user;
      
      // Check if user already has active subscription
      if (user.isSubscribed && user.subscriptionExpiry && new Date(user.subscriptionExpiry) > new Date()) {
        return res.status(400).json({ message: "User already has active subscription" });
      }

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: 2999, // $29.99 for annual subscription
        paymentType: 'subscription',
        userId: user.id,
        customerEmail: user.email,
        customerName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
        description: 'Annual Premium Subscription - Prayas',
      });

      res.json(paymentIntent);
    } catch (error: any) {
      console.error("Error creating subscription payment:", error);
      res.status(500).json({ message: error.message || "Failed to create subscription payment" });
    }
  });

  // Process publication fee payment
  app.post("/api/payments/publication-fee", authMiddleware, async (req: any, res) => {
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

      const paymentIntent = await paymentService.createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        paymentType: 'publication_fee',
        userId: req.user.id,
        customerEmail: req.user.email,
        customerName: req.user.firstName && req.user.lastName ? `${req.user.firstName} ${req.user.lastName}` : req.user.username,
        description: `Publication fee for "${submission.title}"`,
        publicationSubmissionId: submissionId,
      });

      res.json(paymentIntent);
    } catch (error: any) {
      console.error("Error creating publication fee payment:", error);
      res.status(500).json({ message: error.message || "Failed to create publication fee payment" });
    }
  });
}
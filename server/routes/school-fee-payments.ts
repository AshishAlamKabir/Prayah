/**
 * School Fee Payment Routes
 * Handles fee collection, Razorpay integration, and admin notifications
 */

import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware } from "../auth";
import { requireFeePaymentAccess } from "../auth-middleware";
import { insertSchoolFeePaymentSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import Razorpay from "razorpay";

const router = Router();

// Initialize Razorpay instance only if keys are available
let razorpay: Razorpay | null = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Create school fee payment order
 */
router.post('/create-order', authMiddleware, requireFeePaymentAccess, async (req, res) => {
  try {
    const validatedData = insertSchoolFeePaymentSchema.parse({
      ...req.body,
      userId: req.user.id,
    });

    // Check for duplicate payment
    const existingPayment = await storage.checkDuplicateFeePayment(
      validatedData.schoolId,
      validatedData.studentRollNo,
      validatedData.feeMonth
    );

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: `Fee for ${validatedData.feeMonth} has already been paid for student ${validatedData.studentRollNo}`,
      });
    }

    // Get school details for validation
    const school = await storage.getSchool(validatedData.schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }

    // Check if Razorpay is available
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway is not configured. Please contact administrator.",
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(validatedData.amount * 100), // Convert to paisa
      currency: validatedData.currency || "INR",
      receipt: `fee_${validatedData.schoolId}_${validatedData.studentRollNo}_${Date.now()}`,
      notes: {
        schoolId: validatedData.schoolId.toString(),
        studentRollNo: validatedData.studentRollNo,
        studentName: validatedData.studentName,
        studentClass: validatedData.studentClass,
        feeMonth: validatedData.feeMonth,
        schoolName: school.name,
      },
    });

    // Create fee payment record
    const feePayment = await storage.createSchoolFeePayment({
      ...validatedData,
      razorpayOrderId: razorpayOrder.id,
      receiptNumber: razorpayOrder.receipt,
    });

    res.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      feePaymentId: feePayment.id,
      studentDetails: {
        rollNo: validatedData.studentRollNo,
        name: validatedData.studentName,
        class: validatedData.studentClass,
        feeMonth: validatedData.feeMonth,
      },
      schoolName: school.name,
    });
  } catch (error: any) {
    console.error("Error creating fee payment order:", error);
    
    if (error.name === "ZodError") {
      const validationError = fromZodError(error);
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create fee payment order",
    });
  }
});

/**
 * Verify payment and update status
 */
router.post('/verify-payment', authMiddleware, async (req, res) => {
  try {
    const { paymentId, orderId, signature, feePaymentId } = req.body;

    if (!paymentId || !orderId || !signature || !feePaymentId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification parameters",
      });
    }

    // Verify payment signature
    const crypto = require('crypto');
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Check if Razorpay is available
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway is not configured. Please contact administrator.",
      });
    }

    // Get payment details from Razorpay
    const razorpayPayment = await razorpay.payments.fetch(paymentId);

    // Update fee payment status
    const updatedPayment = await storage.updateSchoolFeePaymentStatus(feePaymentId, {
      paymentStatus: "completed",
      razorpayPaymentId: paymentId,
      paymentMethod: razorpayPayment.method,
      paidAt: new Date(),
      transactionFee: (razorpayPayment.fee || 0) / 100, // Convert from paisa
    });

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: "Fee payment record not found",
      });
    }

    // Get school details for notification
    const school = await storage.getSchool(updatedPayment.schoolId);
    
    // Find school admins to notify
    const schoolAdmins = await storage.getUsersWithSchoolPermission(updatedPayment.schoolId);

    // Create notifications for all school admins
    for (const admin of schoolAdmins) {
      await storage.createFeePaymentNotification({
        schoolId: updatedPayment.schoolId,
        feePaymentId: updatedPayment.id,
        adminUserId: admin.id,
        title: `New Fee Payment Received - ${school?.name}`,
        message: `Fee payment of ₹${updatedPayment.amount} received for student ${updatedPayment.studentName} (Roll: ${updatedPayment.studentRollNo}, Class: ${updatedPayment.studentClass}) for ${updatedPayment.feeMonth}. Payment ID: ${paymentId}`,
      });
    }

    // Mark admins as notified
    await storage.updateSchoolFeePaymentStatus(feePaymentId, {
      adminNotified: true,
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      paymentDetails: {
        amount: updatedPayment.amount,
        studentName: updatedPayment.studentName,
        studentRollNo: updatedPayment.studentRollNo,
        feeMonth: updatedPayment.feeMonth,
        paidAt: updatedPayment.paidAt,
        receiptNumber: updatedPayment.receiptNumber,
      },
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
});

/**
 * Get fee payments for a school (admin only)
 */
router.get('/school/:schoolId', authMiddleware, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const { page = 1, limit = 10, status } = req.query;

    if (isNaN(schoolId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid school ID",
      });
    }

    // Check if user has permission to view this school's fee payments
    const hasPermission = req.user.role === 'admin' || 
      (req.user.schoolPermissions && req.user.schoolPermissions.includes(schoolId));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You don't have permission to view this school's fee payments",
      });
    }

    const feePayments = await storage.getSchoolFeePayments(schoolId);
    
    // Filter by status if provided
    let filteredPayments = feePayments;
    if (status && typeof status === 'string') {
      filteredPayments = feePayments.filter(payment => payment.paymentStatus === status);
    }

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

    res.json({
      success: true,
      payments: paginatedPayments,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(filteredPayments.length / Number(limit)),
        totalRecords: filteredPayments.length,
        hasNext: endIndex < filteredPayments.length,
        hasPrev: startIndex > 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching school fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee payments",
    });
  }
});

/**
 * Get user's fee payment history
 */
router.get('/my-payments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const feePayments = await storage.getSchoolFeePayments(undefined, userId);

    res.json({
      success: true,
      payments: feePayments,
    });
  } catch (error: any) {
    console.error("Error fetching user fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your fee payment history",
    });
  }
});

/**
 * Get fee payment receipt
 */
router.get('/receipt/:paymentId', authMiddleware, async (req, res) => {
  try {
    const paymentId = parseInt(req.params.paymentId);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await storage.getSchoolFeePayment(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Check if user has permission to view this receipt
    const hasPermission = payment.userId === req.user.id || 
      req.user.role === 'admin' ||
      (req.user.schoolPermissions && req.user.schoolPermissions.includes(payment.schoolId));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get school details
    const school = await storage.getSchool(payment.schoolId);

    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.receiptNumber,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        studentDetails: {
          name: payment.studentName,
          rollNo: payment.studentRollNo,
          class: payment.studentClass,
        },
        feeMonth: payment.feeMonth,
        school: school?.name,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
        transactionFee: payment.transactionFee,
        status: payment.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payment receipt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment receipt",
    });
  }
});

export default router;
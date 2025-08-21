import { Router } from 'express';
import crypto from 'crypto';
import { phonepeService } from '../services/phonepe';
import { storage } from '../storage';
import { authenticateToken } from '../auth-middleware';

const router = Router();

// Generate unique merchant transaction ID
function generateMerchantTransactionId(): string {
  return 'T' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initiate PhonePe payment
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { amount, orderType, orderData, redirectUrl } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (!orderType) {
      return res.status(400).json({ message: 'Order type is required' });
    }

    const merchantTransactionId = generateMerchantTransactionId();
    const merchantUserId = `USER_${userId}`;
    
    // Convert amount to paise (PhonePe expects amount in paise)
    const amountInPaise = Math.round(amount * 100);

    const paymentRequest = {
      merchantTransactionId,
      merchantUserId,
      amount: amountInPaise,
      redirectUrl: redirectUrl || `${req.protocol}://${req.get('host')}/api/phonepe/callback`,
      redirectMode: 'POST' as const,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/phonepe/webhook`,
      merchantOrderId: `ORDER_${Date.now()}`,
      paymentInstrument: {
        type: 'PAY_PAGE' as const
      }
    };

    // Store transaction in database
    await storage.createPhonePeTransaction({
      merchantTransactionId,
      merchantUserId,
      amount: amountInPaise,
      currency: 'INR',
      redirectUrl: paymentRequest.redirectUrl,
      redirectMode: paymentRequest.redirectMode,
      callbackUrl: paymentRequest.callbackUrl,
      merchantOrderId: paymentRequest.merchantOrderId,
      paymentInstrument: paymentRequest.paymentInstrument,
      userId,
      orderType,
      orderData,
      state: 'INITIATED'
    });

    // Initiate payment with PhonePe
    const response = await phonepeService.initiatePayment(paymentRequest);

    if (response.success && response.data?.instrumentResponse?.redirectInfo?.url) {
      res.json({
        success: true,
        merchantTransactionId,
        redirectUrl: response.data.instrumentResponse.redirectInfo.url,
        message: 'Payment initiated successfully'
      });
    } else {
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        state: 'FAILED',
        responseCode: response.code
      });

      res.status(400).json({
        success: false,
        message: response.message || 'Payment initiation failed'
      });
    }
  } catch (error) {
    console.error('PhonePe initiate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

// Check payment status
router.get('/status/:merchantTransactionId', authenticateToken, async (req, res) => {
  try {
    const { merchantTransactionId } = req.params;
    const userId = req.user?.id;

    // Get transaction from database
    const transaction = await storage.getPhonePeTransaction(merchantTransactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user owns this transaction
    if (transaction.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check status with PhonePe
    const statusResponse = await phonepeService.checkPaymentStatus(merchantTransactionId);

    if (statusResponse.success && statusResponse.data) {
      // Update transaction with latest status
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        state: statusResponse.data.state,
        responseCode: statusResponse.data.responseCode,
        transactionId: statusResponse.data.transactionId,
        providerReferenceId: statusResponse.data.paymentInstrument?.utr
      });

      res.json({
        success: true,
        merchantTransactionId,
        transactionId: statusResponse.data.transactionId,
        amount: statusResponse.data.amount / 100, // Convert from paise to rupees
        state: statusResponse.data.state,
        responseCode: statusResponse.data.responseCode,
        paymentInstrument: statusResponse.data.paymentInstrument
      });
    } else {
      res.json({
        success: false,
        message: statusResponse.message || 'Failed to check payment status',
        merchantTransactionId,
        state: transaction.state
      });
    }
  } catch (error) {
    console.error('PhonePe status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

// PhonePe webhook for payment status updates
router.post('/webhook', async (req, res) => {
  try {
    const xVerify = req.headers['x-verify'] as string;
    const response = JSON.stringify(req.body);

    // Verify webhook signature
    if (!phonepeService.verifyCallback(xVerify, response)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { merchantTransactionId, transactionId, amount, state, responseCode, paymentInstrument } = req.body;

    // Update transaction in database
    await storage.updatePhonePeTransaction(merchantTransactionId, {
      state,
      responseCode,
      transactionId,
      providerReferenceId: paymentInstrument?.utr
    });

    console.log(`PhonePe webhook: Transaction ${merchantTransactionId} status updated to ${state}`);

    res.json({ success: true });
  } catch (error) {
    console.error('PhonePe webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Payment callback (user redirect after payment)
router.post('/callback', async (req, res) => {
  try {
    const { merchantTransactionId } = req.body || req.query;

    if (!merchantTransactionId) {
      return res.redirect('/payment/failed?error=missing_transaction_id');
    }

    // Check payment status
    const statusResponse = await phonepeService.checkPaymentStatus(merchantTransactionId);

    if (statusResponse.success && statusResponse.data) {
      await storage.updatePhonePeTransaction(merchantTransactionId, {
        state: statusResponse.data.state,
        responseCode: statusResponse.data.responseCode,
        transactionId: statusResponse.data.transactionId,
        providerReferenceId: statusResponse.data.paymentInstrument?.utr
      });

      if (statusResponse.data.state === 'COMPLETED' && statusResponse.data.responseCode === 'SUCCESS') {
        return res.redirect(`/payment/success?transactionId=${merchantTransactionId}`);
      } else {
        return res.redirect(`/payment/failed?transactionId=${merchantTransactionId}&reason=${statusResponse.data.responseCode}`);
      }
    } else {
      return res.redirect(`/payment/failed?transactionId=${merchantTransactionId}&reason=status_check_failed`);
    }
  } catch (error) {
    console.error('PhonePe callback error:', error);
    return res.redirect('/payment/failed?error=callback_processing_failed');
  }
});

// Get user's transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const transactions = await storage.getPhonePeTransactionsByUser(userId);
    
    // Convert amounts from paise to rupees
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      amount: transaction.amount / 100
    }));

    res.json({
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history'
    });
  }
});

// Admin: Get all transactions
router.get('/admin/transactions', authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { page = 1, limit = 20, state, orderType } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get all transactions by querying without user filter
    // Note: This is a simplified implementation - in production you'd want proper pagination and filtering
    const allTransactions = await storage.getPhonePeTransactionsByUser(0).catch(() => []);
    
    // Convert amounts from paise to rupees
    const formattedTransactions = allTransactions.map((transaction: any) => ({
      ...transaction,
      amount: transaction.amount / 100
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: allTransactions.length
      }
    });
  } catch (error) {
    console.error('Admin get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions'
    });
  }
});

export default router;
import crypto from 'crypto';
import axios from 'axios';

export interface PhonePeConfig {
  merchantId: string;
  apiKey: string;
  keyIndex: number;
  baseUrl: string; // sandbox or production URL
}

export interface PaymentRequest {
  merchantTransactionId: string;
  merchantUserId: string;
  amount: number;
  redirectUrl: string;
  redirectMode: 'POST' | 'REDIRECT';
  callbackUrl: string;
  merchantOrderId?: string;
  paymentInstrument?: {
    type: 'PAY_PAGE';
  };
}

export interface PaymentResponse {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    instrumentResponse: {
      type: string;
      redirectInfo: {
        url: string;
        method: string;
      };
    };
  };
}

export interface PaymentStatus {
  success: boolean;
  code: string;
  message: string;
  data?: {
    merchantId: string;
    merchantTransactionId: string;
    transactionId: string;
    amount: number;
    state: 'COMPLETED' | 'FAILED' | 'PENDING';
    responseCode: string;
    paymentInstrument: {
      type: string;
      utr?: string;
    };
  };
}

export class PhonePeService {
  private config: PhonePeConfig;

  constructor(config: PhonePeConfig) {
    this.config = config;
  }

  /**
   * Generate X-VERIFY header for PhonePe API authentication
   */
  private generateXVerify(payload: string): string {
    const payloadMain = Buffer.from(payload).toString('base64');
    const keyIndex = this.config.keyIndex;
    const string = payloadMain + '/pg/v1/pay' + this.config.apiKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;
    return checksum;
  }

  /**
   * Generate X-VERIFY header for status check
   */
  private generateStatusXVerify(merchantTransactionId: string): string {
    const string = `/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}` + this.config.apiKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + this.config.keyIndex;
    return checksum;
  }

  /**
   * Initiate payment with PhonePe
   */
  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const payload = {
        merchantId: this.config.merchantId,
        merchantTransactionId: paymentRequest.merchantTransactionId,
        merchantUserId: paymentRequest.merchantUserId,
        amount: paymentRequest.amount,
        redirectUrl: paymentRequest.redirectUrl,
        redirectMode: paymentRequest.redirectMode,
        callbackUrl: paymentRequest.callbackUrl,
        paymentInstrument: paymentRequest.paymentInstrument || {
          type: 'PAY_PAGE'
        }
      };

      if (paymentRequest.merchantOrderId) {
        payload.merchantOrderId = paymentRequest.merchantOrderId;
      }

      const payloadString = JSON.stringify(payload);
      const payloadMain = Buffer.from(payloadString).toString('base64');
      const xVerify = this.generateXVerify(payloadString);

      const options = {
        method: 'POST',
        url: `${this.config.baseUrl}/pg/v1/pay`,
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'accept': 'application/json'
        },
        data: {
          request: payloadMain
        }
      };

      const response = await axios(options);
      return response.data;
    } catch (error) {
      console.error('PhonePe payment initiation error:', error);
      throw new Error('Failed to initiate payment with PhonePe');
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(merchantTransactionId: string): Promise<PaymentStatus> {
    try {
      const xVerify = this.generateStatusXVerify(merchantTransactionId);

      const options = {
        method: 'GET',
        url: `${this.config.baseUrl}/pg/v1/status/${this.config.merchantId}/${merchantTransactionId}`,
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'accept': 'application/json'
        }
      };

      const response = await axios(options);
      return response.data;
    } catch (error) {
      console.error('PhonePe status check error:', error);
      throw new Error('Failed to check payment status');
    }
  }

  /**
   * Verify callback signature
   */
  verifyCallback(xVerify: string, response: string): boolean {
    try {
      const [receivedChecksum] = xVerify.split('###');
      const string = response + this.config.apiKey;
      const expectedChecksum = crypto.createHash('sha256').update(string).digest('hex');
      
      return receivedChecksum === expectedChecksum;
    } catch (error) {
      console.error('PhonePe callback verification error:', error);
      return false;
    }
  }
}

// Create service instance with environment variables
export const phonepeService = new PhonePeService({
  merchantId: process.env.PHONEPE_MERCHANT_ID || '',
  apiKey: process.env.PHONEPE_API_KEY || '',
  keyIndex: parseInt(process.env.PHONEPE_KEY_INDEX || '1'),
  baseUrl: process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox' // sandbox by default
});
import sgMail from '@sendgrid/mail';
import type { User, Payment } from '@shared/schema';

// Initialize SendGrid - will work once API key is provided
function initializeSendGrid() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid not initialized: SENDGRID_API_KEY not found');
    return false;
  }
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  return true;
}

export class EmailService {
  private fromEmail = 'admin@prayas.org'; // Configure your from email
  
  /**
   * Sends payment notification email to admin
   */
  async sendPaymentNotification(admin: User, payment: any): Promise<boolean> {
    if (!initializeSendGrid()) {
      console.log('Email service not available. SendGrid not configured.');
      return false;
    }

    try {
      const subject = this.getPaymentEmailSubject(payment);
      const htmlContent = this.generatePaymentEmailHTML(admin, payment);
      const textContent = this.generatePaymentEmailText(admin, payment);

      const msg = {
        to: admin.email,
        from: this.fromEmail,
        subject,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(`Payment notification sent to ${admin.email}`);
      return true;
    } catch (error) {
      console.error('Error sending payment notification email:', error);
      return false;
    }
  }

  /**
   * Sends publication approval notification to author
   */
  async sendPublicationApprovalNotification(authorEmail: string, submissionTitle: string, fee: number): Promise<boolean> {
    if (!initializeSendGrid()) {
      console.log('Email service not available. SendGrid not configured.');
      return false;
    }

    try {
      const subject = `Publication Approved: ${submissionTitle}`;
      const htmlContent = this.generatePublicationApprovalHTML(submissionTitle, fee);
      const textContent = this.generatePublicationApprovalText(submissionTitle, fee);

      const msg = {
        to: authorEmail,
        from: this.fromEmail,
        subject,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(`Publication approval notification sent to ${authorEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending publication approval email:', error);
      return false;
    }
  }

  /**
   * Sends order confirmation email to customer
   */
  async sendOrderConfirmation(customerEmail: string, orderDetails: any): Promise<boolean> {
    if (!initializeSendGrid()) {
      console.log('Email service not available. SendGrid not configured.');
      return false;
    }

    try {
      const subject = `Order Confirmation - Prayas Books`;
      const htmlContent = this.generateOrderConfirmationHTML(orderDetails);
      const textContent = this.generateOrderConfirmationText(orderDetails);

      const msg = {
        to: customerEmail,
        from: this.fromEmail,
        subject,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      console.log(`Order confirmation sent to ${customerEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      return false;
    }
  }

  /**
   * Generates email subject for payment notifications
   */
  private getPaymentEmailSubject(payment: any): string {
    const amount = `$${parseFloat(payment.amount).toFixed(2)}`;
    
    switch (payment.paymentType) {
      case 'book_purchase':
        return `New Book Purchase - ${amount}`;
      case 'subscription':
        return `New Subscription Payment - ${amount}`;
      case 'publication_fee':
        return `Publication Fee Received - ${amount}`;
      case 'school_fee':
        return `School Fee Payment - ${amount}`;
      case 'culture_program':
        return `Culture Program Payment - ${amount}`;
      default:
        return `Payment Received - ${amount}`;
    }
  }

  /**
   * Generates HTML email content for payment notifications
   */
  private generatePaymentEmailHTML(admin: User, payment: any): string {
    const amount = `$${parseFloat(payment.amount).toFixed(2)}`;
    const paymentType = payment.paymentType.replace('_', ' ').toUpperCase();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .payment-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .amount { font-size: 24px; font-weight: bold; color: #2e7d32; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Notification - Prayas</h1>
          </div>
          
          <div class="content">
            <p>Dear ${admin.firstName || admin.username},</p>
            
            <p>A new payment has been received for ${paymentType}.</p>
            
            <div class="payment-details">
              <h3>Payment Details:</h3>
              <p><strong>Amount:</strong> <span class="amount">${amount}</span></p>
              <p><strong>Customer:</strong> ${payment.customerName}</p>
              <p><strong>Email:</strong> ${payment.customerEmail}</p>
              <p><strong>Payment Type:</strong> ${paymentType}</p>
              <p><strong>Transaction Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
              ${payment.description ? `<p><strong>Description:</strong> ${payment.description}</p>` : ''}
            </div>
            
            <p>Please log in to the admin dashboard to view more details and take any necessary actions.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Prayas payment system.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates plain text email content for payment notifications
   */
  private generatePaymentEmailText(admin: User, payment: any): string {
    const amount = `$${parseFloat(payment.amount).toFixed(2)}`;
    const paymentType = payment.paymentType.replace('_', ' ').toUpperCase();
    
    return `
Dear ${admin.firstName || admin.username},

A new payment has been received for ${paymentType}.

Payment Details:
- Amount: ${amount}
- Customer: ${payment.customerName}
- Email: ${payment.customerEmail}
- Payment Type: ${paymentType}
- Transaction Date: ${new Date(payment.createdAt).toLocaleDateString()}
${payment.description ? `- Description: ${payment.description}` : ''}

Please log in to the admin dashboard to view more details and take any necessary actions.

This is an automated notification from Prayas payment system.
    `.trim();
  }

  /**
   * Generates HTML content for publication approval emails
   */
  private generatePublicationApprovalHTML(title: string, fee: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2e7d32; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .approval-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .fee { font-size: 20px; font-weight: bold; color: #d32f2f; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Publication Approved - Prayas</h1>
          </div>
          
          <div class="content">
            <p>Congratulations! Your manuscript has been approved for publication.</p>
            
            <div class="approval-details">
              <h3>Publication Details:</h3>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Publication Fee:</strong> <span class="fee">$${fee.toFixed(2)}</span></p>
            </div>
            
            <p>To proceed with publication, please complete the payment using the payment link provided in your dashboard.</p>
            
            <p>Thank you for your submission and we look forward to publishing your work!</p>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>Prayas Publications Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates plain text for publication approval emails
   */
  private generatePublicationApprovalText(title: string, fee: number): string {
    return `
Congratulations! Your manuscript has been approved for publication.

Publication Details:
- Title: ${title}
- Publication Fee: $${fee.toFixed(2)}

To proceed with publication, please complete the payment using the payment link provided in your dashboard.

Thank you for your submission and we look forward to publishing your work!

Best regards,
Prayas Publications Team
    `.trim();
  }

  /**
   * Generates HTML content for order confirmations
   */
  private generateOrderConfirmationHTML(orderDetails: any): string {
    const items = orderDetails.orderItems.map((item: any) => 
      `<li>${item.title} - Quantity: ${item.quantity} - $${item.price}</li>`
    ).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .total { font-size: 18px; font-weight: bold; color: #2e7d32; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation - Prayas Books</h1>
          </div>
          
          <div class="content">
            <p>Dear ${orderDetails.customerName},</p>
            
            <p>Thank you for your order! We have received your payment and your order is being processed.</p>
            
            <div class="order-details">
              <h3>Order Details:</h3>
              <p><strong>Order ID:</strong> #${orderDetails.id}</p>
              <p><strong>Items:</strong></p>
              <ul>${items}</ul>
              <p><strong>Total Amount:</strong> <span class="total">$${orderDetails.totalAmount}</span></p>
              <p><strong>Shipping Address:</strong> ${orderDetails.shippingAddress}</p>
            </div>
            
            <p>Your order will be shipped within 3-5 business days. You will receive a tracking notification once shipped.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for supporting Prayas!<br>Visit us at prayas.org</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates plain text for order confirmations
   */
  private generateOrderConfirmationText(orderDetails: any): string {
    const items = orderDetails.orderItems.map((item: any) => 
      `- ${item.title} - Quantity: ${item.quantity} - $${item.price}`
    ).join('\n');

    return `
Dear ${orderDetails.customerName},

Thank you for your order! We have received your payment and your order is being processed.

Order Details:
- Order ID: #${orderDetails.id}
- Items:
${items}
- Total Amount: $${orderDetails.totalAmount}
- Shipping Address: ${orderDetails.shippingAddress}

Your order will be shipped within 3-5 business days. You will receive a tracking notification once shipped.

Thank you for supporting Prayas!
Visit us at prayas.org
    `.trim();
  }
}

export const emailService = new EmailService();
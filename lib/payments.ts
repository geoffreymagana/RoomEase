import { Payment, PaymentMethod, PaymentStatus, Bill } from '@/types';
import { createDocument, updateDocument } from './firebase';

// M-Pesa API configuration
const MPESA_CONFIG = {
  CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  BUSINESS_SHORT_CODE: process.env.MPESA_BUSINESS_SHORT_CODE,
  PASSKEY: process.env.MPESA_PASSKEY,
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke',
  CALLBACK_URL: process.env.NEXT_PUBLIC_APP_URL + '/api/payments/mpesa/callback',
  TIMEOUT_URL: process.env.NEXT_PUBLIC_APP_URL + '/api/payments/mpesa/timeout'
};

// Payment method configurations
export const PAYMENT_METHODS = {
  mpesa: {
    name: 'M-Pesa',
    icon: '📱',
    currency: 'KES',
    minAmount: 1,
    maxAmount: 300000,
    description: 'Pay with M-Pesa mobile money'
  },
  bank_transfer: {
    name: 'Bank Transfer',
    icon: '🏦',
    currency: 'KES',
    minAmount: 100,
    maxAmount: 1000000,
    description: 'Direct bank transfer'
  },
  cash: {
    name: 'Cash',
    icon: '💵',
    currency: 'KES',
    minAmount: 1,
    maxAmount: 50000,
    description: 'Cash payment'
  },
  card: {
    name: 'Card',
    icon: '💳',
    currency: 'USD',
    minAmount: 1,
    maxAmount: 10000,
    description: 'Credit/Debit card via Stripe'
  },
  paypal: {
    name: 'PayPal',
    icon: '🅿️',
    currency: 'USD',
    minAmount: 1,
    maxAmount: 10000,
    description: 'PayPal payment'
  }
};

/**
 * Get M-Pesa access token
 */
const getMpesaToken = async (): Promise<string | null> => {
  try {
    const auth = Buffer.from(
      `${MPESA_CONFIG.CONSUMER_KEY}:${MPESA_CONFIG.CONSUMER_SECRET}`
    ).toString('base64');

    const response = await fetch(
      `${MPESA_CONFIG.BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Failed to get M-Pesa token:', error);
    return null;
  }
};

/**
 * Format phone number for M-Pesa (254XXXXXXXXX)
 */
const formatMpesaPhone = (phone: string): string => {
  // Remove any non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  } else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return cleaned;
};

/**
 * Generate M-Pesa timestamp
 */
const getMpesaTimestamp = (): string => {
  const now = new Date();
  return now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
};

/**
 * Generate M-Pesa password
 */
const getMpesaPassword = (timestamp: string): string => {
  const data = MPESA_CONFIG.BUSINESS_SHORT_CODE + MPESA_CONFIG.PASSKEY + timestamp;
  return Buffer.from(data).toString('base64');
};

/**
 * Initiate M-Pesa STK Push payment
 */
export const initiateMpesaPayment = async (
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<{
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  error?: string;
}> => {
  try {
    const token = await getMpesaToken();
    if (!token) {
      return { success: false, error: 'Failed to get M-Pesa access token' };
    }

    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(timestamp);
    const formattedPhone = formatMpesaPhone(phoneNumber);

    const stkPushPayload = {
      BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: MPESA_CONFIG.BUSINESS_SHORT_CODE,
      PhoneNumber: formattedPhone,
      CallBackURL: MPESA_CONFIG.CALLBACK_URL,
      AccountReference: accountReference,
      TransactionDesc: transactionDesc
    };

    const response = await fetch(
      `${MPESA_CONFIG.BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPushPayload)
      }
    );

    const data = await response.json();

    if (data.ResponseCode === '0') {
      return {
        success: true,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID
      };
    } else {
      return {
        success: false,
        error: data.ResponseDescription || 'M-Pesa payment initiation failed'
      };
    }
  } catch (error: any) {
    console.error('M-Pesa payment error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Query M-Pesa transaction status
 */
export const queryMpesaTransaction = async (
  checkoutRequestId: string
): Promise<{
  success: boolean;
  resultCode?: string;
  resultDesc?: string;
  error?: string;
}> => {
  try {
    const token = await getMpesaToken();
    if (!token) {
      return { success: false, error: 'Failed to get M-Pesa access token' };
    }

    const timestamp = getMpesaTimestamp();
    const password = getMpesaPassword(timestamp);

    const queryPayload = {
      BusinessShortCode: MPESA_CONFIG.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await fetch(
      `${MPESA_CONFIG.BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryPayload)
      }
    );

    const data = await response.json();
    
    return {
      success: true,
      resultCode: data.ResultCode,
      resultDesc: data.ResultDesc
    };
  } catch (error: any) {
    console.error('M-Pesa query error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process payment for a bill
 */
export const processPayment = async (
  billId: string,
  userId: string,
  amount: number,
  method: PaymentMethod,
  paymentData: {
    phoneNumber?: string;
    cardToken?: string;
    bankDetails?: any;
    transactionId?: string;
  }
): Promise<{
  success: boolean;
  paymentId?: string;
  checkoutRequestId?: string;
  error?: string;
}> => {
  try {
    // Create payment record
    const payment: Omit<Payment, 'id'> = {
      billId,
      userId,
      amount,
      method,
      status: 'pending',
      createdAt: new Date()
    };

    const paymentResult = await createDocument('payments', payment);
    if (paymentResult.error) {
      return { success: false, error: paymentResult.error };
    }

    const paymentId = paymentResult.id!;

    // Process payment based on method
    switch (method) {
      case 'mpesa':
        if (!paymentData.phoneNumber) {
          return { success: false, error: 'Phone number required for M-Pesa' };
        }

        const mpesaResult = await initiateMpesaPayment(
          paymentData.phoneNumber,
          amount,
          billId,
          `Bill payment - ${billId}`
        );

        if (mpesaResult.success) {
          // Update payment with M-Pesa details
          await updateDocument('payments', paymentId, {
            transactionId: mpesaResult.checkoutRequestId,
            status: 'pending'
          });

          return {
            success: true,
            paymentId,
            checkoutRequestId: mpesaResult.checkoutRequestId
          };
        } else {
          // Update payment as failed
          await updateDocument('payments', paymentId, {
            status: 'failed'
          });
          return { success: false, error: mpesaResult.error };
        }

      case 'cash':
        // For cash payments, mark as completed immediately
        // but require confirmation from other roommates
        await updateDocument('payments', paymentId, {
          status: 'completed',
          confirmedAt: new Date(),
          transactionId: `CASH_${Date.now()}`
        });

        return { success: true, paymentId };

      case 'bank_transfer':
        // For bank transfers, require manual confirmation
        await updateDocument('payments', paymentId, {
          transactionId: paymentData.transactionId || `BANK_${Date.now()}`
        });

        return { success: true, paymentId };

      case 'card':
        // Integrate with Stripe for card payments
        return await processStripePayment(paymentId, amount, paymentData.cardToken);

      case 'paypal':
        // Integrate with PayPal
        return await processPayPalPayment(paymentId, amount);

      default:
        return { success: false, error: 'Unsupported payment method' };
    }
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process Stripe payment (placeholder)
 */
const processStripePayment = async (
  paymentId: string,
  amount: number,
  cardToken?: string
): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> => {
  // TODO: Implement Stripe integration
  // This is a placeholder for Stripe payment processing
  try {
    // Simulate Stripe API call
    console.log('Processing Stripe payment:', { paymentId, amount, cardToken });
    
    // Update payment status
    await updateDocument('payments', paymentId, {
      status: 'completed',
      confirmedAt: new Date(),
      transactionId: `stripe_${Date.now()}`
    });

    return { success: true, paymentId };
  } catch (error: any) {
    await updateDocument('payments', paymentId, {
      status: 'failed'
    });
    return { success: false, error: error.message };
  }
};

/**
 * Process PayPal payment (placeholder)
 */
const processPayPalPayment = async (
  paymentId: string,
  amount: number
): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> => {
  // TODO: Implement PayPal integration
  // This is a placeholder for PayPal payment processing
  try {
    console.log('Processing PayPal payment:', { paymentId, amount });
    
    // Update payment status
    await updateDocument('payments', paymentId, {
      status: 'completed',
      confirmedAt: new Date(),
      transactionId: `paypal_${Date.now()}`
    });

    return { success: true, paymentId };
  } catch (error: any) {
    await updateDocument('payments', paymentId, {
      status: 'failed'
    });
    return { success: false, error: error.message };
  }
};

/**
 * Confirm payment (for manual verification)
 */
export const confirmPayment = async (
  paymentId: string,
  confirmedBy: string,
  transactionId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: any = {
      status: 'completed' as PaymentStatus,
      confirmedAt: new Date()
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    const result = await updateDocument('payments', paymentId, updateData);
    return { success: !result.error, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Cancel payment
 */
export const cancelPayment = async (
  paymentId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await updateDocument('payments', paymentId, {
      status: 'cancelled' as PaymentStatus,
      cancelReason: reason
    });
    return { success: !result.error, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculate bill splits
 */
export const calculateBillSplits = (
  totalAmount: number,
  splitMethod: 'equal' | 'custom',
  members: { userId: string; percentage?: number }[]
): { userId: string; amount: number; percentage: number }[] => {
  if (splitMethod === 'equal') {
    const equalPercentage = 100 / members.length;
    const equalAmount = totalAmount / members.length;
    
    return members.map(member => ({
      userId: member.userId,
      amount: Math.round(equalAmount * 100) / 100,
      percentage: Math.round(equalPercentage * 100) / 100
    }));
  } else {
    // Custom split
    return members.map(member => ({
      userId: member.userId,
      amount: Math.round((totalAmount * (member.percentage || 0) / 100) * 100) / 100,
      percentage: member.percentage || 0
    }));
  }
};

/**
 * Get payment method info
 */
export const getPaymentMethodInfo = (method: PaymentMethod) => {
  return PAYMENT_METHODS[method] || null;
};

/**
 * Validate payment amount for method
 */
export const validatePaymentAmount = (
  method: PaymentMethod,
  amount: number
): { valid: boolean; error?: string } => {
  const methodInfo = getPaymentMethodInfo(method);
  
  if (!methodInfo) {
    return { valid: false, error: 'Invalid payment method' };
  }
  
  if (amount < methodInfo.minAmount) {
    return { 
      valid: false, 
      error: `Minimum amount for ${methodInfo.name} is ${methodInfo.currency} ${methodInfo.minAmount}` 
    };
  }
  
  if (amount > methodInfo.maxAmount) {
    return { 
      valid: false, 
      error: `Maximum amount for ${methodInfo.name} is ${methodInfo.currency} ${methodInfo.maxAmount}` 
    };
  }
  
  return { valid: true };
};

/**
 * Format currency amount
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'KES'
): string => {
  const formatter = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};
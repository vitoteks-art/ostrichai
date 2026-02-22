import { apiClient } from '../lib/api';

// Types for payment system
export interface PaymentData {
  amount: number; // Amount in kobo (NGN cents)
  currency: 'NGN' | 'USD' | 'EUR' | 'GBP' | 'KES' | 'GHS' | 'ZAR';
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  callback_url?: string;
  redirect_url?: string;
}

export interface PaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
    reference?: string;
    access_code?: string;
  };
}

export interface VerificationResponse {
  status: string;
  message: string;
  data: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    customer: {
      email: string;
      name: string;
      phone?: string;
    };
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'mobile' | 'bank' | 'qr';
  supported: boolean;
}

export abstract class PaymentProvider {
  abstract name: 'flutterwave' | 'paystack' | 'polar';
  abstract initializePayment(data: PaymentData, token?: string): Promise<PaymentResponse>;
  abstract verifyPayment(reference: string, token?: string): Promise<VerificationResponse>;
  abstract getSupportedCurrencies(): string[];
  abstract getSupportedMethods(): PaymentMethod[];
}

// Flutterwave Payment Provider
export class FlutterwaveService extends PaymentProvider {
  name = 'flutterwave' as const;

  async initializePayment(data: PaymentData, token?: string): Promise<PaymentResponse> {
    try {
      const result = await apiClient.request('/payments/initiate', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: JSON.stringify({
          amount_cents: data.amount,
          currency: data.currency,
          provider: 'flutterwave',
          email: data.customer.email,
          name: data.customer.name,
          metadata: {
            ...data.metadata,
            redirect_url: data.redirect_url
          }
        })
      });

      return result;
    } catch (error) {
      console.error('Flutterwave init error:', error);
      throw error;
    }
  }

  async verifyPayment(reference: string, token?: string): Promise<VerificationResponse> {
    try {
      const result = await apiClient.request(`/payments/verify/${reference}?provider=flutterwave`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      return result;
    } catch (error) {
      console.error('Flutterwave verify error:', error);
      throw error;
    }
  }

  getSupportedCurrencies(): string[] {
    return ['NGN', 'USD', 'EUR', 'GBP', 'KES', 'GHS', 'ZAR'];
  }

  getSupportedMethods(): PaymentMethod[] {
    return [
      { id: 'card', name: 'Credit/Debit Card', type: 'card', supported: true },
      { id: 'mobilemoney', name: 'Mobile Money', type: 'mobile', supported: true },
      { id: 'ussd', name: 'USSD', type: 'bank', supported: true },
      { id: 'banktransfer', name: 'Bank Transfer', type: 'bank', supported: true },
      { id: 'qr', name: 'QR Code', type: 'qr', supported: true }
    ];
  }
}

// Paystack Payment Provider
export class PaystackService extends PaymentProvider {
  name = 'paystack' as const;

  async initializePayment(data: PaymentData, token?: string): Promise<PaymentResponse> {
    try {
      const result = await apiClient.request('/payments/initiate', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: JSON.stringify({
          amount_cents: data.amount,
          currency: data.currency,
          provider: 'paystack',
          email: data.customer.email,
          name: data.customer.name,
          metadata: {
            ...data.metadata,
            redirect_url: data.redirect_url
          }
        })
      });

      return result;
    } catch (error) {
      console.error('Paystack init error:', error);
      throw error;
    }
  }

  async verifyPayment(reference: string, token?: string): Promise<VerificationResponse> {
    try {
      const result = await apiClient.request(`/payments/verify/${reference}?provider=paystack`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      return result;
    } catch (error) {
      console.error('Paystack verify error:', error);
      throw error;
    }
  }

  getSupportedCurrencies(): string[] {
    return ['NGN', 'USD', 'EUR', 'GBP'];
  }

  getSupportedMethods(): PaymentMethod[] {
    return [
      { id: 'card', name: 'Credit/Debit Card', type: 'card', supported: true },
      { id: 'bank', name: 'Bank Transfer', type: 'bank', supported: true },
      { id: 'ussd', name: 'USSD', type: 'bank', supported: true },
      { id: 'qr', name: 'QR Code', type: 'qr', supported: true },
      { id: 'mobile_money', name: 'Mobile Money', type: 'mobile', supported: true }
    ];
  }
}

// Polar Payment Provider
export class PolarService extends PaymentProvider {
  name = 'polar' as const;

  async initializePayment(data: PaymentData, token?: string): Promise<PaymentResponse> {
    try {
      console.log('Initializing Polar payment with data:', data);

      const priceId = data.metadata?.polarPriceId;

      if (!priceId) {
        console.warn('No Polar Price ID provided in metadata.');
      }

      const result = await apiClient.request('/payments/initiate', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: JSON.stringify({
          amount_cents: data.amount,
          currency: data.currency,
          provider: 'polar',
          email: data.customer.email,
          name: data.customer.name,
          metadata: {
            ...data.metadata,
            priceId: priceId,
            redirectUrl: data.redirect_url || `${window.location.origin}/payment/callback`
          }
        })
      });

      return {
        status: 'success',
        message: 'Polar payment initialized',
        data: {
          link: result.payment_url || result.link || '',
          reference: result.reference || result.id,
          access_code: result.id
        }
      };

    } catch (error: any) {
      console.error('Polar payment initialization error:', error);
      throw new Error(`Polar payment initialization failed: ${error.message}`);
    }
  }

  async verifyPayment(reference: string, token?: string): Promise<VerificationResponse> {
    try {
      console.log(`Verifying Polar payment with reference: ${reference}`);

      const result = await apiClient.request(`/payments/verify/${reference}?provider=polar`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!result) {
        throw new Error('No result from verification');
      }

      return {
        status: result.status === 'successful' ? 'success' : result.status,
        message: `Payment ${result.status}`,
        data: result.data
      };

    } catch (error: any) {
      console.error('Polar payment verification error:', error);
      throw new Error(`Polar payment verification failed: ${error.message}`);
    }
  }

  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'];
  }

  getSupportedMethods(): PaymentMethod[] {
    return [
      { id: 'card', name: 'Credit/Debit Card', type: 'card', supported: true },
      { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank', supported: true },
      { id: 'wallet', name: 'Digital Wallet', type: 'mobile', supported: true },
      { id: 'qr', name: 'QR Code', type: 'qr', supported: true }
    ];
  }
}

// Payment Service Factory
export class PaymentService {
  private static flutterwave: FlutterwaveService;
  private static paystack: PaystackService;
  private static polar: PolarService;

  static getProvider(provider: 'flutterwave' | 'paystack' | 'polar'): PaymentProvider {
    switch (provider) {
      case 'flutterwave':
        if (!this.flutterwave) {
          this.flutterwave = new FlutterwaveService();
        }
        return this.flutterwave;
      case 'paystack':
        if (!this.paystack) {
          this.paystack = new PaystackService();
        }
        return this.paystack;
      case 'polar':
        if (!this.polar) {
          this.polar = new PolarService();
        }
        return this.polar;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  static async initializePayment(
    provider: 'flutterwave' | 'paystack' | 'polar',
    data: PaymentData,
    token?: string
  ): Promise<PaymentResponse> {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.initializePayment(data, token);
  }

  static async verifyPayment(
    provider: 'flutterwave' | 'paystack' | 'polar',
    reference: string,
    token?: string
  ): Promise<VerificationResponse> {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.verifyPayment(reference, token);
  }

  static getSupportedMethods(provider: 'flutterwave' | 'paystack' | 'polar'): PaymentMethod[] {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.getSupportedMethods();
  }

  static getSupportedCurrencies(provider: 'flutterwave' | 'paystack' | 'polar'): string[] {
    const paymentProvider = this.getProvider(provider);
    return paymentProvider.getSupportedCurrencies();
  }
}

// Nigerian Banks and Mobile Money Providers
export const NIGERIAN_BANKS = [
  { code: 'access', name: 'Access Bank', ussd: '*901#' },
  { code: 'gtbank', name: 'GTBank', ussd: '*737#' },
  { code: 'firstbank', name: 'First Bank', ussd: '*894#' },
  { code: 'uba', name: 'UBA', ussd: '*919#' },
  { code: 'zenith', name: 'Zenith Bank', ussd: '*966#' },
  { code: 'fcmb', name: 'FCMB', ussd: '*329#' },
  { code: 'sterling', name: 'Sterling Bank', ussd: '*822#' },
  { code: 'union', name: 'Union Bank', ussd: '*826#' },
  { code: 'fidelity', name: 'Fidelity Bank', ussd: '*770#' },
  { code: 'wema', name: 'Wema Bank', ussd: '*945#' }
];

export const MOBILE_MONEY_PROVIDERS = [
  { code: 'mtn', name: 'MTN Mobile Money', ussd: '*170#' },
  { code: 'airtel', name: 'Airtel Money', ussd: '*185#' },
  { code: 'glo', name: 'Glo Mobile Money', ussd: '*805#' },
  { code: '9mobile', name: '9Mobile Money', ussd: '*223#' }
];

// Currency conversion utilities with real-time Naira conversion
export const CURRENCY_RATES = {
  NGN: { symbol: '₦', rate: 1, name: 'Nigerian Naira' },
  USD: { symbol: '$', rate: 1600, name: 'US Dollar' }, // 1 USD = 1600 NGN (example rate)
  EUR: { symbol: '€', rate: 1750, name: 'Euro' },
  GBP: { symbol: '£', rate: 2000, name: 'British Pound' },
  KES: { symbol: 'KSh', rate: 12, name: 'Kenyan Shilling' },
  GHS: { symbol: '₵', rate: 110, name: 'Ghanaian Cedi' },
  ZAR: { symbol: 'R', rate: 85, name: 'South African Rand' }
};

// Nigerian user detection (currently defaults to international)
// TODO: Enhance with IP geolocation or user preference selection
export const detectNigerianUser = (): boolean => {
  // For now, default to international (USD) display
  // Nigerian users can be detected at payment time through explicit selection
  return false;
};

// Get user's preferred currency
export const getUserCurrency = (): 'USD' | 'NGN' => {
  return detectNigerianUser() ? 'NGN' : 'USD';
};

// Convert USD cents to Naira kobo for Nigerian users
export const convertUSDtoNaira = (usdCents: number): number => {
  const usdAmount = usdCents / 100; // Convert cents to dollars
  const ngnAmount = usdAmount * CURRENCY_RATES.USD.rate; // Convert to Naira
  return Math.round(ngnAmount * 100); // Convert to kobo and round
};

// Convert amount based on user location
export const convertCurrency = (amount: number, from: string, to: string): number => {
  const fromRate = CURRENCY_RATES[from as keyof typeof CURRENCY_RATES]?.rate || 1;
  const toRate = CURRENCY_RATES[to as keyof typeof CURRENCY_RATES]?.rate || 1;
  return (amount * fromRate) / toRate;
};

// Get display amount for user (USD for international, Naira for Nigerian)
export const getDisplayAmount = (usdCents: number): { amount: number; currency: string; symbol: string } => {
  const isNigerian = detectNigerianUser();

  if (isNigerian) {
    const ngnKobo = convertUSDtoNaira(usdCents);
    return {
      amount: ngnKobo / 100, // Convert kobo to Naira
      currency: 'NGN',
      symbol: '₦'
    };
  } else {
    return {
      amount: usdCents / 100, // Convert cents to dollars
      currency: 'USD',
      symbol: '$'
    };
  }
};

// Get payment amount (USD cents for international, Naira kobo for Nigerian)
export const getPaymentAmount = (usdCents: number): { amount: number; currency: string } => {
  const isNigerian = detectNigerianUser();

  if (isNigerian) {
    return {
      amount: convertUSDtoNaira(usdCents),
      currency: 'NGN'
    };
  } else {
    return {
      amount: usdCents,
      currency: 'USD'
    };
  }
};

// Subscription activation utilities
export interface PaymentVerificationResult {
  success: boolean;
  verified: boolean;
  transaction?: {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paid_at: string;
    customer: {
      email: string;
      name: string;
      phone?: string;
    };
  };
  error?: string;
}

export class PaymentVerificationService {
  static async verifyAndActivateSubscription(
    provider: 'flutterwave' | 'paystack' | 'polar',
    reference: string,
    planId: string,
    userId: string,
    setPendingOnFailure: boolean = false,
    token?: string
  ): Promise<{ success: boolean; subscription?: any; error?: string }> {
    try {
      // First verify the payment
      const verificationResult = await this.verifyPayment(provider, reference, token);

      if (!verificationResult.success || !verificationResult.verified) {
        // If payment verification fails and we should set pending approval
        if (setPendingOnFailure) {
          console.log('Payment verification failed, setting subscription to pending approval');

          // Import subscription service dynamically to avoid circular dependencies
          const { SubscriptionService } = await import('./subscriptionService');

          // Create subscription in pending approval state
          const subscriptionResult = await SubscriptionService.createSubscription(
            userId,
            planId,
            provider,
            {
              subscription_id: `pending-${reference}`,
              customer_id: `pending-${userId}`,
              customer_name: 'Pending Approval',
              customer_phone: '',
              reference: reference,
              pending_reason: verificationResult.error || 'Payment verification failed'
            }
          );

          if (subscriptionResult.success && subscriptionResult.data) {
            // Set the subscription to pending approval status
            await SubscriptionService.setSubscriptionPendingApproval(
              subscriptionResult.data.id,
              verificationResult.error || 'Payment verification failed - requires admin approval'
            );

            return {
              success: true,
              subscription: { ...subscriptionResult.data, status: 'pending_approval' }
            };
          }
        }

        return {
          success: false,
          error: verificationResult.error || 'Payment verification failed'
        };
      }

      if (!verificationResult.transaction) {
        return {
          success: false,
          error: 'No transaction data found'
        };
      }

      // Import subscription service dynamically to avoid circular dependencies
      const { SubscriptionService } = await import('./subscriptionService');

      // Create/activate the subscription
      const subscriptionResult = await SubscriptionService.createSubscription(
        userId,
        planId,
        provider,
        {
          subscription_id: verificationResult.transaction.id,
          customer_id: verificationResult.transaction.customer.email,
          customer_name: verificationResult.transaction.customer.name,
          customer_phone: verificationResult.transaction.customer.phone,
          amount_paid: verificationResult.transaction.amount,
          currency: verificationResult.transaction.currency,
          payment_date: verificationResult.transaction.paid_at,
          reference: reference
        }
      );

      if (subscriptionResult.success) {
        return {
          success: true,
          subscription: subscriptionResult.data
        };
      } else {
        return {
          success: false,
          error: subscriptionResult.error || 'Failed to create subscription'
        };
      }
    } catch (error) {
      console.error('Error in verifyAndActivateSubscription:', error);
      return {
        success: false,
        error: 'An error occurred during subscription activation'
      };
    }
  }

  static async verifyPayment(
    provider: 'flutterwave' | 'paystack' | 'polar',
    reference: string,
    token?: string
  ): Promise<PaymentVerificationResult> {
    try {
      console.log(`Verifying payment for ${provider} with reference: ${reference}`);

      const verificationResponse = await PaymentService.verifyPayment(provider, reference, token);
      console.log('Verification response:', verificationResponse);

      if (verificationResponse.status === 'success' && verificationResponse.data) {
        const data = verificationResponse.data;
        console.log('Transaction data:', data);

        // Check if payment was successful
        if (data.status === 'successful' || data.status === 'completed') {
          return {
            success: true,
            verified: true,
            transaction: {
              id: data.id,
              reference: data.reference,
              amount: data.amount,
              currency: data.currency,
              status: data.status,
              paid_at: data.paid_at,
              customer: data.customer
            }
          };
        } else {
          return {
            success: true,
            verified: false,
            error: `Payment status: ${data.status}`
          };
        }
      } else {
        console.error('Invalid verification response:', verificationResponse);
        return {
          success: false,
          verified: false,
          error: 'Invalid verification response'
        };
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        verified: false,
        error: `Payment verification failed: ${error.message}`
      };
    }
  }
}

// Webhook verification utilities
export const verifyFlutterwaveWebhook = async (payload: any, signature: string): Promise<boolean> => {
  try {
    const secret = import.meta.env.FLUTTERWAVE_SECRET_HASH;
    if (!secret) return false;

    // Use Web Crypto API for HMAC-SHA256
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(JSON.stringify(payload));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying Flutterwave webhook:', error);
    return false;
  }
};

export const verifyPaystackWebhook = async (payload: any, signature: string): Promise<boolean> => {
  try {
    const secret = import.meta.env.PAYSTACK_SECRET_KEY;
    if (!secret) return false;

    // Use Web Crypto API for HMAC-SHA512
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(JSON.stringify(payload));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying Paystack webhook:', error);
    return false;
  }
};

export const verifyPolarWebhook = async (payload: any, signature: string): Promise<boolean> => {
  try {
    const secret = import.meta.env.VITE_POLAR_WEBHOOK_SECRET;
    if (!secret) return false;

    // Use Web Crypto API for HMAC-SHA256 (Polar uses SHA256 for webhooks)
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(JSON.stringify(payload));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying Polar webhook:', error);
    return false;
  }
};

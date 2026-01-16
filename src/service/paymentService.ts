import { supabase } from "@/integrations/supabase/client";

// Types for M-Pesa API
export interface MpesaPaymentRequest {
  amount: number;
  currency: string;
  description: string;
  reference: string;
  customer_name: string;
  metadata?: any;
}

export interface MpesaPaymentResponse {
  success: boolean;
  checkoutRequestID?: string;
  merchantRequestID?: string;
  customerMessage?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_id?: string;
  mpesaReceiptNumber?: string;
  amount?: number;
  phone?: string;
  error?: string;
}

class PaymentService {
  private static instance: PaymentService;
  // Use environment variable for production, fallback to relative path for local dev
  // In production (TrueHost), VITE_API_URL will be: https://sellhubshop-backend.onrender.com/api
  // In local dev, it will use the Vite proxy: /api -> http://localhost:3000/api
  private backendUrl = import.meta.env.VITE_API_URL || '/api';

  private constructor() {
    console.log('[PaymentService] Initialized with backend URL:', this.backendUrl);
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const url = `${this.backendUrl}${endpoint}`;
    console.log(`[PaymentService] Making request to: ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`[PaymentService] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PaymentService] Error response body: ${errorText}`);
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        errorJson = { error: 'Unknown error', details: errorText };
      }
      throw new Error(errorJson.error || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  async initiateMpesaPayment(phoneNumber: string, request: MpesaPaymentRequest): Promise<MpesaPaymentResponse> {
    try {
      console.log('🚀 Initiating M-Pesa payment:', { phoneNumber, ...request });

      // Ensure phone number starts with 254
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const result = await this.makeRequest('/v1/stk-push', {
        method: 'POST',
        body: JSON.stringify({
          phone: formattedPhone,
          amount: request.amount,
          reference: request.reference,
          description: request.description,
          metadata: request.metadata
        }),
      });

      return {
        success: true,
        checkoutRequestID: result.CheckoutRequestID,
        merchantRequestID: result.MerchantRequestID,
        customerMessage: result.CustomerMessage
      };
    } catch (error) {
      console.error('❌ M-Pesa initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown payment error'
      };
    }
  }

  async checkPaymentStatus(checkoutRequestID: string): Promise<PaymentStatusResponse> {
    try {
      console.log('🔍 Checking M-Pesa payment status:', checkoutRequestID);

      if (!checkoutRequestID) {
        return { status: 'failed', error: 'Invalid checkout request ID' };
      }

      const result = await this.makeRequest('/v1/query', {
        method: 'POST',
        body: JSON.stringify({ checkoutRequestID }),
      });

      console.log('📊 M-Pesa payment status result:', result);

      const resultCode = String(result.ResultCode || result.resultCode);

      if (resultCode === '0') {
        return {
          status: 'completed',
          mpesaReceiptNumber: result.MpesaReceiptNumber,
          transaction_id: checkoutRequestID
        };
      } else if (['1032', '1037', '1', '2001'].includes(resultCode)) {
        return {
          status: 'failed',
          error: result.ResultDesc || 'Payment failed or was cancelled'
        };
      }

      return { status: 'pending' };
    } catch (error) {
      console.error('❌ Status check error:', error);
      return { status: 'failed', error: error instanceof Error ? error.message : 'Status check failed' };
    }
  }
}

export const paymentService = PaymentService.getInstance();
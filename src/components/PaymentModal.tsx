// Payment Modal Component for subscription payments

import React, { useState } from 'react';

// Flutterwave SDK type declarations
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { SubscriptionPlan, PaymentTransactionService } from '../services/subscriptionService';
import { detectNigerianUser } from '../services/paymentService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Loader2,
  X,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  plan: SubscriptionPlan;
  provider: 'flutterwave' | 'paystack' | 'polar';
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  plan,
  provider,
  onSuccess,
  onCancel,
  isOpen
}) => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'success'>('method');
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });

  const handlePayment = async () => {
    if (!user) return;
    const token = session?.access_token;

    console.log(`Starting payment process with ${provider}...`);
    setLoading(true);

    // Record payment initiation
    const txRef = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔄 Recording payment initiation for user:', user.id);
    console.log('💳 Amount:', plan.price * 100, 'cents');
    console.log('🏷️ Reference:', txRef);

    try {
      const recordResult = await PaymentTransactionService.recordTransaction(
        user.id,
        null, // No subscription yet
        {
          provider: provider,
          reference: txRef,
          amountCents: plan.price * 100,
          currency: 'USD',
          status: 'pending'
        }
      );

      if (recordResult.success) {
        console.log('✅ Payment transaction recorded successfully');
      } else {
        console.error('❌ Failed to record payment transaction:', recordResult.error);
        // Continue anyway as we want the payment to try and proceed
      }
    } catch (error) {
      console.error('❌ Exception recording payment initiation:', error);
      // Don't block the UI if tracking fails, but we should log it
    }

    try {
      if (provider === 'flutterwave') {
        // Handle Flutterwave payment
        console.log('Flutterwave SDK loaded:', !!window.FlutterwaveCheckout);
        console.log('Public key:', import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY);

        // Check if Flutterwave SDK is loaded
        if (typeof window.FlutterwaveCheckout !== 'function') {
          console.error('Flutterwave SDK not loaded');
          toast.error('Payment system not loaded. Please refresh and try again.');
          setLoading(false);
          return;
        }

        // Validate required fields
        if (!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) {
          toast.error('Payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        // Use Flutterwave JavaScript SDK for better UX
        const paymentConfig = {
          public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
          tx_ref: txRef,
          amount: plan.price,
          currency: 'USD',
          payment_options: 'card,mobilemoney,ussd,banktransfer',
          customer: {
            email: customerInfo.email,
            name: customerInfo.name,
            phone_number: customerInfo.phone
          },
          customizations: {
            title: 'Creative AI Platform',
            description: `${plan.name} Plan - $${plan.price}/month`,
            logo: window.location.hostname === 'localhost' ? '' : `${window.location.origin}/favicon.png`
          },
          callback: function (data: any) {
            console.log('Payment completed:', data);
            console.log('Payment data structure:', JSON.stringify(data, null, 2));

            // Record transaction status
            const recordTransactionStatus = async (status: 'success' | 'failed' | 'cancelled') => {
              try {
                await PaymentTransactionService.updateTransactionStatus(
                  txRef,
                  status,
                  {
                    verifiedAt: new Date().toISOString(),
                    providerResponse: data,
                    failureReason: status !== 'success' ? `Payment ${status}: ${data.status}` : undefined
                  }
                );
                console.log(`Payment transaction ${status} recorded`);
              } catch (error) {
                console.error(`Failed to record payment ${status}:`, error);
              }
            };

            if (data.status === 'successful' || data.status === 'completed') {
              // Record successful payment
              recordTransactionStatus('success');

              setStep('success');
              toast.success('Payment successful! Redirecting to confirmation page...');

              // Redirect to success page with payment details after a short delay
              setTimeout(() => {
                const params = new URLSearchParams();
                // Always use the same txRef we recorded to ensure DB update works
                params.set('reference', txRef);
                params.set('tx_ref', txRef);
                if (data.transaction_id) params.set('transaction_id', String(data.transaction_id));
                params.set('plan_id', plan.id);

                const successUrl = `/payment-success?${params.toString()}`;
                console.log('Redirecting to:', successUrl);
                window.location.href = successUrl;
              }, 2000);
            } else {
              // Record failed/cancelled payment
              recordTransactionStatus(data.status === 'cancelled' ? 'cancelled' : 'failed');

              setStep('method');
              toast.error('Payment was cancelled or failed.');
            }
            setLoading(false);
          },
          onclose: function () {
            setStep('method');
            setLoading(false);
            toast.info('Payment modal closed');
          }
        };

        try {
          window.FlutterwaveCheckout(paymentConfig);
        } catch (error) {
          console.error('Flutterwave checkout error:', error);
          toast.error('Payment system error. Please try again.');
          setLoading(false);
        }
      } else if (provider === 'polar') {
        // Handle Polar payment
        console.log('Processing Polar payment...');

        if (!import.meta.env.VITE_POLAR_SECRET_KEY) {
          toast.error('Polar payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        try {
          // Import PaymentService dynamically to avoid circular dependencies
          const { PaymentService } = await import('../services/paymentService');

          const paymentData = {
            amount: plan.price * 100, // Convert to cents
            currency: 'USD' as const,
            customer: {
              email: customerInfo.email,
              name: customerInfo.name,
              phone: customerInfo.phone
            },
            metadata: {
              planId: plan.id,
              polarPriceId: plan.polar_product_price_id || plan.id,
              priceId: plan.polar_product_price_id || plan.id,
              userId: user.id,
              txRef: txRef
            },
            redirect_url: `${window.location.origin}/payment-success?reference=${txRef}&plan_id=${plan.id}&provider=polar`
          };

          const response = await PaymentService.initializePayment('polar', paymentData, token);

          if (response.status === 'success' && response.data.link) {
            // Redirect to Polar checkout page
            window.location.href = response.data.link;
          } else {
            toast.error('Failed to initialize Polar payment. Please try again.');
            setLoading(false);
          }
        } catch (error) {
          console.error('Polar payment error:', error);
          toast.error('Polar payment initialization failed. Please try again.');
          setLoading(false);
        }
      } else if (provider === 'paystack') {
        // Handle Paystack payment (similar to Flutterwave but using Paystack SDK)
        console.log('Processing Paystack payment...');

        if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
          toast.error('Paystack payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        try {
          // Import PaymentService dynamically to avoid circular dependencies
          const { PaymentService } = await import('../services/paymentService');

          const paymentData = {
            amount: plan.price * 100, // Paystack expects kobo for NGN, but we'll handle USD conversion
            currency: 'USD' as const,
            customer: {
              email: customerInfo.email,
              name: customerInfo.name,
              phone: customerInfo.phone
            },
            metadata: {
              planId: plan.id,
              userId: user.id,
              txRef: txRef
            },
            redirect_url: `${window.location.origin}/payment-success?reference=${txRef}&plan_id=${plan.id}&provider=paystack`
          };

          const response = await PaymentService.initializePayment('paystack', paymentData, token);

          if (response.status === 'success' && response.data.link) {
            // Redirect to Paystack checkout page
            window.location.href = response.data.link;
          } else {
            toast.error('Failed to initialize Paystack payment. Please try again.');
            setLoading(false);
          }
        } catch (error) {
          console.error('Paystack payment error:', error);
          toast.error('Paystack payment initialization failed. Please try again.');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment initialization failed. Please try again.');
      setStep('method');
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-2xl h-full max-h-[90vh] flex flex-col mx-2 sm:mx-4">
        <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl">
          <CardHeader className="flex-shrink-0">
            <div>
              <CardTitle>Complete Payment</CardTitle>
              <CardDescription>
                <span className="block">{plan.name} Plan - ${plan.price}/month</span>
                <span className="text-sm text-muted-foreground mt-1 block">
                  Secure payment powered by {provider === 'flutterwave' ? 'Flutterwave' : provider === 'paystack' ? 'Paystack' : provider === 'polar' ? 'Polar' : 'Payment Provider'}
                </span>
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-6">
            {step === 'method' && (
              <>
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+234 801 234 5678"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Secure Payment</h4>
                    <div className="space-y-2 text-sm text-blue-700">
                      <p>✅ All major credit/debit cards accepted</p>
                      <p>✅ Nigerian mobile money (MTN, Airtel, Glo)</p>
                      <p>✅ Bank transfers and USSD payments</p>
                      <p>✅ QR code payments</p>
                      <p>✅ International payment methods</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={loading || !customerInfo.name || !customerInfo.email}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay with ${provider === 'flutterwave' ? 'Flutterwave' : provider === 'paystack' ? 'Paystack' : provider === 'polar' ? 'Polar' : 'Payment Provider'}`
                    )}
                  </Button>
                </div>
              </>
            )}


            {step === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
                <h3 className="font-medium mb-2">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your subscription has been activated
                </p>
                <Button onClick={() => {
                  const successUrl = `/payment-success?plan_id=${plan.id}&payment_success=true`;
                  window.location.href = successUrl;
                }}>
                  Continue to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Credit Purchase Modal Component
interface CreditPurchaseModalProps {
  isOpen: boolean;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
  provider: 'flutterwave' | 'paystack' | 'polar';
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  provider
}) => {
  const { user, session } = useAuth();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'amount' | 'success'>('amount');
  const [creditAmount, setCreditAmount] = useState<number>(100);
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });

  // Calculate cost based on overage rate
  const overageRate = subscription?.overage_rate_cents || 450; // Default $4.50
  const costPerCredit = overageRate / 100; // Cost per 100 credits
  const totalCost = (creditAmount / 100) * costPerCredit;

  const handleCreditPurchase = async () => {
    if (!user || !subscription) return;
    const token = session?.access_token;

    console.log(`Starting credit purchase process with ${provider}...`);
    setLoading(true);

    // Record payment initiation
    const txRef = `credit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔄 Recording credit purchase for user:', user.id);
    console.log('💰 Credits:', creditAmount, 'Cost:', totalCost);

    try {
      const recordResult = await PaymentTransactionService.recordTransaction(
        user.id,
        subscription.id,
        {
          provider: provider,
          reference: txRef,
          amountCents: Math.round(totalCost * 100), // Convert to cents
          currency: 'USD',
          status: 'pending'
        }
      );

      if (recordResult.success) {
        console.log('✅ Credit purchase transaction recorded successfully');
      } else {
        console.error('❌ Failed to record credit purchase transaction:', recordResult.error);
      }
    } catch (error) {
      console.error('❌ Exception recording credit purchase:', error);
    }

    try {
      if (provider === 'flutterwave') {
        // Handle Flutterwave payment for credits
        console.log('Flutterwave SDK loaded:', !!window.FlutterwaveCheckout);

        if (typeof window.FlutterwaveCheckout !== 'function') {
          console.error('Flutterwave SDK not loaded');
          toast.error('Payment system not loaded. Please refresh and try again.');
          setLoading(false);
          return;
        }

        const paymentConfig = {
          public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
          tx_ref: txRef,
          amount: totalCost,
          currency: 'USD',
          payment_options: 'card,mobilemoney,ussd,banktransfer',
          customer: {
            email: customerInfo.email,
            name: customerInfo.name,
            phone_number: customerInfo.phone
          },
          customizations: {
            title: 'Creative AI Platform',
            description: `Purchase ${creditAmount} Credits - $${totalCost.toFixed(2)}`,
            logo: window.location.hostname === 'localhost' ? '' : `${window.location.origin}/favicon.png`
          },
          callback: function (data: any) {
            console.log('Credit purchase completed:', data);

            if (data.status === 'successful' || data.status === 'completed') {
              // Record successful payment
              PaymentTransactionService.updateTransactionStatus(
                txRef,
                'success',
                {
                  verifiedAt: new Date().toISOString(),
                  providerResponse: data
                }
              );

              // Add credits to user account (FastAPI)
              const addCredits = async () => {
                try {
                  const result = await SubscriptionService.purchaseCredits({
                    creditsToPurchase: creditAmount,
                    paymentProvider: provider,
                    providerReference: txRef,
                    amountCents: Math.round(totalCost * 100),
                    currency: 'USD'
                  });

                  if (!result.success) {
                    console.error('Failed to add credits:', result.error);
                    toast.error('Credits purchase successful but failed to add credits. Please contact support.');
                  } else {
                    console.log('Credits added successfully');
                    toast.success(`${creditAmount} credits added to your account!`);
                  }
                } catch (error) {
                  console.error('Exception adding credits:', error);
                }
              };

              addCredits();

              setStep('success');
              toast.success('Credit purchase successful!');

              setTimeout(() => {
                onSuccess(txRef);
              }, 2000);
            } else {
              // Record failed payment
              PaymentTransactionService.updateTransactionStatus(
                txRef,
                data.status === 'cancelled' ? 'cancelled' : 'failed',
                {
                  providerResponse: data,
                  failureReason: `Payment ${data.status}`
                }
              );

              setStep('amount');
              toast.error('Credit purchase was cancelled or failed.');
            }
            setLoading(false);
          },
          onclose: function () {
            setStep('amount');
            setLoading(false);
            toast.info('Credit purchase modal closed');
          }
        };

        try {
          window.FlutterwaveCheckout(paymentConfig);
        } catch (error) {
          console.error('Flutterwave checkout error:', error);
          toast.error('Payment system error. Please try again.');
          setLoading(false);
        }
      } else if (provider === 'paystack') {
        // Handle Paystack payment for credits
        console.log('Processing Paystack credit purchase...');

        if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
          toast.error('Paystack payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        try {
          const { PaymentService } = await import('../services/paymentService');

          const paymentData = {
            amount: Math.round(totalCost * 100), // Convert to cents
            currency: 'USD' as const,
            customer: {
              email: customerInfo.email,
              name: customerInfo.name,
              phone: customerInfo.phone
            },
            metadata: {
              creditAmount: creditAmount,
              userId: user.id,
              txRef: txRef,
              type: 'credit_purchase'
            },
            redirect_url: `${window.location.origin}/payment-success?reference=${txRef}&type=credit_purchase&credits=${creditAmount}&provider=paystack`
          };

          const response = await PaymentService.initializePayment('paystack', paymentData, token);

          if (response.status === 'success' && response.data.link) {
            window.location.href = response.data.link;
          } else {
            toast.error('Failed to initialize Paystack payment. Please try again.');
            setLoading(false);
          }
        } catch (error) {
          console.error('Paystack payment error:', error);
          toast.error('Paystack payment initialization failed. Please try again.');
          setLoading(false);
        }
      } else if (provider === 'polar') {
        // Handle Polar payment for credits
        console.log('Processing Polar credit purchase...');

        if (!import.meta.env.VITE_POLAR_SECRET_KEY) {
          toast.error('Polar payment configuration error. Please contact support.');
          setLoading(false);
          return;
        }

        try {
          const { PaymentService } = await import('../services/paymentService');

          const paymentData = {
            amount: Math.round(totalCost * 100), // Convert to cents
            currency: 'USD' as const,
            customer: {
              email: customerInfo.email,
              name: customerInfo.name,
              phone: customerInfo.phone
            },
            metadata: {
              creditAmount: creditAmount,
              userId: user.id,
              txRef: txRef,
              type: 'credit_purchase',
              polarPriceId: `credit_${creditAmount}`,
              priceId: `credit_${creditAmount}`
            },
            redirect_url: `${window.location.origin}/payment-success?reference=${txRef}&type=credit_purchase&credits=${creditAmount}&provider=polar`
          };

          const response = await PaymentService.initializePayment('polar', paymentData, token);

          if (response.status === 'success' && response.data.link) {
            window.location.href = response.data.link;
          } else {
            toast.error('Failed to initialize Polar payment. Please try again.');
            setLoading(false);
          }
        } catch (error) {
          console.error('Polar payment error:', error);
          toast.error('Polar payment initialization failed. Please try again.');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      toast.error('Credit purchase initialization failed. Please try again.');
      setStep('amount');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-md h-auto flex flex-col mx-2 sm:mx-4">
        <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl">
          <CardHeader className="flex-shrink-0">
            <div>
              <CardTitle>Purchase Credits</CardTitle>
              <CardDescription>
                Add credits to your account
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto space-y-6">
            {step === 'amount' && (
              <>
                {/* Credit Amount Selection */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="credit-amount">Number of Credits</Label>
                    <Select value={creditAmount.toString()} onValueChange={(value) => setCreditAmount(Number(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select credit amount" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 Credits</SelectItem>
                        <SelectItem value="250">250 Credits</SelectItem>
                        <SelectItem value="500">500 Credits</SelectItem>
                        <SelectItem value="1000">1,000 Credits</SelectItem>
                        <SelectItem value="2500">2,500 Credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Cost Breakdown</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div className="flex justify-between">
                        <span>Credits:</span>
                        <span>{creditAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>${costPerCredit.toFixed(2)} per 100 credits</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-blue-300 pt-1">
                        <span>Total:</span>
                        <span>${totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-medium">Customer Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="credit-name">Full Name</Label>
                      <Input
                        id="credit-name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credit-email">Email Address</Label>
                      <Input
                        id="credit-email"
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="credit-phone">Phone Number</Label>
                      <Input
                        id="credit-phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+234 801 234 5678"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onCancel} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreditPurchase}
                    disabled={loading || !customerInfo.name || !customerInfo.email}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${totalCost.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
                <h3 className="font-medium mb-2">Credits Purchased!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {creditAmount} credits have been added to your account
                </p>
                <Button onClick={() => onSuccess('credit-purchase-success')}>
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Subscription management component
export const SubscriptionManager: React.FC = () => {
  const { subscription, plan, loading } = useSubscription();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<'flutterwave' | 'paystack' | 'polar'>('flutterwave');

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading subscription details...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your active plan and usage</CardDescription>
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{plan.name} Plan</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Badge variant={plan.price > 0 ? "default" : "secondary"}>
                  {plan.price > 0 ? `$${plan.price}/month` : 'Free'}
                </Badge>
              </div>

              {/* Usage Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {plan.limits.videosPerMonth === -1 ? '∞' : plan.limits.videosPerMonth}
                  </div>
                  <div className="text-xs text-muted-foreground">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {plan.limits.logosPerMonth === -1 ? '∞' : plan.limits.logosPerMonth}
                  </div>
                  <div className="text-xs text-muted-foreground">Logos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {plan.limits.storageLimit === -1 ? '∞' : `${plan.limits.storageLimit}MB`}
                  </div>
                  <div className="text-xs text-muted-foreground">Storage</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {plan.features.prioritySupport ? 'Yes' : 'No'}
                  </div>
                  <div className="text-xs text-muted-foreground">Priority Support</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No active subscription</p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Choose a plan that fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* This would be populated with available plans */}
            <div className="text-center py-8 text-muted-foreground">
              Plan selection coming soon...
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose your preferred payment provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-provider">Payment Provider</Label>
              <Select value={selectedProvider} onValueChange={(value: 'flutterwave' | 'paystack' | 'polar') => setSelectedProvider(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flutterwave">Flutterwave - Global payments with local support</SelectItem>
                  <SelectItem value="paystack">Paystack - Nigerian payments specialist</SelectItem>
                  <SelectItem value="polar">Polar - Modern payment gateway</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedProvider === 'flutterwave' && 'Supports cards, mobile money, bank transfers, and more worldwide.'}
              {selectedProvider === 'paystack' && 'Optimized for Nigerian payments with excellent local support.'}
              {selectedProvider === 'polar' && 'Modern payment gateway with advanced features and global reach.'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          provider={selectedProvider}
          isOpen={showPaymentModal}
          onSuccess={(reference) => {
            console.log('Payment successful:', reference);
            setShowPaymentModal(false);
            toast.success('Payment successful! Your subscription is now active.');
          }}
          onCancel={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
};

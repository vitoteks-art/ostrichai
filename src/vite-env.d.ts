/// <reference types="vite/client" />

// Flutterwave payment gateway types
declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

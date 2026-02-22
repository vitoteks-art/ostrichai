import { useState, useEffect } from 'react';

interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
};

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyInfo>(CURRENCIES.USD);

  useEffect(() => {
    // Detect user's location and set appropriate currency
    // For now, default to USD but this could be enhanced with geolocation API
    const detectCurrency = async () => {
      try {
        // You could use a geolocation service here
        // For demo purposes, we'll check localStorage or use a default
        const savedCurrency = localStorage.getItem('preferredCurrency');
        if (savedCurrency && CURRENCIES[savedCurrency as keyof typeof CURRENCIES]) {
          setCurrency(CURRENCIES[savedCurrency as keyof typeof CURRENCIES]);
        } else {
          // Default to USD for now - in production you might detect based on IP
          setCurrency(CURRENCIES.USD);
        }
      } catch (error) {
        console.error('Error detecting currency:', error);
        setCurrency(CURRENCIES.USD);
      }
    };

    detectCurrency();
  }, []);

  const formatCurrency = (amount: number): string => {
    // Format amount based on currency
    if (currency.code === 'NGN') {
      return `${currency.symbol}${amount.toLocaleString()}`;
    }

    return `${currency.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const convertAndFormat = (usdAmount: number): string => {
    // Convert USD to local currency (simplified conversion rates)
    let convertedAmount = usdAmount;

    switch (currency.code) {
      case 'NGN':
        convertedAmount = usdAmount * 1650; // Approximate USD to NGN rate
        break;
      case 'EUR':
        convertedAmount = usdAmount * 0.85; // Approximate USD to EUR rate
        break;
      case 'GBP':
        convertedAmount = usdAmount * 0.75; // Approximate USD to GBP rate
        break;
      case 'CAD':
        convertedAmount = usdAmount * 1.25; // Approximate USD to CAD rate
        break;
      case 'AUD':
        convertedAmount = usdAmount * 1.35; // Approximate USD to AUD rate
        break;
      default:
        convertedAmount = usdAmount;
    }

    return formatCurrency(convertedAmount);
  };

  return {
    currency,
    formatCurrency,
    convertAndFormat,
    setCurrency: (newCurrency: CurrencyInfo) => {
      setCurrency(newCurrency);
      localStorage.setItem('preferredCurrency', newCurrency.code);
    },
    availableCurrencies: Object.values(CURRENCIES),
  };
}

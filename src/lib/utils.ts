import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'HKD': 'HK$',
    'SGD': 'S$',
    'IDR': 'Rp',
    'MYR': 'RM',
    'THB': '฿',
    'PHP': '₱',
    'VND': '₫',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'CHF',
    'INR': '₹',
    'KRW': '₩',
    'BRL': 'R$',
    'ZAR': 'R',
  };
  
  const symbol = currencyMap[currency] || currency;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

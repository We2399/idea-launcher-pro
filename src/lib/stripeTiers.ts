// Stripe Subscription Tiers Configuration
// IMPORTANT: Replace these placeholder IDs with your actual Stripe product/price IDs
// after creating them in the Stripe Dashboard: https://dashboard.stripe.com/products

export interface StripeTier {
  name: string;
  product_id: string;
  price_id: string;
  price: number;
  maxEmployees: number;
  trialMonths?: number;
  dbTier: 'free' | 'mini' | 'sme' | 'enterprise';
}

export const STRIPE_TIERS: Record<string, StripeTier> = {
  trial: {
    name: 'Trial',
    product_id: 'prod_TRIAL_REPLACE_ME', // Replace with your Trial product ID
    price_id: 'price_TRIAL_REPLACE_ME',   // Replace with your Trial price ID
    price: 0,
    maxEmployees: 2,
    trialMonths: 6,
    dbTier: 'free',
  },
  se: {
    name: 'SE',
    product_id: 'prod_SE_REPLACE_ME',     // Replace with your SE product ID
    price_id: 'price_SE_REPLACE_ME',       // Replace with your SE price ID
    price: 28,
    maxEmployees: 9,
    dbTier: 'mini',
  },
  sme: {
    name: 'SME',
    product_id: 'prod_SME_REPLACE_ME',    // Replace with your SME product ID
    price_id: 'price_SME_REPLACE_ME',      // Replace with your SME price ID
    price: 88,
    maxEmployees: 50,
    dbTier: 'sme',
  },
  enterprise: {
    name: 'Enterprise',
    product_id: 'prod_ENT_REPLACE_ME',    // Replace with your Enterprise product ID
    price_id: 'price_ENT_REPLACE_ME',      // Replace with your Enterprise price ID
    price: 168,
    maxEmployees: 100,
    dbTier: 'enterprise',
  },
};

// Helper function to get tier by product ID
export function getTierByProductId(productId: string): StripeTier | undefined {
  return Object.values(STRIPE_TIERS).find(tier => tier.product_id === productId);
}

// Helper function to get tier by price ID
export function getTierByPriceId(priceId: string): StripeTier | undefined {
  return Object.values(STRIPE_TIERS).find(tier => tier.price_id === priceId);
}

// Helper function to get tier key by product ID
export function getTierKeyByProductId(productId: string): string | undefined {
  return Object.entries(STRIPE_TIERS).find(([_, tier]) => tier.product_id === productId)?.[0];
}

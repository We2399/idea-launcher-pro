import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe product IDs to database tiers and max employees
// IMPORTANT: Keep these in sync with src/lib/stripeTiers.ts
const PRODUCT_TO_TIER: Record<string, { dbTier: string; maxEmployees: number }> = {
  'prod_TlqN0QHdflIsjQ': { dbTier: 'free', maxEmployees: 2 },      // Trial
  'prod_TlqQydsaUCkfK7': { dbTier: 'mini', maxEmployees: 9 },      // SE
  'prod_TlqU0gOIx2mdRH': { dbTier: 'sme', maxEmployees: 50 },      // SME
  'prod_TlqVG1jRPUZ4oD': { dbTier: 'enterprise', maxEmployees: 100 }, // Enterprise
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create Supabase client with service role for database updates
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null,
        status: 'no_customer'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    // Combine results - prefer active over trialing
    const allSubs = [...subscriptions.data, ...trialingSubscriptions.data];
    const hasSubscription = allSubs.length > 0;
    
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let subscriptionStatus: string = 'none';

    if (hasSubscription) {
      const subscription = allSubs[0];
      subscriptionStatus = subscription.status;
      
      // Safely handle the date conversion
      if (subscription.current_period_end && typeof subscription.current_period_end === 'number') {
        try {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        } catch (dateError) {
          logStep("Error parsing subscription end date", { 
            current_period_end: subscription.current_period_end,
            error: String(dateError)
          });
          subscriptionEnd = null;
        }
      }
      
      // Get product ID from the subscription
      if (subscription.items.data.length > 0) {
        const priceItem = subscription.items.data[0];
        productId = typeof priceItem.price.product === 'string' 
          ? priceItem.price.product 
          : priceItem.price.product.id;
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscriptionStatus,
        productId,
        endDate: subscriptionEnd 
      });

      // Sync subscription tier to organization database
      if (productId && PRODUCT_TO_TIER[productId]) {
        const tierInfo = PRODUCT_TO_TIER[productId];
        logStep("Syncing tier to database", { productId, tierInfo });

        // Find user's organization (where they are owner)
        const { data: orgData, error: orgError } = await supabaseClient
          .from('organizations')
          .select('id, subscription_tier, max_employees')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (orgError) {
          logStep("Error fetching organization", { error: orgError.message });
        } else if (orgData) {
          // Only update if tier has changed
          if (orgData.subscription_tier !== tierInfo.dbTier || orgData.max_employees !== tierInfo.maxEmployees) {
            const { error: updateError } = await supabaseClient
              .from('organizations')
              .update({
                subscription_tier: tierInfo.dbTier,
                max_employees: tierInfo.maxEmployees,
                updated_at: new Date().toISOString()
              })
              .eq('id', orgData.id);

            if (updateError) {
              logStep("Error updating organization tier", { error: updateError.message });
            } else {
              logStep("Organization tier updated successfully", { 
                orgId: orgData.id, 
                newTier: tierInfo.dbTier,
                newMaxEmployees: tierInfo.maxEmployees
              });
            }
          } else {
            logStep("Organization tier already up to date");
          }
        } else {
          logStep("No organization found for user");
        }
      }
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasSubscription,
      product_id: productId,
      subscription_end: subscriptionEnd,
      status: subscriptionStatus
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

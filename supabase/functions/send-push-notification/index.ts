import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Get FCM access token using service account
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT for service account authentication
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  // Base64url encode
  const base64urlEncode = (obj: unknown) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerB64 = base64urlEncode(header);
  const payloadB64 = base64urlEncode(payload);
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key and sign
  const privateKeyPem = serviceAccount.private_key;
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKeyPem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send FCM V1 API notification
async function sendFcmNotification(
  accessToken: string,
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  const serviceAccount = JSON.parse(serviceAccountJson!);
  const projectId = serviceAccount.project_id;

  const message = {
    message: {
      token: deviceToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'chat_messages',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FCM send failed:', errorText);
    
    // If token is invalid, we should remove it
    if (response.status === 404 || errorText.includes('UNREGISTERED')) {
      return false;
    }
    throw new Error(`FCM send failed: ${errorText}`);
  }

  const result = await response.json();
  console.log('FCM send success:', result);
  return true;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, title, body, data } = await req.json() as PushPayload;

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to user ${userId}: ${title}`);

    // Get device tokens for the user using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('device_tokens')
      .select('id, token, platform')
      .eq('user_id', userId);

    if (tokensError) {
      console.error('Error fetching device tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch device tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No device tokens found for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'No device tokens registered', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} device token(s) for user ${userId}`);

    // Get FCM access token
    const accessToken = await getAccessToken();

    // Send notifications to all devices
    let successCount = 0;
    const invalidTokenIds: string[] = [];

    for (const deviceToken of tokens) {
      try {
        const success = await sendFcmNotification(
          accessToken,
          deviceToken.token,
          title,
          body,
          data
        );
        
        if (success) {
          successCount++;
        } else {
          invalidTokenIds.push(deviceToken.id);
        }
      } catch (err) {
        console.error(`Failed to send to token ${deviceToken.id}:`, err);
      }
    }

    // Clean up invalid tokens
    if (invalidTokenIds.length > 0) {
      console.log(`Removing ${invalidTokenIds.length} invalid token(s)`);
      await supabaseAdmin
        .from('device_tokens')
        .delete()
        .in('id', invalidTokenIds);
    }

    console.log(`Successfully sent ${successCount}/${tokens.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: tokens.length,
        invalidRemoved: invalidTokenIds.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

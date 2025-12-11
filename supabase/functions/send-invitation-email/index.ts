import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  invitationCode: string;
  inviteLink: string;
  organizationName: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, invitationCode, inviteLink, organizationName, inviterName }: InvitationEmailRequest = await req.json();

    console.log(`Sending invitation email to: ${email}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Invite link: ${inviteLink}`);

    if (!email || !invitationCode || !inviteLink || !organizationName) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, invitationCode, inviteLink, organizationName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const inviterText = inviterName ? `${inviterName} from ${organizationName}` : organizationName;

    const emailResponse = await resend.emails.send({
      from: "Jie Jie Helpers Hub <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${organizationName} on Jie Jie Helpers Hub`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation to Join</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">姐姐 Jie Jie</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Helpers Hub</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">You're Invited! 🎉</h2>
            
            <p style="color: #4b5563;">
              <strong>${inviterText}</strong> has invited you to join their team on Jie Jie Helpers Hub - a comprehensive HR management platform for helpers.
            </p>
            
            <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Your Invitation Code:</p>
              <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5; font-family: monospace;">${invitationCode}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Join Now
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #4f46e5; word-break: break-all;">${inviteLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
              This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Jie Jie Helpers Hub. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = "re_Whq5ZsaE_HFnxMzvdgmz869Py8Z6dtjtQ"
const ALLOWED_EMAIL = "lakshsah46@gmail.com"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests FIRST - before any other code
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    const requestData = await req.json()
    const { email, action, otp: providedOtp } = requestData

    // Validate email for both actions
    if (!email || email !== ALLOWED_EMAIL) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address. Only authorized admin email is allowed.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    if (action === 'send') {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

      // Store OTP in Supabase
      const { error: storageError } = await supabaseClient
        .from('admin_otp')
        .upsert({
          email: email,
          otp: otp,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        })

      if (storageError) {
        console.error('Storage error:', storageError)
        // Continue anyway - we'll send the email
      }

      // Send OTP via Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Admin Login OTP Verification',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                  }
                  .container {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 40px;
                    border-radius: 10px;
                    text-align: center;
                  }
                  .otp-box {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    margin: 20px 0;
                  }
                  .otp-code {
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    color: #667eea;
                    margin: 20px 0;
                  }
                  .message {
                    color: #666;
                    font-size: 14px;
                    margin-top: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="otp-box">
                    <h2 style="color: #333; margin-bottom: 20px;">Admin Login Verification</h2>
                    <p style="color: #666;">Your OTP code is:</p>
                    <div class="otp-code">${otp}</div>
                    <p class="message">This code will expire in 10 minutes.</p>
                    <p class="message">If you didn't request this code, please ignore this email.</p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      })

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json()
        console.error('Resend API error:', errorData)
        return new Response(
          JSON.stringify({ error: 'Failed to send OTP email' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else if (action === 'verify') {
      if (!providedOtp) {
        return new Response(
          JSON.stringify({ error: 'OTP is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Verify OTP from storage
      const { data, error } = await supabaseClient
        .from('admin_otp')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired OTP' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if OTP matches
      if (data.otp !== providedOtp) {
        return new Response(
          JSON.stringify({ error: 'Invalid OTP' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if OTP is expired
      const expiresAt = new Date(data.expires_at)
      if (new Date() > expiresAt) {
        // Delete expired OTP
        await supabaseClient
          .from('admin_otp')
          .delete()
          .eq('email', email)

        return new Response(
          JSON.stringify({ error: 'OTP has expired. Please request a new one.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // OTP is valid - delete it and return success
      await supabaseClient
        .from('admin_otp')
        .delete()
        .eq('email', email)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "verify"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})


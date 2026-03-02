import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CertificateRequest {
  sessionId: string
  userCertificates: Array<{
    id: string
    certificate_id: string
    metadata?: {
      user_name?: string
      certificate_name?: string
      cert_short_name?: string
      [key: string]: any
    }
  }>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const { sessionId, userCertificates }: CertificateRequest = await req.json()

    if (!sessionId || !userCertificates || userCertificates.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: sessionId and userCertificates' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = []

    // Process each certificate
    for (const userCert of userCertificates) {
      try {
        // Extract metadata or use defaults
        const recipientName = userCert.metadata?.user_name || 'Professional'
        const certName = userCert.metadata?.certificate_name || 'Certificate'
        const certShort = userCert.metadata?.cert_short_name || 'CERT'

        // Generate certificate via external service (Xano)
        const xanoResponse = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:R2_lRaA-/generate_certificate_image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_name: recipientName,
            certification_name: certName,
            certification_name_short: certShort,
            unique_certificate_id: userCert.certificate_id
          })
        })

        if (!xanoResponse.ok) {
          console.error(`Xano API error for ${userCert.certificate_id}:`, xanoResponse.status)
          results.push({
            certificate_id: userCert.certificate_id,
            success: false,
            error: `Xano API error: ${xanoResponse.status}`
          })
          continue
        }

        const xanoData = await xanoResponse.json()
        
        if (xanoData.result === 'success' && xanoData.data?.certificate_image_link) {
          // Update the user_certificates record with the generated URL
          const { error: updateError } = await supabase
            .from('user_certificates')
            .update({
              certificate_image_url: xanoData.data.certificate_image_link,
              status: 'generated'
            })
            .eq('certificate_id', userCert.certificate_id)

          if (updateError) {
            console.error(`Database update error for ${userCert.certificate_id}:`, updateError)
            results.push({
              certificate_id: userCert.certificate_id,
              success: false,
              error: `Database update failed: ${updateError.message}`
            })
          } else {
            results.push({
              certificate_id: userCert.certificate_id,
              success: true,
              url: xanoData.data.certificate_image_link
            })
          }
        } else {
          results.push({
            certificate_id: userCert.certificate_id,
            success: false,
            error: 'Invalid response from certificate generation service'
          })
        }

      } catch (certError) {
        console.error(`Error processing certificate ${userCert.certificate_id}:`, certError)
        results.push({
          certificate_id: userCert.certificate_id,
          success: false,
          error: `Processing error: ${certError.message}`
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        results: results,
        summary: {
          total: userCertificates.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
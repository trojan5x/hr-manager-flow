import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { session_id } = await req.json()

    if (!session_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: session_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Generating certificate images for session: ${session_id}`)

    // 1. Get user certificates for this session using the session_id column
    const { data: certificates, error: certError } = await supabaseClient
      .from('user_certificates')
      .select(`
        id,
        certificate_id,
        certificate_image_url,
        certificate_image_expires_at,
        metadata
      `)
      .eq('session_id', session_id)

    if (certError) {
      console.error('Failed to get certificates:', certError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch certificates' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!certificates?.length) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No certificates found for this session',
          certificates_processed: 0,
          certificates: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${certificates.length} certificates to process`)

    // 2. Filter certificates that need image generation
    const now = new Date()
    const certificatesToProcess = certificates.filter(cert => {
      // Generate image if:
      // - No image URL exists, OR
      // - Image has expired (expires_at is in the past)
      const hasNoImage = !cert.certificate_image_url
      const hasExpiredImage = cert.certificate_image_expires_at && 
        new Date(cert.certificate_image_expires_at) <= now
      
      return hasNoImage || hasExpiredImage
    })

    console.log(`${certificatesToProcess.length} certificates need image generation`)

    // 3. Generate images for certificates that need them
    const results = []
    
    for (const cert of certificates) {
      const needsGeneration = certificatesToProcess.includes(cert)
      
      if (!needsGeneration) {
        // Certificate already has valid image
        results.push({
          certificate_id: cert.certificate_id,
          status: 'up_to_date',
          image_url: cert.certificate_image_url,
          expires_at: cert.certificate_image_expires_at
        })
        continue
      }

      // Generate new image
      try {
        const imageUrl = await generateCertificateImage(
          cert.certificate_id,
          cert.metadata
        )

        if (imageUrl) {
          // Calculate expiry date (7 days from now)
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 7)

          // Update certificate record with new image and expiry
          const { error: updateError } = await supabaseClient
            .from('user_certificates')
            .update({
              certificate_image_url: imageUrl,
              certificate_image_expires_at: expiryDate.toISOString(),
              status: 'generated'
            })
            .eq('id', cert.id)

          if (updateError) {
            console.error('Failed to update certificate with image:', updateError)
            results.push({
              certificate_id: cert.certificate_id,
              status: 'failed',
              error: 'Failed to save image URL'
            })
          } else {
            results.push({
              certificate_id: cert.certificate_id,
              status: 'generated',
              image_url: imageUrl,
              expires_at: expiryDate.toISOString()
            })
          }
        } else {
          results.push({
            certificate_id: cert.certificate_id,
            status: 'failed',
            error: 'Image generation failed'
          })
        }
      } catch (error) {
        console.error(`Failed to generate image for ${cert.certificate_id}:`, error)
        results.push({
          certificate_id: cert.certificate_id,
          status: 'failed',
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.status === 'generated').length
    const upToDateCount = results.filter(r => r.status === 'up_to_date').length

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} certificates`,
        certificates_processed: results.length,
        certificates_generated: successCount,
        certificates_up_to_date: upToDateCount,
        certificates: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Certificate image generation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateCertificateImage(
  certificateId: string,
  metadata: any
): Promise<string | null> {
  try {
    // Extract from metadata
    const userName = metadata?.user_name || 'Valued Professional'
    const certName = metadata?.certificate_name || 'Certificate'
    const certShort = metadata?.cert_short_name || 'CERT'
    
    console.log(`Generating certificate image for ${userName} - ${certName}`)

    // Call Xano API to generate certificate image
    const xanoResponse = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:R2_lRaA-/generate_certificate_image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_name: userName,
        certification_name: certName,
        certification_name_short: certShort,
        unique_certificate_id: certificateId
      })
    })

    if (!xanoResponse.ok) {
      console.error('Xano API call failed:', xanoResponse.status, xanoResponse.statusText)
      return null
    }

    const xanoData = await xanoResponse.json()
    
    // The Xano API should return the certificate image URL
    if (xanoData.result === 'success' && xanoData.data?.certificate_image_link) {
      return xanoData.data.certificate_image_link
    }
    
    return null

  } catch (error) {
    console.error('Xano API call error:', error)
    return null
  }
}
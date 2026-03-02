import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { session_id, order_id, user_id } = await req.json()

    if (!session_id || !order_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: session_id and order_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Webhook: Processing payment for session: ${session_id}, order: ${order_id}`)

    // 1. Verify session exists and mark as paid
    const { data: session, error: sessionError } = await supabaseClient
      .from('sessions')
      .update({ paid: true, payment_verified_at: new Date().toISOString() })
      .eq('id', session_id)
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to update session:', sessionError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Session not found or could not be updated' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Get user data (use provided user_id or session's user_id)
    const targetUserId = user_id || session.user_id
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id, name, email')
      .eq('id', targetUserId)
      .single()

    if (userError) {
      console.error('Failed to get user data:', userError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User data not found' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 3. Get purchased certificates from the order
    const { data: purchasedCerts, error: purchaseError } = await supabaseClient
      .from('purchases')
      .select(`
        role_certificate_id,
        role_certificates!inner(
          id,
          name,
          short_name, 
          cert_id_prefix,
          certificate_name,
          role_id
        )
      `)
      .eq('order_id', order_id)

    if (purchaseError || !purchasedCerts?.length) {
      console.error('Failed to get purchased certificates:', purchaseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No purchased certificates found for this order' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Webhook: Found ${purchasedCerts.length} purchased certificates`)

    // 4. Create certificate records (without images) for each purchased certificate
    const certificateRecords = []
    
    for (const cert of purchasedCerts) {
      const timestamp = Date.now()
      const certificateId = `CERT-${cert.role_certificate_id}-${timestamp}`

      // Check if certificate record already exists to avoid duplicates
      const { data: existingCert } = await supabaseClient
        .from('user_certificates')
        .select('id')
        .eq('user_id', userData.id)
        .eq('role_certificate_id', cert.role_certificate_id)
        .eq('certificate_id', certificateId)
        .single()

      if (existingCert) {
        console.log(`Certificate record already exists: ${certificateId}`)
        certificateRecords.push({
          certificate_id: certificateId,
          status: 'existing'
        })
        continue
      }

      const { data: record, error: insertError } = await supabaseClient
        .from('user_certificates')
        .insert({
          user_id: userData.id,
          role_id: cert.role_certificates.role_id,
          role_certificate_id: cert.role_certificate_id,
          certificate_id: certificateId,
          status: 'pending',
          // Note: certificate_image_url is NULL (to be filled later)
          // certificate_image_expires_at is NULL (to be filled when image is generated)
          metadata: {
            order_id: order_id,
            user_name: userData.name,
            certificate_name: cert.role_certificates.certificate_name,
            cert_short_name: cert.role_certificates.short_name
          }
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create certificate record:', insertError)
        certificateRecords.push({
          certificate_id: certificateId,
          status: 'failed',
          error: insertError.message
        })
        continue
      }

      certificateRecords.push({
        certificate_id: certificateId,
        status: 'created',
        record_id: record.id
      })
    }

    console.log(`Webhook: Created ${certificateRecords.length} certificate records`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment processed and certificate records created',
        session_updated: true,
        certificates_created: certificateRecords.length,
        certificates: certificateRecords
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
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
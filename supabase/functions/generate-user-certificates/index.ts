import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

interface PurchasedCertificate {
  role_certificate_id: number;
  role_certificates: {
    id: number;
    name: string;
    short_name: string;
    cert_id_prefix: string;
    certificate_name: string;
  };
}

interface CertificateRecord {
  id: string;
  user_id: number;
  role_id: number;
  role_certificate_id: number;
  certificate_id: string;
}

interface CertificateResult {
  certificate_id: string;
  status: 'pending' | 'generated' | 'failed';
  image_url?: string;
  error?: string;
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

    const { session_id, order_id } = await req.json()

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

    console.log(`Generating certificates for session: ${session_id}, order: ${order_id}`)

    // 1. Verify session is paid
    const session = await verifySessionPaid(supabaseClient, session_id)
    if (!session) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Session not found or payment not verified' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 2. Get user data
    const userData = await getUserData(supabaseClient, session.user_id)
    if (!userData) {
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

    // 3. Get EXACT purchased certificates from purchases table
    const purchasedCerts = await getPurchasedCertificatesFromOrder(supabaseClient, order_id)
    
    if (purchasedCerts.length === 0) {
      console.log('No purchased certificates found for order:', order_id)
      return new Response(
        JSON.stringify({ 
          success: true, 
          certificates_generated: 0, 
          certificates: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Found ${purchasedCerts.length} purchased certificates`)

    // 4. Create user_certificates records ONLY for purchased certificates
    const certRecords = await createCertificateRecords(supabaseClient, userData, purchasedCerts, session.role_id)

    // 5. Generate certificate images for purchased certificates only
    const results = await generateCertificateImages(supabaseClient, certRecords, userData)

    return new Response(
      JSON.stringify({
        success: true,
        certificates_generated: results.length,
        certificates: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Certificate generation error:', error)
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

async function verifySessionPaid(supabaseClient: any, sessionId: string): Promise<any> {
  const { data: session, error } = await supabaseClient
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('paid', true)
    .single()

  if (error) {
    console.error('Session verification error:', error)
    return null
  }

  return session
}

async function getUserData(supabaseClient: any, userId: number): Promise<UserData | null> {
  const { data: user, error } = await supabaseClient
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('User data retrieval error:', error)
    return null
  }

  return user
}

async function getPurchasedCertificatesFromOrder(supabaseClient: any, orderId: string): Promise<PurchasedCertificate[]> {
  const { data: purchasedCerts, error } = await supabaseClient
    .from('purchases')
    .select(`
      role_certificate_id,
      role_certificates!inner(
        id,
        name,
        short_name, 
        cert_id_prefix,
        certificate_name
      )
    `)
    .eq('order_id', orderId)

  if (error) {
    console.error('Failed to get purchased certificates:', error)
    return []
  }

  return purchasedCerts || []
}

async function createCertificateRecords(
  supabaseClient: any, 
  userData: UserData, 
  purchasedCerts: PurchasedCertificate[],
  roleId: number
): Promise<CertificateRecord[]> {
  const records: CertificateRecord[] = []

  for (const cert of purchasedCerts) {
    const timestamp = Date.now()
    const certificateId = `CERT-${cert.role_certificate_id}-${timestamp}`

    const { data: record, error } = await supabaseClient
      .from('user_certificates')
      .insert({
        user_id: userData.id,
        role_id: roleId,
        role_certificate_id: cert.role_certificate_id,
        certificate_id: certificateId,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create certificate record:', error)
      continue
    }

    records.push(record)
  }

  return records
}

async function generateCertificateImages(
  supabaseClient: any, 
  certRecords: CertificateRecord[], 
  userData: UserData
): Promise<CertificateResult[]> {
  const results: CertificateResult[] = []

  for (const record of certRecords) {
    try {
      // Get certificate details for Xano API call
      const { data: certDetails, error: certError } = await supabaseClient
        .from('role_certificates')
        .select('name, short_name, cert_id_prefix, certificate_name')
        .eq('id', record.role_certificate_id)
        .single()

      if (certError) {
        console.error('Failed to get certificate details:', certError)
        await updateCertificateStatus(supabaseClient, record.id, 'failed')
        results.push({
          certificate_id: record.certificate_id,
          status: 'failed',
          error: 'Failed to get certificate details'
        })
        continue
      }

      // Call Xano API to generate certificate image
      const imageUrl = await callXanoCertificateAPI(userData, certDetails, record.certificate_id)

      if (imageUrl) {
        // Update record with generated image URL
        await updateCertificateStatus(supabaseClient, record.id, 'generated', imageUrl)
        results.push({
          certificate_id: record.certificate_id,
          status: 'generated',
          image_url: imageUrl
        })
      } else {
        await updateCertificateStatus(supabaseClient, record.id, 'failed')
        results.push({
          certificate_id: record.certificate_id,
          status: 'failed',
          error: 'Certificate image generation failed'
        })
      }

    } catch (error) {
      console.error('Certificate generation error for record:', record.id, error)
      await updateCertificateStatus(supabaseClient, record.id, 'failed')
      results.push({
        certificate_id: record.certificate_id,
        status: 'failed',
        error: error.message || 'Unknown error'
      })
    }
  }

  return results
}

async function updateCertificateStatus(
  supabaseClient: any, 
  recordId: string, 
  status: string, 
  imageUrl?: string
): Promise<void> {
  const updateData: any = { status }
  if (imageUrl) {
    updateData.certificate_image_url = imageUrl
  }

  const { error } = await supabaseClient
    .from('user_certificates')
    .update(updateData)
    .eq('id', recordId)

  if (error) {
    console.error('Failed to update certificate status:', error)
  }
}

async function callXanoCertificateAPI(
  userData: UserData, 
  certDetails: any, 
  certificateId: string
): Promise<string | null> {
  try {
    // This matches the existing Xano API call format from the current system
    const xanoResponse = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:z9LPgH7K/certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name || 'Valued Professional',
        skill: certDetails.certificate_name || certDetails.name,
        certificate_id: certificateId
      })
    })

    if (!xanoResponse.ok) {
      console.error('Xano API call failed:', xanoResponse.status, xanoResponse.statusText)
      return null
    }

    const xanoData = await xanoResponse.json()
    
    // The Xano API should return the certificate image URL
    return xanoData.certificate_image_url || xanoData.image_url || null

  } catch (error) {
    console.error('Xano API call error:', error)
    return null
  }
}
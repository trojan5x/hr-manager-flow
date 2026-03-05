// Simplified Razorpay Webhook Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.193.0/crypto/mod.ts';

console.log("Simplified Razorpay Webhook Function Initialized")

serve(async (req) => {
  try {
    // 1. Basic validation
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ received: true, status: 'method_not_allowed' }), {
        headers: { "Content-Type": "application/json" }, status: 200
      })
    }

    // 2. Get signature and body
    const signature = req.headers.get('x-razorpay-signature')
    const bodyText = await req.text()
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')

    if (!signature || !secret) {
      console.log('Missing signature or secret')
      return new Response(JSON.stringify({ received: true, status: 'missing_auth' }), {
        headers: { "Content-Type": "application/json" }, status: 200
      })
    }

    // 3. Verify signature (skip if SKIP_SIGNATURE_VERIFICATION=true for development)
    const skipVerification = Deno.env.get('SKIP_SIGNATURE_VERIFICATION') === 'true';
    
    if (!skipVerification) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
      const expectedSignature = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (signature.toLowerCase() !== expectedHex.toLowerCase()) {
        console.error('Invalid signature')
        return new Response(JSON.stringify({ received: true, status: 'invalid_signature' }), {
          headers: { "Content-Type": "application/json" }, status: 200
        })
      }
    }

    // 4. Parse event
    const data = JSON.parse(bodyText)
    const event = data.event
    
    // 5. FIRST CHECK: Project name filtering (early exit for other projects)
    const paymentEntity = data.payload?.payment?.entity;
    const orderEntity = data.payload?.order?.entity;
    const notes = paymentEntity?.notes || orderEntity?.notes || {};
    const projectName = notes.project_name;
    
    // If it's not our project, return success immediately without processing
    if (projectName && projectName !== 'specialized_platform_main') {
      console.log(`Ignoring webhook for different project: ${projectName}`);
      return new Response(JSON.stringify({ 
        received: true, 
        status: 'ignored_different_project',
        project_name: projectName 
      }), {
        headers: { "Content-Type": "application/json" }, 
        status: 200
      })
    }

    // 6. Only process payment.captured events
    if (event !== 'payment.captured') {
      console.log(`Ignoring non-payment event: ${event}`)
      return new Response(JSON.stringify({ 
        received: true, 
        status: 'event_ignored',
        event: event
      }), {
        headers: { "Content-Type": "application/json" }, 
        status: 200
      })
    }

    // 7. Extract payment details (we know it's payment.captured for our project now)
    const payment = paymentEntity;

    console.log(`Processing payment.captured for specialized_platform_main - Order: ${payment.order_id}, Payment: ${payment.id}`)

    // 8. Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 9. CHECK FOR DUPLICATE PROCESSING - Early exit if already processed
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, razorpay_payment_id, status')
      .eq('razorpay_payment_id', payment.id)
      .single()

    if (existingPayment) {
      console.log(`Payment ${payment.id} already processed (record ID: ${existingPayment.id}). Skipping duplicate processing.`)
      return new Response(JSON.stringify({ 
        received: true, 
        status: 'already_processed',
        payment_id: payment.id,
        existing_record_id: existingPayment.id,
        existing_status: existingPayment.status
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      })
    }

    console.log(`Payment ${payment.id} is new, proceeding with processing...`)

    // 10. Find and update order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .update({ 
        status: 'paid',
        razorpay_payment_id: payment.id
      })
      .eq('razorpay_order_id', payment.order_id)
      .select('id, session_id, user_id, amount, metadata')
      .single()

    if (orderError || !orderData) {
      console.error('Order not found:', orderError)
      return new Response(JSON.stringify({ received: true, status: 'order_not_found' }), {
        headers: { "Content-Type": "application/json" }, status: 200
      })
    }

    console.log(`Order updated: ${orderData.id}`)

    // 11. Create payment record
    await supabase.from('payments').insert({
      order_id: orderData.id,
      razorpay_payment_id: payment.id,
      amount: payment.amount / 100,
      status: 'captured'
    })

    // 12. Update session
    if (orderData.session_id) {
      await supabase.from('sessions').update({
        is_paid: true,
        amount_paid: payment.amount / 100,
        payment_id: payment.id,
        purchased_products: orderData.metadata?.detailed_items || []
      }).eq('id', orderData.session_id)
      
      console.log(`Session updated: ${orderData.session_id}`)
    }

    // 13. Create certificates
    if (orderData.user_id) {
      // Get purchased certificates
      const { data: purchases } = await supabase
        .from('purchases')
        .select(`
          role_certificate_id,
          role_certificates!inner(
            id, name, short_name, cert_id_prefix, certificate_name, role_id
          )
        `)
        .eq('order_id', orderData.id)

      if (purchases && purchases.length > 0) {
        // Get user name
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', orderData.user_id)
          .single()

        const userName = userData?.name || 'Professional'

        // Create certificate records
        const certificateRecords = purchases.map(purchase => ({
          user_id: orderData.user_id,
          role_id: purchase.role_certificates.role_id,
          role_certificate_id: purchase.role_certificate_id,
          certificate_id: `CERT-${purchase.role_certificate_id}-${payment.id.replace('pay_', '')}`,
          session_id: orderData.session_id,
          status: 'pending',
          metadata: {
            order_id: orderData.id,
            user_name: userName,
            certificate_name: purchase.role_certificates.certificate_name,
            cert_short_name: purchase.role_certificates.short_name,
            razorpay_payment_id: payment.id
          }
        }))

        const { data: insertedCerts, error: certError } = await supabase
          .from('user_certificates')
          .insert(certificateRecords)
          .select()

        if (!certError && insertedCerts && insertedCerts.length > 0) {
          console.log(`Created ${insertedCerts.length} certificates`)
          
          // 13.5 Generate Images for the new certificates
          console.log('Generating certificate images...')
          for (const cert of insertedCerts) {
            try {
              console.log(`Generating image for ${certificateId}`)

              const certUserName = cert.metadata?.user_name || 'Valued Professional'
              const certNameFull = cert.metadata?.certificate_name || 'Certificate'
              const certNameShort = cert.metadata?.cert_short_name || 'CERT'

              const imagePayload = {
                first_name: certUserName.split(' ')[0],
                last_name: certUserName.split(' ').slice(1).join(' ') || ' ',
                cert_name_short: certNameShort,
                cert_name_full: certNameFull,
                unique_certificate_id: certificateId,
                date: new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              }

              const imageResponse = await fetch('https://xgfy-czuw-092q.m2.xano.io/api:xforge/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  format: "image_png",
                  xforge_template_name: "xforge_specialized_certificate_template",
                  model: imagePayload
                })
              })

              if (imageResponse.ok) {
                const imageData = await imageResponse.json()
                const imageUrl = imageData.data?.file_url

                if (imageUrl) {
                  console.log(`Image generated for ${certificateId}: ${imageUrl}`)
                  
                  // Update certificate with image URL
                  const expiryDate = new Date()
                  expiryDate.setDate(expiryDate.getDate() + 7)

                  await supabase
                    .from('user_certificates')
                    .update({
                      certificate_image_url: imageUrl,
                      certificate_image_expires_at: expiryDate.toISOString(),
                      status: 'generated'
                    })
                    .eq('id', cert.id)
                } else {
                  console.error(`Xano returned no image URL for ${certificateId}`, imageData)
                }
              } else {
                console.error(`Image generation failed for ${certificateId}: ${imageResponse.status}`)
              }
            } catch (imgError) {
              console.error(`Error generating image for ${cert.certificate_id}:`, imgError)
            }
          }
        }
      }
    }

    // 14. Call Xano API
    if (orderData.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('name, email, phone_number')
        .eq('id', orderData.user_id)
        .single()

      if (userData) {
        // Get role name from session
        let roleName = 'Professional';
        if (orderData.session_id) {
          const { data: sessionData } = await supabase
            .from('sessions')
            .select('role')
            .eq('id', orderData.session_id)
            .single();

          if (sessionData?.role) {
            roleName = sessionData.role;
          }
        }

        // Extract product name - use certificate names from detailed_items or database
        let productName = 'Certificates';
        
        // First try to get from detailed_items in metadata
        const detailedItems = orderData.metadata?.detailed_items;
        if (detailedItems && Array.isArray(detailedItems)) {
          const productNames = detailedItems.map((item: any) => item.name).filter((name: string) => name);
          if (productNames.length > 0) {
            productName = productNames.join(', ');
          }
        }
        
        // If still "Certificates", get from purchased certificates
        if (productName === 'Certificates') {
          const { data: purchasedCertsForNames } = await supabase
            .from('purchases')
            .select(`
              role_certificates!inner(
                certificate_name,
                name
              )
            `)
            .eq('order_id', orderData.id);
          
          if (purchasedCertsForNames && purchasedCertsForNames.length > 0) {
            const certNames = purchasedCertsForNames.map((p: any) => 
              p.role_certificates.certificate_name || p.role_certificates.name
            ).filter((name: string) => name);
            productName = certNames.join(', ');
          }
        }

        // Get updated certificates with image URLs for Xano
        const { data: purchasedCertificates } = await supabase
          .from('user_certificates')
          .select(`
            certificate_id,
            certificate_image_url,
            metadata,
            role_certificates!inner(
              name,
              certificate_name
            )
          `)
          .eq('user_id', orderData.user_id)
          .contains('metadata', { razorpay_payment_id: payment.id })
          .order('created_at', { ascending: false });

        // Prepare certificates array with correct structure for Xano
        const xanoCertificatesArray: any[] = [];
        if (purchasedCertificates) {
          purchasedCertificates.forEach((cert: any) => {
            xanoCertificatesArray.push({
              name: cert.role_certificates.certificate_name || cert.role_certificates.name,
              url: cert.certificate_image_url || null // Xano expects "url" not "certificate_image_url"
            });
          });
        }

        const xanoPayload = {
          name: userData.name,
          email: userData.email,
          phone_number: userData.phone_number || '',
          payment_id: payment.id,
          amount: payment.amount / 100,
          product_name: productName,
          purchased_certificates: xanoCertificatesArray,
          role_name: roleName
        }

        console.log('Xano API payload:', xanoPayload);

        try {
          const xanoResponse = await fetch('https://xgfy-czuw-092q.m2.xano.io/api:_s7o0tIE/purchase/webhook/capture_payment_master', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xanoPayload)
          })

          if (xanoResponse.ok) {
            console.log('Xano API called successfully')
          } else {
            console.error('Xano API failed with status:', xanoResponse.status)
          }
        } catch (xanoError) {
          console.error('Xano API failed:', xanoError)
        }
      }
    }

    console.log('Webhook processing completed successfully')

    return new Response(JSON.stringify({ 
      received: true, 
      status: 'processed',
      order_id: orderData.id
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ 
      received: true,
      status: 'error',
      message: (error as Error).message 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })
  }
})
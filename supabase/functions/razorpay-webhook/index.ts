// Enhanced Razorpay Webhook Function for Complete Order Processing with Xano API Integration
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Razorpay Webhook Function Initialized (Enhanced with Xano API)")

serve(async (req) => {
  const startTime = Date.now();
  
  // Add request logging for debugging
  console.log(`=== WEBHOOK REQUEST START ===`)
  console.log(`Method: ${req.method}`)
  console.log(`URL: ${req.url}`)
  console.log(`Headers:`, Object.fromEntries(req.headers.entries()))
  
  try {
    // 1. Validate Method - Return 200 for non-POST to avoid Razorpay retries
    if (req.method !== 'POST') {
      console.log(`Received ${req.method} request - ignoring`)
      return new Response(JSON.stringify({ 
        received: true, 
        status: 'method_not_allowed',
        message: 'Only POST method supported' 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET is not set')
      return new Response(JSON.stringify({ 
        received: true, 
        status: 'configuration_error',
        message: 'Server configuration error' 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // 2. Get Signature and Body
    const signature = req.headers.get('x-razorpay-signature')
    const bodyText = await req.text()

    if (!signature) {
      console.log('Missing signature header - ignoring webhook')
      return new Response(JSON.stringify({ 
        received: true, 
        status: 'missing_signature',
        message: 'Missing signature header' 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // 3. Verify Signature (Razorpay uses HMAC-SHA256)
    // Development mode: Skip signature verification if SKIP_SIGNATURE_VERIFICATION is set
    const skipSignatureVerification = Deno.env.get('SKIP_SIGNATURE_VERIFICATION') === 'true';
    
    if (skipSignatureVerification) {
      console.warn('⚠️ DEVELOPMENT MODE: Signature verification SKIPPED')
    } else {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      );
      
      // Generate expected signature
      const expectedSignature = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Compare signatures (case-insensitive)
      const isValid = signature.toLowerCase() === expectedHex.toLowerCase();
      
      console.log(`Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);
      console.log(`Received: ${signature}`);
      console.log(`Expected: ${expectedHex}`);

      if (!isValid) {
        console.error('Invalid signature - webhook ignored')
        console.log('Body text length:', bodyText.length)
        console.log('Body text (first 500 chars):', bodyText.substring(0, 500))
        
        // For development: log more details (remove in production)
        console.log('Environment check - RAZORPAY_WEBHOOK_SECRET exists:', !!secret)
        console.log('Secret length:', secret?.length || 0)
        
        return new Response(JSON.stringify({ 
          received: true, 
          status: 'invalid_signature',
          message: 'Invalid signature - webhook ignored for security',
          debug: {
            signature_received: !!signature,
            body_length: bodyText.length,
            secret_configured: !!secret
          }
        }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
      }
    }

    // 4. Process Event
    const data = JSON.parse(bodyText)
    const event = data.event
    
    // 5. Project Filtering
    const paymentEntity = data.payload?.payment?.entity;
    const orderEntity = data.payload?.order?.entity;
    const notes = paymentEntity?.notes || orderEntity?.notes || {};
    const projectName = notes.project_name;
    
    const EXPECTED_PROJECT_NAME = 'specialized_platform_main';

    if (projectName && projectName !== EXPECTED_PROJECT_NAME) {
        console.log(`Ignoring event for different project: ${projectName}`);
        return new Response(JSON.stringify({ received: true, status: 'ignored_project_mismatch' }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    }

    console.log(`Received event: ${event} for ${projectName || 'Unknown Project'}`);

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 6. Handle Payment Events (with duplicate prevention)
    if (event === 'order.paid' || event === 'payment.captured') {
        const payment = data.payload.payment.entity
        const orderId = payment.order_id
        
        console.log(`Processing ${event} for Order ID: ${orderId}`);
        console.log(`Payment ID: ${payment.id}, Amount: ${payment.amount}`);

        // Check if we've already processed this specific payment
        const { data: existingPayment } = await supabase
            .from('payments')
            .select('id, status')
            .eq('razorpay_payment_id', payment.id)
            .single();

        if (existingPayment) {
            console.log(`Payment ${payment.id} already processed. Skipping duplicate processing.`);
            
            return new Response(JSON.stringify({ 
                received: true, 
                status: 'already_processed',
                payment_id: payment.id,
                existing_record_id: existingPayment.id
            }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }

        try {
            // STEP 1: Update orders table and get order details
            const { data: updatedOrderData, error: orderError } = await supabase
                .from('orders')
                .update({ 
                    status: 'paid',
                    razorpay_payment_id: payment.id,
                    metadata: {
                        ...payment,
                        webhook_processed_at: new Date().toISOString()
                    }
                })
                .eq('razorpay_order_id', orderId)
                .select('id, session_id, user_id, amount, metadata')
                .single();

            if (orderError || !updatedOrderData) {
                console.error('Failed to update/find order:', orderError);
                console.log('Order might not exist in our database - this could be from another system');
                
                return new Response(JSON.stringify({ 
                    received: true, 
                    status: 'order_not_found',
                    note: 'Order not found in our system but webhook acknowledged'
                }), {
                    headers: { "Content-Type": "application/json" },
                    status: 200,
                });
            }

            console.log(`Successfully updated order: ${updatedOrderData.id}`);

            // STEP 2: Create payment record (already checked for duplicates above)
            const { error: paymentError } = await supabase
                .from('payments')
                .insert({
                    order_id: updatedOrderData.id,
                    razorpay_payment_id: payment.id,
                    razorpay_signature: payment.signature || null,
                    amount: payment.amount / 100, // Convert paise to currency units
                    status: payment.status || 'captured'
                });
            
            if (paymentError) {
                console.error('Failed to create payment record:', paymentError);
                // Don't fail the webhook for this
            } else {
                console.log('Payment record created successfully');
            }
            
            // STEP 3: Update sessions table if session_id exists (idempotent)
            if (updatedOrderData.session_id) {
                // Check if session is already marked as paid
                const { data: sessionData } = await supabase
                    .from('sessions')
                    .select('is_paid, payment_id')
                    .eq('id', updatedOrderData.session_id)
                    .single();

                if (sessionData?.is_paid && sessionData?.payment_id) {
                    console.log(`Session ${updatedOrderData.session_id} already marked as paid`);
                } else {
                    const { error: sessionError } = await supabase
                        .from('sessions')
                        .update({
                            is_paid: true,
                            amount_paid: payment.amount / 100, // Convert paise to currency units
                            payment_id: payment.id,
                            purchased_products: updatedOrderData.metadata?.detailed_items || []
                        })
                        .eq('id', updatedOrderData.session_id);
                    
                    if (sessionError) {
                        console.error('Failed to update session:', sessionError);
                        // Don't fail the webhook for this
                    } else {
                        console.log(`Session ${updatedOrderData.session_id} updated successfully`);
                    }
                }
            }

            // STEP 4: Update purchase records status (if needed)
            if (updatedOrderData.id) {
                const { error: purchaseUpdateError } = await supabase
                    .from('purchases')
                    .update({ 
                        purchased_at: new Date().toISOString() 
                    })
                    .eq('order_id', updatedOrderData.id);
                
                if (purchaseUpdateError) {
                    console.error('Failed to update purchase records:', purchaseUpdateError);
                    // Don't fail the webhook for this
                } else {
                    console.log('Purchase records updated successfully');
                }
            }

            // STEP 5: Create certificate records (without images) for immediate availability
            if (updatedOrderData.id && updatedOrderData.user_id) {
                console.log('Creating certificate records for purchased items...');
                
                try {
                    // Get purchased certificates from the order
                    const { data: purchasedCerts, error: purchaseError } = await supabase
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
                        .eq('order_id', updatedOrderData.id);

                    if (purchaseError) {
                        console.error('Failed to get purchased certificates:', purchaseError);
                    } else if (purchasedCerts && purchasedCerts.length > 0) {
                        console.log(`Found ${purchasedCerts.length} purchased certificates to create records for`);

                        // Get user data for certificate metadata
                        const { data: userData, error: userError } = await supabase
                            .from('users')
                            .select('id, name, email')
                            .eq('id', updatedOrderData.user_id)
                            .single();

                        const userName = userData?.name || 'Valued Professional';

                        // Create certificate records for each purchased certificate
                        const certificateInserts = [];
                        
                        for (const cert of purchasedCerts) {
                            const timestamp = Date.now();
                            const certificateId = `CERT-${cert.role_certificate_id}-${timestamp}`;

                            certificateInserts.push({
                                user_id: updatedOrderData.user_id,
                                role_id: cert.role_certificates.role_id,
                                role_certificate_id: cert.role_certificate_id,
                                certificate_id: certificateId,
                                session_id: updatedOrderData.session_id, // NEW: Store session_id
                                status: 'pending',
                                // Note: certificate_image_url is NULL (to be filled later on success page)
                                // certificate_image_expires_at is NULL (to be filled when image is generated)
                                metadata: {
                                    order_id: updatedOrderData.id,
                                    user_name: userName,
                                    certificate_name: cert.role_certificates.certificate_name,
                                    cert_short_name: cert.role_certificates.short_name,
                                    created_by_webhook: true,
                                    razorpay_payment_id: payment.id
                                }
                            });
                        }

                        // Bulk insert certificate records
                        const { data: insertedCerts, error: insertError } = await supabase
                            .from('user_certificates')
                            .insert(certificateInserts)
                            .select('id, certificate_id');

                        if (insertError) {
                            console.error('Failed to create certificate records:', insertError);
                            // Don't fail the webhook for this, but log it
                        } else {
                            console.log(`Successfully created ${insertedCerts?.length || 0} certificate records`);
                            console.log('Certificate IDs created:', insertedCerts?.map(c => c.certificate_id));
                        }
                    } else {
                        console.log('No purchased certificates found for this order');
                    }
                } catch (certError) {
                    console.error('Certificate creation process failed:', certError);
                    // Don't fail the webhook for certificate creation issues
                }
            } else {
                console.log('Skipping certificate creation - missing order_id or user_id');
            }

            // STEP 6: Call Xano API for internal logging
            if (updatedOrderData.id && updatedOrderData.user_id) {
                console.log('Calling Xano API for payment logging...');
                
                try {
                    // Get user data for the API call
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('id, name, email, phone_number')
                        .eq('id', updatedOrderData.user_id)
                        .single();

                    if (userData && !userError) {
                        // Get role name from session
                        let roleName = 'Unknown Role';
                        if (updatedOrderData.session_id) {
                            const { data: sessionData } = await supabase
                                .from('sessions')
                                .select('role')
                                .eq('id', updatedOrderData.session_id)
                                .single();
                            
                            if (sessionData?.role) {
                                roleName = sessionData.role;
                            }
                        }

                        // Extract product name - use certificate names instead of detailed_items
                        let productName = 'Unknown Product';
                        
                        // First try to get from detailed_items in metadata
                        const detailedItems = updatedOrderData.metadata?.detailed_items;
                        if (detailedItems && Array.isArray(detailedItems)) {
                            const productNames = detailedItems.map(item => item.name).filter(name => name);
                            if (productNames.length > 0) {
                                productName = productNames.join(', ');
                            }
                        }
                        
                        // If still "Unknown Product", get from purchased certificates
                        if (productName === 'Unknown Product') {
                            const { data: purchasedCertsForNames } = await supabase
                                .from('purchases')
                                .select(`
                                    role_certificates!inner(
                                        certificate_name,
                                        name
                                    )
                                `)
                                .eq('order_id', updatedOrderData.id);
                            
                            if (purchasedCertsForNames && purchasedCertsForNames.length > 0) {
                                const certNames = purchasedCertsForNames.map(p => 
                                    p.role_certificates.certificate_name || p.role_certificates.name
                                ).filter(name => name);
                                productName = certNames.join(', ');
                            }
                        }

                        // Generate certificate images for the certificates we just created
                        console.log('Generating certificate images...');
                        try {
                            // Get the certificates that were just created (they should be pending)
                            const { data: pendingCerts, error: pendingError } = await supabase
                                .from('user_certificates')
                                .select(`
                                    certificate_id,
                                    role_certificates!inner(
                                        certificate_name,
                                        name,
                                        short_name
                                    ),
                                    metadata
                                `)
                                .eq('user_id', updatedOrderData.user_id)
                                .eq('status', 'pending')
                                .order('created_at', { ascending: false })
                                .limit(10); // Limit to recent certificates

                            if (pendingCerts && pendingCerts.length > 0) {
                                console.log(`Found ${pendingCerts.length} certificates to generate images for`);
                                
                                // Generate images for each certificate
                                for (const cert of pendingCerts) {
                                    try {
                                        const certName = cert.role_certificates.certificate_name || cert.role_certificates.name;
                                        const certShort = cert.role_certificates.short_name || 'CERT';
                                        const userName = cert.metadata?.user_name || userData.name || 'Professional';
                                        
                                        const imagePayload = {
                                            first_name: userName.split(' ')[0],
                                            last_name: userName.split(' ').slice(1).join(' ') || ' ',
                                            cert_name_short: certShort,
                                            cert_name_full: certName,
                                            unique_certificate_id: cert.certificate_id,
                                            date: new Date().toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })
                                        };

                                        console.log(`Generating image for certificate: ${cert.certificate_id}`);
                                        
                                        const imageResponse = await fetch('https://xgfy-czuw-092q.m2.xano.io/api:xforge/generate', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({
                                                format: "image_png",
                                                xforge_template_name: "xforge_specialized_certificate_template",
                                                model: imagePayload
                                            })
                                        });

                                        if (imageResponse.ok) {
                                            const imageResult = await imageResponse.json();
                                            const imageUrl = imageResult.data?.file_url;
                                            
                                            if (imageUrl) {
                                                // Update certificate with generated image URL
                                                const { error: updateError } = await supabase
                                                    .from('user_certificates')
                                                    .update({
                                                        certificate_image_url: imageUrl,
                                                        certificate_image_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                                                        status: 'generated'
                                                    })
                                                    .eq('certificate_id', cert.certificate_id);
                                                
                                                if (!updateError) {
                                                    console.log(`Image generated and saved for certificate: ${cert.certificate_id}`);
                                                } else {
                                                    console.error(`Failed to save image URL for certificate: ${cert.certificate_id}`, updateError);
                                                }
                                            }
                                        } else {
                                            console.error(`Image generation failed for certificate: ${cert.certificate_id}`);
                                        }
                                        
                                        // Small delay between requests to avoid rate limiting
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        
                                    } catch (imageError) {
                                        console.error(`Error generating image for certificate ${cert.certificate_id}:`, imageError);
                                    }
                                }
                            }
                        } catch (imageGenError) {
                            console.error('Error in certificate image generation process:', imageGenError);
                        }

                        // Get updated certificates with image URLs (after generation)
                        const { data: purchasedCertificates, error: certError } = await supabase
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
                            .eq('user_id', updatedOrderData.user_id)
                            .in('status', ['pending', 'generated'])
                            .order('created_at', { ascending: false })
                            .limit(10);

                        // Prepare certificates array with correct structure for Xano
                        const xanoCertificatesArray = [];
                        if (purchasedCertificates && !certError) {
                            purchasedCertificates.forEach(cert => {
                                xanoCertificatesArray.push({
                                    name: cert.role_certificates.certificate_name || cert.role_certificates.name,
                                    url: cert.certificate_image_url || null // Xano expects "url" not "certificate_image_url"
                                });
                            });
                        }

                        // Prepare Xano API payload to match expected structure
                        const xanoPayload = {
                            name: userData.name,
                            email: userData.email,
                            phone_number: userData.phone_number || '',
                            payment_id: payment.id,
                            amount: payment.amount / 100, // Convert paise to Rs
                            product_name: productName,
                            purchased_certificates: xanoCertificatesArray,
                            role_name: roleName
                        };

                        console.log('Xano API payload:', xanoPayload);

                        // Make the API call to Xano
                        const xanoResponse = await fetch('https://xgfy-czuw-092q.m2.xano.io/api:_s7o0tIE/purchase/webhook/capture_payment_master', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(xanoPayload)
                        });

                        if (xanoResponse.ok) {
                            const xanoResult = await xanoResponse.json();
                            console.log('Xano API call successful:', xanoResult);
                        } else {
                            const xanoError = await xanoResponse.text();
                            console.error('Xano API call failed:', xanoResponse.status, xanoError);
                            // Don't fail the webhook for Xano API issues, but log the error
                        }
                    } else {
                        console.error('Failed to get user data for Xano API call:', userError);
                    }
                } catch (xanoError) {
                    console.error('Error calling Xano API:', xanoError);
                    // Don't fail the webhook for Xano API issues
                }
            }

            const processingTime = Date.now() - startTime;
            console.log(`Webhook processing completed in ${processingTime}ms`);

            return new Response(JSON.stringify({ 
                received: true, 
                status: 'processed',
                order_id: updatedOrderData.id,
                processing_time_ms: processingTime,
                operations_completed: [
                    'orders_table_updated',
                    'payments_table_created', 
                    'sessions_table_updated',
                    'purchases_table_updated',
                    'certificate_records_created',
                    'certificate_images_generated',
                    'xano_api_called'
                ]
            }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });

        } catch (dbError) {
            console.error('Database operations failed during webhook processing:', dbError);
            
            // Return 200 to Razorpay to prevent retries, even though processing failed
            return new Response(JSON.stringify({ 
                received: true, 
                status: 'database_error',
                message: 'Database operations failed but payment acknowledged'
            }), {
                headers: { "Content-Type": "application/json" },
                status: 200,
            });
        }
    }

    // Handle other events (log but don't process) - Always return 200
    console.log(`Event ${event} received but not processed - returning 200 to prevent retries`);
    
    return new Response(JSON.stringify({ 
        received: true, 
        status: 'event_not_processed',
        event: event,
        message: `Event ${event} acknowledged but not processed by this webhook`
    }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    // CRITICAL: Always return 200 to prevent Razorpay retries, even on errors
    return new Response(JSON.stringify({ 
      received: true,
      status: 'processing_error',
      message: 'Webhook received but processing failed',
      error: (error as Error).message 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })
  }
})
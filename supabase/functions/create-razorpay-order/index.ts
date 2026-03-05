import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Razorpay Credentials
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

console.log("Create Razorpay Order Function Initialized");

serve(async (req) => {
  const startTime = Date.now();
  
  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const { amount, currency = 'INR', notes = {} } = await req.json();

    // 1. Validation
    if (!amount) {
      return new Response(JSON.stringify({ error: 'Amount is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys not set');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // 2. Project Name Alignment
    const finalNotes = {
        ...notes,
        project_name: notes.project_name || 'specialized_platform_main'
    };

    console.log('Processing order request with notes:', finalNotes);

    // 3. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse detailed items once
    let detailedItems = [];
    if (finalNotes.detailed_items) {
      try {
        detailedItems = JSON.parse(finalNotes.detailed_items);
      } catch (e) {
        console.warn('Failed to parse detailed_items:', e);
      }
    }

    console.log(`Prep completed in ${Date.now() - startTime}ms`);

    // 4. PARALLEL OPERATIONS: Create Razorpay order + Get user_id simultaneously
    const razorpayStartTime = Date.now();
    
    const [razorpayResult, sessionResult] = await Promise.allSettled([
      // Razorpay Order Creation
      (async () => {
        const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
        
        const razorpayBody = {
            amount: amount,
            currency: currency,
            notes: finalNotes,
            payment_capture: 1 
        };

        console.log('Creating Razorpay order with amount:', amount);

        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(razorpayBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Razorpay API Error: ${errorData.error?.description || 'Unknown error'}`);
        }

        return await response.json();
      })(),
      
      // Session/User Data Retrieval
      finalNotes.session_id ? (async () => {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('user_id')
          .eq('id', parseInt(finalNotes.session_id))
          .single();

        if (sessionError) {
          console.error('Failed to get session data:', sessionError);
          return null;
        }
        return sessionData?.user_id;
      })() : Promise.resolve(null)
    ]);

    console.log(`Parallel operations completed in ${Date.now() - razorpayStartTime}ms`);

    // Handle results
    if (razorpayResult.status === 'rejected') {
      console.error('Razorpay order creation failed:', razorpayResult.reason);
      return new Response(JSON.stringify({ error: razorpayResult.reason.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const razorpayData = razorpayResult.value;
    const userId = sessionResult.status === 'fulfilled' ? sessionResult.value : null;

    console.log(`User ID retrieved: ${userId}`);

    // 5. SINGLE DATABASE TRANSACTION: Insert order + purchase records
    const dbStartTime = Date.now();
    let orderData = null; // Initialize outside try block
    
    try {
      // Create order record with Razorpay ID immediately
      const { data: orderResult, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          amount: amount / 100,
          currency: currency,
          status: 'created',
          razorpay_order_id: razorpayData.id, // Set immediately, no update needed
          session_id: finalNotes.session_id ? parseInt(finalNotes.session_id) : null,
          metadata: {
            user_name: finalNotes.user_name,
            user_email: finalNotes.user_email,
            user_phone: finalNotes.user_phone,
            project_name: finalNotes.project_name,
            purchase_type: finalNotes.purchase_type,
            item_list: finalNotes.item_list,
            detailed_items: detailedItems,
            role_id: finalNotes.role_id,
            created_via: 'edge_function_v2'
          }
        })
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order record:', orderError);
        // Since Razorpay order is already created, we should still return success
        // but log the database issue
        console.error('WARNING: Razorpay order created but database record failed');
      } else {
        orderData = orderResult; // Assign to outer scope variable
        console.log('Order record created:', orderData.id);

        // Create purchase records in parallel (don't block response)
        if (detailedItems.length > 0 && userId) {
          // Fire and forget - don't await this
          const purchaseRecords = detailedItems.map((item: any) => ({
            user_id: userId,
            order_id: orderData.id,
            role_certificate_id: item.id
          }));

          supabase
            .from('purchases')
            .insert(purchaseRecords)
            .then(({ error: purchaseError }) => {
              if (purchaseError) {
                console.error('Failed to create purchase records:', purchaseError);
              } else {
                console.log(`Created ${purchaseRecords.length} purchase records`);
              }
            });
        }
      }
      
      console.log(`Database operations completed in ${Date.now() - dbStartTime}ms`);

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Don't fail the entire request since Razorpay order is created
      console.error('WARNING: Razorpay order created but database operations failed');
    }

    // 6. Return Success Response
    const totalTime = Date.now() - startTime;
    console.log(`Total order creation time: ${totalTime}ms`);
    
    return new Response(JSON.stringify({
      ...razorpayData,
      internal_order_id: orderData?.id || null,
      performance: {
        total_time_ms: totalTime,
        optimized: true
      }
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
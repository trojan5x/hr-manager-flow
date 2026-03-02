import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Initialize Razorpay Credentials
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

console.log("Create Razorpay Order Function Initialized");

serve(async (req) => {
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
    
    // 2. Project Name Alignment - Use the frontend's project name
    const finalNotes = {
        ...notes,
        // Keep the project name from frontend for consistency with existing webhook filter
        project_name: notes.project_name || 'specialized_platform_main'
    };

    console.log('Processing order request with notes:', finalNotes);

    // 3. Initialize Supabase Client (Service Role for Admin operations)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Create Order in Database First
    let orderRecord;
    try {
      // Parse detailed items if provided
      let detailedItems = [];
      if (finalNotes.detailed_items) {
        try {
          detailedItems = JSON.parse(finalNotes.detailed_items);
        } catch (e) {
          console.warn('Failed to parse detailed_items:', e);
        }
      }

      // Get user_id from session first
      let userId = null;
      if (finalNotes.session_id) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('user_id')
          .eq('id', parseInt(finalNotes.session_id))
          .single();

        if (sessionError) {
          console.error('Failed to get session data:', sessionError);
        } else {
          userId = sessionData?.user_id;
        }
      }

      // Create order record
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId, // Add user_id to orders table
          amount: amount / 100, // Store in currency units, not paise
          currency: currency,
          status: 'created',
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
            created_via: 'edge_function'
          }
        })
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order record:', orderError);
        return new Response(JSON.stringify({ error: 'Failed to create order record', details: orderError }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      orderRecord = orderData;
      console.log('Order record created:', orderRecord.id);

      // 5. Create Purchase Records for each certificate
      if (detailedItems.length > 0 && userId) {
        const purchaseRecords = detailedItems.map((item: any) => ({
          user_id: userId,
          order_id: orderRecord.id,
          role_certificate_id: item.id // This is the database certificate ID
        }));

        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert(purchaseRecords);

        if (purchaseError) {
          console.error('Failed to create purchase records:', purchaseError);
          // Don't fail the order creation for this, just log it
        } else {
          console.log(`Created ${purchaseRecords.length} purchase records`);
        }
      } else {
        console.warn('No user_id or detailed_items available for purchase records');
      }

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return new Response(JSON.stringify({ error: 'Database operation failed', details: dbError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Create Razorpay Order
    const authHeader = `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
    
    const razorpayBody = {
        amount: amount, // Amount in paise
        currency: currency,
        notes: finalNotes,
        payment_capture: 1 
    };

    console.log('Creating Razorpay order with amount:', amount);

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(razorpayBody)
    });

    const razorpayData = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
        console.error('Razorpay API Error:', razorpayData);
        
        // Rollback: Delete the order record we created
        await supabase.from('orders').delete().eq('id', orderRecord.id);
        
        return new Response(JSON.stringify({ error: razorpayData.error?.description || 'Razorpay creation failed' }), {
            status: razorpayResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 7. Update Order Record with Razorpay Order ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: razorpayData.id })
      .eq('id', orderRecord.id);

    if (updateError) {
      console.error('Failed to update order with razorpay_order_id:', updateError);
    }

    // 8. Return Order
    console.log('Order created successfully:', razorpayData.id);
    return new Response(JSON.stringify({
      ...razorpayData,
      internal_order_id: orderRecord.id // Include our internal order ID for reference
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
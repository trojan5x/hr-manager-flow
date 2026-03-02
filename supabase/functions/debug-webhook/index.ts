// Simple Debug Webhook - Always Returns 200
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

console.log("DEBUG Webhook Function Started - Always Returns 200")

serve(async (req) => {
  console.log(`=== DEBUG WEBHOOK REQUEST ===`)
  console.log(`Method: ${req.method}`)
  console.log(`URL: ${req.url}`)
  console.log(`Headers:`, Object.fromEntries(req.headers.entries()))
  
  try {
    const bodyText = await req.text()
    console.log(`Body length: ${bodyText.length}`)
    console.log(`Body (first 1000 chars):`, bodyText.substring(0, 1000))
    
    let parsedBody = null
    try {
      parsedBody = JSON.parse(bodyText)
      console.log(`Event: ${parsedBody?.event}`)
      console.log(`Payment ID: ${parsedBody?.payload?.payment?.entity?.id}`)
    } catch (e) {
      console.log('Failed to parse JSON body:', e.message)
    }
    
    // Always return 200 with detailed info
    return new Response(JSON.stringify({
      received: true,
      status: 'debug_mode',
      message: 'Debug webhook - always returns 200',
      request_details: {
        method: req.method,
        headers_count: req.headers.size,
        body_length: bodyText.length,
        event: parsedBody?.event || 'unknown',
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
    
  } catch (error) {
    console.error('Error in debug webhook:', error)
    
    // Even errors return 200
    return new Response(JSON.stringify({
      received: true,
      status: 'debug_error',
      message: 'Debug webhook error but still returning 200',
      error: error.message
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  }
})
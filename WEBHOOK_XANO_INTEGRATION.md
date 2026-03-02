# Razorpay Webhook Xano API Integration

## Summary
Modified the Razorpay webhook to call your Xano API for internal logging after successful payments.

## Changes Made

### 1. Enhanced Webhook File: `enhanced-razorpay-webhook.ts`
- Added STEP 6: Xano API integration after certificate creation
- Added certificate image generation during payment processing
- Fixed product name extraction to use certificate names
- Calls Xano API at: `https://xgfy-czuw-092q.m2.xano.io/api:_s7o0tIE/purchase/webhook/capture_payment_master`
- **CRITICAL**: Always returns HTTP 200 to prevent Razorpay retries

### 2. New Supabase Edge Function: `supabase/functions/razorpay-webhook/index.ts`
- Complete webhook function ready for deployment to Supabase
- Includes all existing functionality plus Xano API integration
- Generates certificate images immediately after payment
- Fixed product name to be a concatenated string of certificate names
- **CRITICAL**: Always returns HTTP 200 to prevent Razorpay retries
- Proper error handling without causing webhook failures

## API Payload Structure
The webhook sends the following data to your Xano API:

```json
{
  "name": "User Full Name",
  "email": "user@example.com", 
  "phone_number": "91XXXXXXXXXX",
  "payment_id": "pay_XXXXXXXX",
  "amount": 299,
  "product_name": "Certificate Name 1, Certificate Name 2",
  "purchased_certificates": [
    {
      "name": "Certificate Name",
      "url": "https://certificate-image-url.png"
    }
  ],
  "role_name": "Role Name"
}
```

## Field Mapping
- **name**: User's full name from users table
- **email**: User's email from users table  
- **phone_number**: User's phone from users table (can be empty)
- **payment_id**: Razorpay payment ID
- **amount**: Payment amount in Rs (converted from paise)
- **product_name**: Concatenated certificate names from detailed_items in order metadata
- **purchased_certificates**: Array with certificate name and image URL
- **role_name**: Role from session table

## Implementation Notes

1. **CRITICAL - Always Returns HTTP 200**: The webhook now ALWAYS returns HTTP 200 status to prevent Razorpay from retrying webhooks unnecessarily

2. **Product Name Extraction**: 
   - First tries to extract from `detailed_items` in order metadata
   - If not found, extracts from purchased certificate names
   - Returns concatenated certificate names with ", " separator

3. **Certificate Image Generation**: 
   - Automatically generates certificate images during payment processing
   - Uses Xano's xforge API for image generation
   - Updates certificate records with generated image URLs
   - Sets 7-day expiration for generated images

4. **Error Handling**: All errors are logged but webhook never fails:
   - Xano API failures don't cause webhook to fail
   - Database failures don't cause webhook to fail
   - Image generation failures don't cause webhook to fail
   - Invalid data doesn't cause webhook to fail

5. **Data Sources**: 
   - User data from `users` table
   - Role from `sessions` table
   - Product names from certificate names (fallback to `orders.metadata.detailed_items`)
   - Certificates from `user_certificates` table with `role_certificates` join

6. **Timing**: 
   - Certificate records created first
   - Certificate images generated immediately
   - Xano API called last with all data including image URLs

7. **Logging**: Comprehensive logging for debugging and monitoring

## Deployment

### Option 1: Update existing webhook
Replace your current webhook with the enhanced version in `enhanced-razorpay-webhook.ts`

### Option 2: Deploy new Supabase edge function
Deploy the file `supabase/functions/razorpay-webhook/index.ts` as a new Supabase edge function:

```bash
supabase functions deploy razorpay-webhook
```

## Testing
Use the same Razorpay webhook testing flow. The Xano API will be called automatically after successful payments with the structured data matching your curl example.
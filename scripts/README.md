# 🎨 Certificate Preview Generation Guide

This guide walks you through generating actual certificate preview images to replace placeholders in your specialized platform.

## Quick Start

1. **Set your Supabase Service Role Key**:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

2. **Test the setup** (recommended):
   ```bash
   cd scripts
   npm install  
   npm run test
   ```

3. **Generate certificate previews**:
   ```bash
   npm run generate
   ```

## What You'll See

### During Setup Test:
```
🧪 Certificate Preview Generator - Setup Test
==================================================

1️⃣ Testing Environment Variables...
   ✅ SUPABASE_SERVICE_ROLE_KEY is set

2️⃣ Testing Supabase Connection...
   ✅ Successfully connected to Supabase
   📊 Database access confirmed

3️⃣ Testing Role Certificates Query...
   ✅ Found 5 role certificates:
   📜 CHRPx: Certified Human Resources Professional
      Role: HR Manager  
      Status: 🔄 Needs Generation
      Current: /assets/certificateImages/CHRPx.png

4️⃣ Testing Storage Access...
   ✅ certificate-previews bucket already exists
   📁 Available storage buckets: certificate-previews

5️⃣ Testing Certificate Generation API...
   ✅ Certificate generation API is working
   🔗 Test certificate URL: https://...

🎉 Setup test completed successfully!
```

### During Generation:
```
🚀 Starting certificate preview generation...

📋 Fetching role certificates from database...
📋 Found 5 certificates to process

🔄 Processing: Certified Human Resources Professional
   Role: HR Manager
   Short Name: CHRPx
   Current Preview: /assets/certificateImages/CHRPx.png

🎨 Generating certificate image for: Certified Human Resources Professional
✅ Certificate generated successfully: https://x8ki-letl-twmt.n7.xano.io/...

📥 Downloading image from: https://x8ki-letl-twmt.n7.xano.io/...
📤 Uploading to Supabase storage: preview-CHRPx.png
✅ Uploaded successfully: https://pndqvtuejuxanhzvuwoh.supabase.co/...

✅ Database updated for certificate ID: 101
   ✅ Certificate preview generated successfully!

==================================================
📊 GENERATION SUMMARY
==================================================
✅ Successfully processed: 5
⏭️ Skipped (already exists): 0
❌ Failed: 0
📋 Total certificates: 5

🎉 Certificate preview generation completed!
```

## Expected Results

After running the script, you should see:

1. **New Storage Bucket**: `certificate-previews` in your Supabase storage
2. **Generated Images**: One PNG file per certificate (e.g., `preview-CHRPx.png`)
3. **Updated Database**: `role_certificates.preview_image` now points to storage URLs instead of placeholder paths
4. **Permanent URLs**: Images are permanently stored (won't expire like the generated ones)

## Files Created

### Certificate Preview Images
```
Supabase Storage: certificate-previews/
├── preview-CHRPx.png     (HR Manager certificates)
├── preview-PMHRx.png
├── preview-SHRBPx.png
├── preview-PASx.png
├── preview-COPx.png      (Operations Manager certificates)
├── preview-SCESx.png
├── preview-QMSEx.png
├── preview-OAPx.png
└── preview-SOLx.png
```

### Database Updates
The `role_certificates` table `preview_image` field changes from:
```
/assets/certificateImages/CHRPx.png
```
To:
```
https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-previews/preview-CHRPx.png
```

## Demo Data Used

All certificates are generated with consistent demo data:
- **Name**: "Your Name Here"
- **Date**: "22 January 2026"  
- **Certificate Names**: Actual names from your database
- **Unique IDs**: `PREVIEW-{cert_id}-{timestamp}`

## Troubleshooting

### ❌ "SUPABASE_SERVICE_ROLE_KEY is not set"
**Solution**: Get your service role key from Supabase project settings > API and set it:
```bash
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ❌ "Failed to connect to Supabase"
**Solution**: Check that your service role key is correct and has the right permissions.

### ❌ "Certificate generation API failed"
**Solution**: The Xano API might be temporarily unavailable. Try again in a few minutes.

### ❌ "Failed to upload to storage"
**Solution**: Ensure your service role key has storage access permissions.

## Manual Verification

After running the script, verify the results:

1. **Check Supabase Storage**: Go to your Supabase dashboard > Storage > certificate-previews
2. **Check Database**: Query `role_certificates` table to see updated `preview_image` URLs
3. **View Images**: Open the storage URLs in a browser to see the generated certificates

## Customization

To change the demo data, edit `scripts/generate-certificate-previews.mjs`:

```javascript
const certificateData = {
    firstName: "Demo",              // Change this
    lastName: "Professional",       // Change this  
    shortName: cert.short_name,
    fullName: cert.certificate_name,
    uniqueId: `PREVIEW-${cert.id}-${Date.now()}`,
    date: "01 February 2026"        // Change this
};
```

## Production Usage

Once you've verified the certificate previews look good:

1. **Update your application** to use the new storage URLs
2. **Remove old placeholder images** from `/assets/certificateImages/` (optional)
3. **Set up automated regeneration** if you add new certificates regularly

---

🎉 **You're all set!** Your role certificates now have beautiful, actual preview images instead of placeholders.
#!/usr/bin/env node

/**
 * Generate Certificate Preview Images Script
 * 
 * This script:
 * 1. Fetches all role certificates from the database
 * 2. Generates actual certificate images using the Xano API  
 * 3. Uploads them to Supabase storage
 * 4. Updates the database with the permanent storage URLs
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnvFile() {
    try {
        const envPath = resolve(__dirname, '.env');
        const envContent = readFileSync(envPath, 'utf8');
        
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
                process.env[key.trim()] = value.trim();
            }
        });
        
        console.log('✅ Loaded environment variables from .env file');
    } catch (error) {
        console.log('ℹ️  No .env file found, using system environment variables');
    }
}

// Load .env file first
loadEnvFile();

// Supabase configuration
const SUPABASE_URL = 'https://pndqvtuejuxanhzvuwoh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Certificate generation API endpoint
const CERT_API_URL = 'https://xgfy-czuw-092q.m2.xano.io/api:xforge/generate';

/**
 * Generate certificate image using Xano API
 */
async function generateCertificateImage(certificateData) {
    const payload = {
        format: "image_png",
        xforge_template_name: "xforge_specialized_certificate_template",
        model: {
            first_name: certificateData.firstName,
            last_name: certificateData.lastName,
            cert_name_short: certificateData.shortName,
            cert_name_full: certificateData.fullName,
            unique_certificate_id: certificateData.uniqueId,
            date: certificateData.date
        }
    };

    console.log(`🎨 Generating certificate image for: ${certificateData.fullName}`);
    
    try {
        const response = await fetch(CERT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.data?.file_url) {
            console.log(`✅ Certificate generated successfully: ${result.data.file_url}`);
            return result.data.file_url;
        } else {
            throw new Error('No file_url in API response');
        }
    } catch (error) {
        console.error(`❌ Failed to generate certificate: ${error.message}`);
        return null;
    }
}

/**
 * Download image from URL and upload to Supabase storage
 */
async function uploadToSupabaseStorage(imageUrl, filename) {
    try {
        console.log(`📥 Downloading image from: ${imageUrl}`);
        
        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.buffer();
        
        console.log(`📤 Uploading to Supabase storage: ${filename}`);
        
        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from('certificate-previews')
            .upload(filename, imageBuffer, {
                contentType: 'image/png',
                upsert: true
            });
            
        if (error) {
            throw new Error(`Supabase upload error: ${error.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('certificate-previews')
            .getPublicUrl(filename);
            
        console.log(`✅ Uploaded successfully: ${urlData.publicUrl}`);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error(`❌ Failed to upload to storage: ${error.message}`);
        return null;
    }
}

/**
 * Update role certificate with new preview image URL
 */
async function updateCertificatePreviewImage(certificateId, imageUrl) {
    try {
        const { error } = await supabase
            .from('role_certificates')
            .update({ 
                preview_image: imageUrl
            })
            .eq('id', certificateId);
            
        if (error) {
            throw new Error(`Database update error: ${error.message}`);
        }
        
        console.log(`✅ Database updated for certificate ID: ${certificateId}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to update database: ${error.message}`);
        return false;
    }
}

/**
 * Main function to generate all certificate previews
 */
async function generateAllCertificatePreviews() {
    console.log('🚀 Starting certificate preview generation...\n');
    
    try {
        // 1. Fetch all role certificates
        console.log('📋 Fetching role certificates from database...');
        const { data: certificates, error } = await supabase
            .from('role_certificates')
            .select(`
                id,
                name,
                short_name,
                certificate_name,
                preview_image,
                roles!inner(role_name)
            `)
            .order('id');
            
        if (error) {
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
        
        if (!certificates || certificates.length === 0) {
            console.log('⚠️ No certificates found in database');
            return;
        }
        
        console.log(`📋 Found ${certificates.length} certificates to process\n`);
        
        // 2. Process each certificate
        const results = {
            success: 0,
            failed: 0,
            skipped: 0
        };
        
        for (const cert of certificates) {
            console.log(`\n🔄 Processing: ${cert.certificate_name || cert.name}`);
            console.log(`   Role: ${cert.roles?.role_name || 'Unknown'}`);
            console.log(`   Short Name: ${cert.short_name}`);
            console.log(`   Current Preview: ${cert.preview_image}`);
            
            // Skip if already has a Supabase storage URL (meaning we already generated it)
            if (cert.preview_image && cert.preview_image.includes('supabase.co/storage')) {
                console.log('   ⏭️ Already has generated preview image, skipping...');
                results.skipped++;
                continue;
            }
            
            // Prepare certificate data for generation
            const certificateData = {
                firstName: "Your",
                lastName: "Name Here",
                shortName: cert.short_name || "CERT",
                fullName: cert.certificate_name || cert.name,
                uniqueId: `PREVIEW-${cert.id}-${Date.now()}`,
                date: "22 January 2026"
            };
            
            // 3. Generate certificate image
            const imageUrl = await generateCertificateImage(certificateData);
            if (!imageUrl) {
                console.log('   ❌ Failed to generate image');
                results.failed++;
                continue;
            }
            
            // 4. Upload to Supabase storage
            const filename = `preview-${cert.short_name || cert.id}.png`;
            const storageUrl = await uploadToSupabaseStorage(imageUrl, filename);
            if (!storageUrl) {
                console.log('   ❌ Failed to upload to storage');
                results.failed++;
                continue;
            }
            
            // 5. Update database
            const updated = await updateCertificatePreviewImage(cert.id, storageUrl);
            if (!updated) {
                console.log('   ❌ Failed to update database');
                results.failed++;
                continue;
            }
            
            console.log('   ✅ Certificate preview generated successfully!');
            results.success++;
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 6. Summary
        console.log('\n' + '='.repeat(50));
        console.log('📊 GENERATION SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ Successfully processed: ${results.success}`);
        console.log(`⏭️ Skipped (already exists): ${results.skipped}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📋 Total certificates: ${certificates.length}`);
        
        if (results.success > 0) {
            console.log('\n🎉 Certificate preview generation completed!');
            console.log('💡 The preview images are now stored permanently in Supabase storage');
            console.log('💡 Database has been updated with the new preview image URLs');
        }
        
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

// Add command line options
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
    console.log(`
Certificate Preview Generator
============================

This script generates actual preview images for role certificates using the Xano API
and stores them permanently in Supabase storage.

Usage:
  node scripts/generate-certificate-previews.mjs

Environment Variables Required:
  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key for database and storage access

What it does:
  1. Fetches all role certificates from the database
  2. Generates certificate images using demo data:
     - Name: "Your Name Here"  
     - Date: "22 January 2026"
  3. Uploads images to Supabase storage (certificate-previews bucket)
  4. Updates database with permanent storage URLs
  
Notes:
  - Images generated with temporary URLs (7 days) are downloaded and stored permanently
  - Existing non-placeholder previews are skipped (use --force to regenerate all)
  - Each generation has a 1-second delay to avoid rate limiting
`);
    process.exit(0);
}

// Create storage bucket if it doesn't exist
async function ensureStorageBucket() {
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            throw error;
        }
        
        const bucketExists = buckets.some(bucket => bucket.name === 'certificate-previews');
        
        if (!bucketExists) {
            console.log('📁 Creating certificate-previews storage bucket...');
            const { error: createError } = await supabase.storage.createBucket('certificate-previews', {
                public: true
            });
            
            if (createError) {
                throw createError;
            }
            
            console.log('✅ Storage bucket created successfully');
        }
    } catch (error) {
        console.error('❌ Failed to ensure storage bucket exists:', error.message);
        throw error;
    }
}

// Run the script
async function main() {
    try {
        await ensureStorageBucket();
        await generateAllCertificatePreviews();
    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
        process.exit(1);
    }
}

main();
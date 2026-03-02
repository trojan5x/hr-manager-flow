#!/usr/bin/env node

/**
 * Generate Missing Certificate Images
 * 
 * This script specifically generates and uploads certificate preview images
 * for certificates that have optimized URLs in the database but are missing 
 * from the storage bucket.
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
const OPTIMIZED_BUCKET = 'certificate-preview-optimized';

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
            console.log(`✅ Certificate generated successfully`);
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
        console.log(`📥 Downloading image...`);
        
        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        
        console.log(`📤 Uploading to Supabase storage: ${filename}`);
        
        // Upload to Supabase storage
        const { data, error } = await supabase.storage
            .from(OPTIMIZED_BUCKET)
            .upload(filename, imageBuffer, {
                contentType: 'image/png',
                upsert: true
            });
            
        if (error) {
            throw new Error(`Supabase upload error: ${error.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from(OPTIMIZED_BUCKET)
            .getPublicUrl(filename);
            
        console.log(`✅ Uploaded successfully`);
        return urlData.publicUrl;
        
    } catch (error) {
        console.error(`❌ Failed to upload to storage: ${error.message}`);
        return null;
    }
}

/**
 * Check if image exists in storage bucket
 */
async function imageExistsInStorage(filename) {
    try {
        const { data, error } = await supabase.storage
            .from(OPTIMIZED_BUCKET)
            .download(filename);
            
        return !error && data;
    } catch (error) {
        return false;
    }
}

/**
 * Generate missing certificate images
 */
async function generateMissingImages() {
    console.log('🚀 Generating Missing Certificate Preview Images');
    console.log('='.repeat(60) + '\n');
    
    try {
        // 1. Fetch all certificates that point to optimized storage
        console.log('📋 Fetching certificates with optimized URLs...');
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
            .like('preview_image', `%${OPTIMIZED_BUCKET}%`)
            .order('id');
            
        if (error) {
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
        
        if (!certificates || certificates.length === 0) {
            console.log('⚠️ No certificates with optimized URLs found');
            return;
        }
        
        console.log(`📋 Found ${certificates.length} certificates with optimized URLs\n`);
        
        // 2. Check which images are missing
        const missingImages = [];
        
        console.log('🔍 Checking which images exist in storage...');
        for (const cert of certificates) {
            const filename = `preview-${cert.short_name}.png`;
            const exists = await imageExistsInStorage(filename);
            
            if (!exists) {
                missingImages.push(cert);
                console.log(`   ❌ Missing: ${filename} (${cert.certificate_name || cert.name})`);
            } else {
                console.log(`   ✅ Exists: ${filename}`);
            }
        }
        
        console.log(`\n📊 Found ${missingImages.length} missing images to generate\n`);
        
        if (missingImages.length === 0) {
            console.log('🎉 All certificate images are already present in storage!');
            return;
        }
        
        // 3. Generate missing images
        const results = {
            success: 0,
            failed: 0
        };
        
        for (const cert of missingImages) {
            console.log(`🔄 Processing: ${cert.certificate_name || cert.name}`);
            console.log(`   Role: ${cert.roles?.role_name || 'Unknown'}`);
            console.log(`   Short Name: ${cert.short_name}`);
            
            // Prepare certificate data for generation
            const certificateData = {
                firstName: "Your",
                lastName: "Name Here",
                shortName: cert.short_name || "CERT",
                fullName: cert.certificate_name || cert.name,
                uniqueId: `PREVIEW-${cert.id}-${Date.now()}`,
                date: "22 January 2026"
            };
            
            // Generate certificate image
            const imageUrl = await generateCertificateImage(certificateData);
            if (!imageUrl) {
                console.log('   ❌ Failed to generate image\n');
                results.failed++;
                continue;
            }
            
            // Upload to Supabase storage
            const filename = `preview-${cert.short_name}.png`;
            const storageUrl = await uploadToSupabaseStorage(imageUrl, filename);
            if (!storageUrl) {
                console.log('   ❌ Failed to upload to storage\n');
                results.failed++;
                continue;
            }
            
            console.log(`   ✅ Successfully generated and uploaded!\n`);
            results.success++;
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 4. Summary
        console.log('='.repeat(60));
        console.log('📊 GENERATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully generated: ${results.success}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📋 Total missing images: ${missingImages.length}`);
        
        if (results.success > 0) {
            console.log('\n🎉 Missing certificate images generated successfully!');
            console.log('💡 All new role certificates now have preview images');
            console.log('💡 Database URLs already point to the correct locations');
        }
        
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

// Run the script
generateMissingImages().catch(error => {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
});
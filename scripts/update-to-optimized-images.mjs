#!/usr/bin/env node

/**
 * Update Certificate URLs to Optimized Images
 * 
 * This script updates all certificate preview URLs in the database
 * to point to the new optimized images bucket instead of the original larger images.
 */

import { createClient } from '@supabase/supabase-js';
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

// UPDATE THESE VALUES WITH YOUR NEW BUCKET DETAILS
const OLD_BUCKET_PATH = 'certificate-previews';
const NEW_BUCKET_PATH = 'certificate-preview-optimized'; // Updated with your bucket name
const BASE_STORAGE_URL = 'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public';

/**
 * Convert old URL to new optimized URL
 */
function convertToOptimizedUrl(oldUrl, shortName) {
    // If it's already pointing to the old bucket, replace it
    if (oldUrl.includes(`${BASE_STORAGE_URL}/${OLD_BUCKET_PATH}/`)) {
        return oldUrl.replace(`${BASE_STORAGE_URL}/${OLD_BUCKET_PATH}/`, `${BASE_STORAGE_URL}/${NEW_BUCKET_PATH}/`);
    }
    
    // Otherwise, construct the new URL from the certificate short name
    return `${BASE_STORAGE_URL}/${NEW_BUCKET_PATH}/preview-${shortName}.png`;
}

/**
 * Update all certificate URLs to use optimized images
 */
async function updateToOptimizedImages() {
    console.log('🔧 Updating Certificate URLs to Optimized Images');
    console.log('='.repeat(60));
    console.log(`📁 Old bucket: ${OLD_BUCKET_PATH}`);
    console.log(`📁 New bucket: ${NEW_BUCKET_PATH}`);
    console.log('='.repeat(60) + '\n');
    
    try {
        // 1. Fetch all role certificates
        console.log('📋 Fetching all role certificates...');
        const { data: certificates, error } = await supabase
            .from('role_certificates')
            .select('id, short_name, preview_image, name')
            .order('id');
            
        if (error) {
            throw new Error(`Failed to fetch certificates: ${error.message}`);
        }
        
        if (!certificates || certificates.length === 0) {
            console.log('⚠️ No certificates found in database');
            return;
        }
        
        console.log(`📋 Found ${certificates.length} certificates to update\n`);
        
        // 2. Process each certificate
        const results = {
            success: 0,
            failed: 0,
            skipped: 0
        };
        
        for (const cert of certificates) {
            const newUrl = convertToOptimizedUrl(cert.preview_image, cert.short_name);
            
            console.log(`🔄 Processing: ${cert.name || cert.short_name}`);
            console.log(`   Short Name: ${cert.short_name}`);
            console.log(`   Current URL: ${cert.preview_image}`);
            console.log(`   New URL: ${newUrl}`);
            
            // Skip if URL hasn't changed (already optimized)
            if (cert.preview_image === newUrl) {
                console.log('   ⏭️ Already using optimized URL, skipping...\n');
                results.skipped++;
                continue;
            }
            
            // Update database
            try {
                const { error: updateError } = await supabase
                    .from('role_certificates')
                    .update({ 
                        preview_image: newUrl
                    })
                    .eq('id', cert.id);
                    
                if (updateError) {
                    throw new Error(`Database update error: ${updateError.message}`);
                }
                
                console.log(`   ✅ Successfully updated certificate ID ${cert.id}`);
                results.success++;
                
            } catch (error) {
                console.error(`   ❌ Failed to update certificate ID ${cert.id}: ${error.message}`);
                results.failed++;
            }
            
            console.log('');
            
            // Small delay to avoid overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 3. Summary
        console.log('='.repeat(60));
        console.log('📊 UPDATE SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Successfully updated: ${results.success}`);
        console.log(`⏭️ Skipped (already optimized): ${results.skipped}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📋 Total certificates: ${certificates.length}`);
        
        if (results.success > 0) {
            console.log('\n🎉 Database URLs updated to optimized images!');
            console.log('💡 All certificates now point to the smaller, faster-loading images');
            console.log('💡 Users will experience improved page load times');
        }
        
        if (results.failed > 0) {
            console.log('\n⚠️  Some updates failed. Please check the error messages above.');
        }
        
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

/**
 * Verify optimized images exist in the new bucket
 */
async function verifyOptimizedImages() {
    console.log('\n🔍 Verifying optimized images exist...');
    
    try {
        const { data: files, error } = await supabase.storage
            .from(NEW_BUCKET_PATH)
            .list();
            
        if (error) {
            throw error;
        }
        
        console.log(`📁 Found ${files.length} files in optimized bucket`);
        
        // Show first few files as examples
        const sampleFiles = files.slice(0, 5);
        console.log('📄 Sample files:');
        sampleFiles.forEach(file => {
            console.log(`   - ${file.name}`);
        });
        
        if (files.length < 65) {
            console.log(`⚠️  Warning: Expected 65 files but found ${files.length}`);
            console.log('💡 Make sure all optimized images are uploaded before running the update');
        } else {
            console.log('✅ Optimized images appear to be ready');
        }
        
    } catch (error) {
        console.error('❌ Failed to verify optimized images:', error.message);
        console.log('💡 Make sure the optimized bucket exists and contains the images');
        return false;
    }
    
    return true;
}

// Command line options
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const verifyOnly = args.includes('--verify');

if (showHelp) {
    console.log(`
Certificate URL Optimizer
=========================

Updates all certificate preview URLs to point to optimized (smaller) images.

Usage:
  node update-to-optimized-images.mjs [options]

Options:
  --verify    Only verify that optimized images exist, don't update database
  --help      Show this help message

Before running:
1. Update NEW_BUCKET_PATH in this script with your optimized bucket name
2. Ensure all optimized images are uploaded to the new bucket
3. Run with --verify first to check everything is ready

What it does:
- Fetches all certificate records from the database
- Updates preview_image URLs to point to optimized bucket
- Preserves the same filename structure (preview-{shortName}.png)
- Provides detailed progress and summary reporting
`);
    process.exit(0);
}

// Main execution
async function main() {
    try {
        if (verifyOnly) {
            await verifyOptimizedImages();
        } else {
            const verified = await verifyOptimizedImages();
            if (verified) {
                console.log('\n🚀 Starting database update...\n');
                await updateToOptimizedImages();
            } else {
                console.log('\n❌ Verification failed. Please fix issues before updating database.');
                process.exit(1);
            }
        }
    } catch (error) {
        console.error('❌ Script execution failed:', error.message);
        process.exit(1);
    }
}

main();
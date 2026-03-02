#!/usr/bin/env node

/**
 * Fix Certificate Database URLs
 * 
 * This script manually updates the database preview_image URLs for the certificates
 * that were successfully uploaded to storage but failed to update in the database.
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

// The certificates that were successfully uploaded to storage
const certificateUpdates = [
    {
        id: 201,
        short_name: 'COPx',
        storage_url: 'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-previews/preview-COPx.png',
        name: 'Certified Operations Professional'
    },
    {
        id: 202,
        short_name: 'SCESx',
        storage_url: 'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-previews/preview-SCESx.png',
        name: 'Supply Chain Excellence Specialist'
    },
    {
        id: 203,
        short_name: 'QMSEx',
        storage_url: 'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-previews/preview-QMSEx.png',
        name: 'Quality Management Systems Expert'
    },
    {
        id: 204,
        short_name: 'OAPx',
        storage_url: 'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-previews/preview-OAPx.png',
        name: 'Operations Analytics Professional'
    },
    {
        id: 205,
        short_name: 'SOLx',
        storage_url: 'https://pndqvtuejuxanhzvuwoh.supabase.co/storage/v1/object/public/certificate-previews/preview-SOLx.png',
        name: 'Strategic Operations Leadership'
    }
];

async function updateCertificateUrls() {
    console.log('🔧 Fixing Certificate Database URLs');
    console.log('=====================================\n');
    
    const results = {
        success: 0,
        failed: 0
    };
    
    for (const cert of certificateUpdates) {
        console.log(`🔄 Updating ${cert.name} (${cert.short_name})...`);
        
        try {
            const { error } = await supabase
                .from('role_certificates')
                .update({ 
                    preview_image: cert.storage_url
                })
                .eq('id', cert.id);
                
            if (error) {
                throw new Error(`Database update error: ${error.message}`);
            }
            
            console.log(`   ✅ Successfully updated certificate ID ${cert.id}`);
            console.log(`   🔗 New URL: ${cert.storage_url}`);
            results.success++;
            
        } catch (error) {
            console.error(`   ❌ Failed to update certificate ID ${cert.id}: ${error.message}`);
            results.failed++;
        }
        
        console.log('');
    }
    
    // Summary
    console.log('='.repeat(50));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${results.success}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📋 Total certificates: ${certificateUpdates.length}`);
    
    if (results.success > 0) {
        console.log('\n🎉 Database URLs updated successfully!');
        console.log('💡 The Operations Manager certificates now have actual preview images');
        console.log('💡 You can verify this by checking the role_certificates table or viewing the app');
    }
    
    if (results.failed > 0) {
        console.log('\n⚠️  Some updates failed. Please check the error messages above.');
    }
}

// Run the update
updateCertificateUrls().catch(error => {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
});
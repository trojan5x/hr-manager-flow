#!/usr/bin/env node

/**
 * Certificate Preview Generator Runner
 * 
 * This script can be run from the project root to generate certificate preview images.
 * It automatically handles the script directory setup and execution.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const PACKAGE_JSON = path.join(SCRIPTS_DIR, 'package.json');

console.log('🚀 Certificate Preview Generator');
console.log('================================\n');

// Check if running from project root
if (!existsSync('src/services/supabaseClient.ts')) {
    console.error('❌ This script must be run from the project root directory');
    process.exit(1);
}

// Check environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.error('💡 Set it in your .env file or export it before running:');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    process.exit(1);
}

try {
    // Install dependencies if node_modules doesn't exist
    if (!existsSync(path.join(SCRIPTS_DIR, 'node_modules'))) {
        console.log('📦 Installing script dependencies...');
        execSync('npm install', { 
            cwd: SCRIPTS_DIR, 
            stdio: 'inherit' 
        });
        console.log('✅ Dependencies installed\n');
    }
    
    // Run the certificate preview generator
    console.log('🎨 Starting certificate preview generation...\n');
    execSync('node generate-certificate-previews.mjs', { 
        cwd: SCRIPTS_DIR, 
        stdio: 'inherit',
        env: { ...process.env }
    });
    
} catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
}
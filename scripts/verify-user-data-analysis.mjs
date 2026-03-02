#!/usr/bin/env node

/**
 * Verification Script: Analyze User Data and Foreign Key Relationships
 * 
 * This script connects to the specialized-main Supabase database and:
 * 1. Counts rows in all user data tables
 * 2. Counts rows in all system configuration tables
 * 3. Analyzes foreign key dependencies for safe deletion order
 * 4. Provides a detailed report before any deletion occurs
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://pndqvtuejuxanhzvuwoh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZHF2dHVlanV4YW5oenZ1d29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjIzODgsImV4cCI6MjA4NTMzODM4OH0.7_ZiCYTQzhSgspHcs25cS5t5iK0jV1CjrM0bAg3_-Wk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tables to be DELETED (user data)
const USER_DATA_TABLES = [
  'users',
  'sessions', 
  'user_assessments',
  'user_certificates',
  'orders',
  'purchases',
  'payments',
  'tracking_events'
];

// Tables to be PRESERVED (system configuration)
const SYSTEM_CONFIG_TABLES = [
  'roles',
  'assessments',
  'assessment_phases', 
  'assessment_questions',
  'role_certificates',
  'role_landing_pages',
  'scenarios',
  'questions'
];

// Deletion order based on foreign key dependencies
const DELETION_ORDER = [
  'payments',        // references orders
  'purchases',       // references orders and role_certificates
  'user_certificates', // references users, sessions, roles
  'user_assessments',   // references users, sessions, assessments
  'orders',         // references users, sessions
  'sessions',       // references users
  'users',          // main user table
  'tracking_events' // standalone
];

async function countTableRows(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Error counting ${tableName}:`, error.message);
      return null;
    }
    
    return count;
  } catch (err) {
    console.error(`❌ Exception counting ${tableName}:`, err.message);
    return null;
  }
}

async function analyzeUserDataTables() {
  console.log('\n📊 USER DATA TABLES (TO BE DELETED):');
  console.log('=====================================');
  
  let totalUserRows = 0;
  const userDataCounts = {};
  
  for (const table of USER_DATA_TABLES) {
    const count = await countTableRows(table);
    userDataCounts[table] = count;
    
    if (count !== null) {
      totalUserRows += count;
      console.log(`📋 ${table.padEnd(18)} : ${count.toString().padStart(4)} rows`);
    }
  }
  
  console.log(`\n🗂️  Total user data rows: ${totalUserRows}`);
  return userDataCounts;
}

async function analyzeSystemConfigTables() {
  console.log('\n🔧 SYSTEM CONFIG TABLES (TO BE PRESERVED):');
  console.log('==========================================');
  
  let totalSystemRows = 0;
  const systemConfigCounts = {};
  
  for (const table of SYSTEM_CONFIG_TABLES) {
    const count = await countTableRows(table);
    systemConfigCounts[table] = count;
    
    if (count !== null) {
      totalSystemRows += count;
      console.log(`📋 ${table.padEnd(18)} : ${count.toString().padStart(4)} rows`);
    }
  }
  
  console.log(`\n🏗️  Total system config rows: ${totalSystemRows}`);
  return systemConfigCounts;
}

async function verifyForeignKeyDependencies() {
  console.log('\n🔗 FOREIGN KEY DEPENDENCY VERIFICATION:');
  console.log('======================================');
  
  // Check some key foreign key relationships
  const checks = [
    {
      name: 'payments → orders',
      query: `
        SELECT COUNT(*) as orphaned_payments 
        FROM payments p 
        LEFT JOIN orders o ON p.order_id = o.id 
        WHERE p.order_id IS NOT NULL AND o.id IS NULL
      `
    },
    {
      name: 'purchases → orders',
      query: `
        SELECT COUNT(*) as orphaned_purchases 
        FROM purchases p 
        LEFT JOIN orders o ON p.order_id = o.id 
        WHERE p.order_id IS NOT NULL AND o.id IS NULL
      `
    },
    {
      name: 'user_certificates → users',
      query: `
        SELECT COUNT(*) as orphaned_certificates 
        FROM user_certificates uc 
        LEFT JOIN users u ON uc.user_id = u.id 
        WHERE uc.user_id IS NOT NULL AND u.id IS NULL
      `
    },
    {
      name: 'sessions → users',
      query: `
        SELECT COUNT(*) as orphaned_sessions 
        FROM sessions s 
        LEFT JOIN users u ON s.user_id = u.id 
        WHERE s.user_id IS NOT NULL AND u.id IS NULL
      `
    }
  ];
  
  for (const check of checks) {
    try {
      const { data, error } = await supabase.rpc('execute_sql_query', {
        query: check.query
      });
      
      if (error) {
        console.log(`⚠️  ${check.name.padEnd(25)} : Unable to verify (${error.message})`);
      } else if (data && data.length > 0) {
        const orphaned = Object.values(data[0])[0];
        if (orphaned > 0) {
          console.log(`❌ ${check.name.padEnd(25)} : ${orphaned} orphaned records found!`);
        } else {
          console.log(`✅ ${check.name.padEnd(25)} : No orphaned records`);
        }
      }
    } catch (err) {
      console.log(`⚠️  ${check.name.padEnd(25)} : Unable to verify (${err.message})`);
    }
  }
}

function displayDeletionOrder() {
  console.log('\n🗂️  PLANNED DELETION ORDER:');
  console.log('===========================');
  
  DELETION_ORDER.forEach((table, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${table}`);
  });
  
  console.log('\nThis order respects foreign key dependencies to prevent constraint violations.');
}

async function generateSummaryReport(userDataCounts, systemConfigCounts) {
  console.log('\n📋 DELETION SUMMARY REPORT:');
  console.log('============================');
  
  const totalUserRows = Object.values(userDataCounts).reduce((sum, count) => sum + (count || 0), 0);
  const totalSystemRows = Object.values(systemConfigCounts).reduce((sum, count) => sum + (count || 0), 0);
  
  console.log(`📊 Total rows to be DELETED: ${totalUserRows}`);
  console.log(`🔒 Total rows to be PRESERVED: ${totalSystemRows}`);
  
  console.log('\n🎯 TABLES WITH DATA TO DELETE:');
  Object.entries(userDataCounts)
    .filter(([table, count]) => count > 0)
    .forEach(([table, count]) => {
      console.log(`   • ${table}: ${count} rows`);
    });
  
  console.log('\n✨ EMPTY TABLES (no action needed):');
  Object.entries(userDataCounts)
    .filter(([table, count]) => count === 0)
    .forEach(([table, count]) => {
      console.log(`   • ${table}: ${count} rows`);
    });
}

async function main() {
  console.log('🔍 SUPABASE USER DATA VERIFICATION SCRIPT');
  console.log('==========================================');
  console.log('Project: specialized-main');
  console.log('Database: pndqvtuejuxanhzvuwoh.supabase.co');
  console.log('Mode: READ-ONLY VERIFICATION\n');
  
  try {
    // Test connection
    const { data, error } = await supabase
      .from('roles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Failed to connect to database:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Successfully connected to Supabase');
    
    // Analyze tables
    const userDataCounts = await analyzeUserDataTables();
    const systemConfigCounts = await analyzeSystemConfigTables();
    
    // Verify foreign keys
    await verifyForeignKeyDependencies();
    
    // Display deletion order
    displayDeletionOrder();
    
    // Generate summary
    await generateSummaryReport(userDataCounts, systemConfigCounts);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('==============');
    console.log('1. Review the above analysis carefully');
    console.log('2. Ensure foreign key relationships are correct');
    console.log('3. Run the deletion script if everything looks good');
    console.log('4. The deletion script will follow the specified order');
    
    console.log('\n✅ Verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
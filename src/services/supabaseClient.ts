
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://api-supabase.learntube.ai';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZHF2dHVlanV4YW5oenZ1d29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjIzODgsImV4cCI6MjA4NTMzODM4OH0.7_ZiCYTQzhSgspHcs25cS5t5iK0jV1CjrM0bAg3_-Wk';

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

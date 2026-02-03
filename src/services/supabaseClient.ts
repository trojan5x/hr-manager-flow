
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://donoanvhtmcbtlpfumqb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvbm9hbnZodG1jYnRscGZ1bXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTA4NzEsImV4cCI6MjA4MzUyNjg3MX0.OQ2sqEDuq4b4h3kukYxysQIARAsJwdTEqso5fUqHG1I';

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

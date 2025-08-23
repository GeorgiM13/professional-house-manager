import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vjwxfbvmznvrfcaekqqo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqd3hmYnZtem52cmZjYWVrcXFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjA0ODYsImV4cCI6MjA3MDczNjQ4Nn0.pKhoB68TGuXe6PiXifpxkrSU-ZVFro9Qy7cEvNQ1KpM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
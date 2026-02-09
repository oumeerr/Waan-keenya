
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://swyviqimammonokkneqk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eXZpcWltYW1tb25va2tuZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mjc2NTQsImV4cCI6MjA4NjIwMzY1NH0.Pb50OIcw0QdnI1WQl7oGLVZK7VWWcalRoEoLqQLKr8s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

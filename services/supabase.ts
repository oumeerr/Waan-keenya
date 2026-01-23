
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vgpwuopwgsemsaoyqytt.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZncHd1b3B3Z3NlbXNhb3lxeXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mjg2MzksImV4cCI6MjA4NDQwNDYzOX0.ADYBQUEgMFTByGWRTNEjCahj0CM12ImM0zY9dqk2Bls';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://scjumzbcovmtgzjxgisn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a5Yv8rBIbmQaNflZDXM5cA_QIacFQHI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

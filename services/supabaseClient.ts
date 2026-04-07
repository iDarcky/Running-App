import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://scjumzbcovmtgzjxgisn.supabase.co'
const supabaseKey = 'sb_publishable_a5Yv8rBIbmQaNflZDXM5cA_QIacFQHI'

export const supabase = createClient(supabaseUrl, supabaseKey)

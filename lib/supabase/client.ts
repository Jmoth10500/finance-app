import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Named export expected by pages: { supabaseBrowser }
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)

// Optional default export so `import supabaseBrowser from ...` also works
export default supabaseBrowser

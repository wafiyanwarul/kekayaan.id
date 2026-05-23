import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './supabase/env'

export function createClient() {
  const { key, url } = getSupabaseConfig()

  return createBrowserClient(url, key)
}

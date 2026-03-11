// © Danial Mohmad — All Rights Reserved
// Single Supabase client instance for the entire app.
// Import this — never call createClient() elsewhere.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file.\n" +
    "Copy frontend/.env.example → frontend/.env and fill in your Supabase project values."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // stored in localStorage automatically
    autoRefreshToken: true,        // handles token rotation silently
    detectSessionInUrl: true,      // handles magic-link / OAuth callbacks
  },
});

export default supabase;

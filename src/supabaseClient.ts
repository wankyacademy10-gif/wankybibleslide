import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || "https://kqlhlmoaplnckkmdxsqo.supabase.co";
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxbGhsbW9hcGxuY2trbWR4c3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDcxMTcsImV4cCI6MjA4NzM4MzExN30.CIqXcDgSowFzaDeTA07ySzv7dJB29IRYnwQy09CZqKw";

export const supabase = createClient(supabaseUrl, supabaseKey);

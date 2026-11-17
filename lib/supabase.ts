import { createClient } from "@supabase/supabase-js";

// KLien dengan kunci PUBLIK (publishable key). Aman dibaca orang Lain,
// dan hanya bisa melakukan apa yang diizinkan oleh aturan di database.
export const supabase = createClient(
process.env. SUPABASE_URL!,
process.env. SUPABASE_PUBLISHABLE_KEY!,
);
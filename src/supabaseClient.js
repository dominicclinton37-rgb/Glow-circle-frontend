import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pwgsoxuqpxdmrhjphwav.supabase.co";
const supabaseAnonKey = "sb_publishable_0RCxN5sm289PZDckdZw3eQ_f28kYVp4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

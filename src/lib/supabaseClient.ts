import { createClient } from '@supabase/supabase-js';

// For development/testing purposes
const FALLBACK_SUPABASE_URL = 'https://nfnbdiymakeppwviwgtd.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbmJkaXltYWtlcHB3dml3Z3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Njc1MTEsImV4cCI6MjA2NjA0MzUxMX0.IJBYj2k8l1Y5ekGcnhFob1eYx4TbKNS1SvdEZEtL2Rs';

// Get environment variables, ensuring they're valid URLs or use fallbacks
const getValidUrl = (url: string | undefined): string => {
    if (!url) return FALLBACK_SUPABASE_URL;

    try {
        // Test if the URL is valid by constructing a URL object
        new URL(url);
        return url;
    } catch (error) {
        console.warn('Invalid Supabase URL provided, using fallback URL');
        return FALLBACK_SUPABASE_URL;
    }
};

const supabaseUrl = getValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

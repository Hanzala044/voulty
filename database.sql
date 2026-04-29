-- Copy and paste this into the Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.infrastructure_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  image_url TEXT,
  issue_type TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  address TEXT,
  status TEXT DEFAULT 'pending',
  sender_phone TEXT
);

-- Enable Row Level Security (RLS) but allow anonymous inserts and updates for this backend integration
ALTER TABLE public.infrastructure_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" 
ON public.infrastructure_reports FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anonymous updates" 
ON public.infrastructure_reports FOR UPDATE 
TO anon 
USING (true);

CREATE POLICY "Allow anonymous selects" 
ON public.infrastructure_reports FOR SELECT 
TO anon 
USING (true);

-- Ensure the 'road-reports' bucket exists in Supabase Storage.
-- You can create it via the Supabase Dashboard -> Storage -> New Bucket.
-- Make sure it is a PUBLIC bucket so images can be viewed.

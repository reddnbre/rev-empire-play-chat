-- Add missing columns to existing ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS detailed_info TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS banner_image TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS show_popup BOOLEAN DEFAULT false;
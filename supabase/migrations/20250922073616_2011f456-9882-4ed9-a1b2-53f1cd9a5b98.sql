-- Drop existing restrictive policy and create a simple one for public viewing
DROP POLICY IF EXISTS "Everyone can view active ads" ON public.ads;

-- Create a simple policy that allows anonymous users to view active ads
CREATE POLICY "Allow anonymous users to view active ads" 
ON public.ads 
FOR SELECT 
TO public, anon, authenticated
USING (
  is_active = true 
  AND start_date <= now() 
  AND (end_date IS NULL OR end_date >= now())
);
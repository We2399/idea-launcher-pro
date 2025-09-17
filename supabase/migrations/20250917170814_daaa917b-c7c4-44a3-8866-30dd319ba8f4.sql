-- Fix the RLS policy to allow users to complete their initial profile setup
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  (auth.uid() = user_id) AND (
    (profile_completed IS FALSE OR profile_completed IS NULL) OR 
    initial_setup_completed_at IS NULL
  )
);
-- Safely replace the UPDATE policy on public.profiles to allow completing setup
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate with strict USING and permissive WITH CHECK
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = user_id) AND (
    (profile_completed IS FALSE OR profile_completed IS NULL) OR 
    initial_setup_completed_at IS NULL
  )
)
WITH CHECK (
  auth.uid() = user_id
);

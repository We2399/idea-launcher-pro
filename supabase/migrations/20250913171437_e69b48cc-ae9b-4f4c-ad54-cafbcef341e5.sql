-- Add profile completion tracking columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS initial_setup_completed_at timestamp with time zone;

-- Update existing profiles to mark them as completed (data migration)
UPDATE public.profiles 
SET profile_completed = true, 
    initial_setup_completed_at = created_at 
WHERE profile_completed IS NULL OR profile_completed = false;
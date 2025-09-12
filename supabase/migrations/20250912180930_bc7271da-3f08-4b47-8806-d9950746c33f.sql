BEGIN;

-- Validate leave requests to prevent overlapping dates and invalid ranges
CREATE OR REPLACE FUNCTION public.validate_leave_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  overlap_exists boolean;
BEGIN
  -- Ensure end_date is not before start_date
  IF NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'End date (%) cannot be before start date (%)', NEW.end_date, NEW.start_date USING ERRCODE = '22007';
  END IF;

  -- Only check overlaps for relevant statuses
  IF NEW.status IN ('pending','approved','senior_approved') THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.leave_requests lr
      WHERE lr.user_id = NEW.user_id
        AND lr.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND lr.status IN ('pending','approved','senior_approved')
        AND NOT (NEW.end_date < lr.start_date OR NEW.start_date > lr.end_date)
    ) INTO overlap_exists;

    IF overlap_exists THEN
      RAISE EXCEPTION 'Overlapping leave request exists for selected dates' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to leave_requests
DROP TRIGGER IF EXISTS trg_validate_leave_request ON public.leave_requests;
CREATE TRIGGER trg_validate_leave_request
BEFORE INSERT OR UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_leave_request();

-- Allow managers to view team profile change requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profile_change_requests' 
      AND policyname = 'Managers can view team change requests'
  ) THEN
    CREATE POLICY "Managers can view team change requests"
      ON public.profile_change_requests
      FOR SELECT
      USING (
        is_manager(auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = profile_change_requests.user_id
            AND p.manager_id = auth.uid()
        )
      );
  END IF;
END $$;

COMMIT;
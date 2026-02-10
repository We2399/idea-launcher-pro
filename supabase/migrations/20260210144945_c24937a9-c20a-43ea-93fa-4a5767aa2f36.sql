-- Fix: cast new_value to proper type for date columns to avoid "column is of type date but expression is of type text" error
CREATE OR REPLACE FUNCTION public.apply_approved_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  field_whitelist TEXT[] := ARRAY[
    'first_name', 'last_name', 'phone_number', 'home_address', 'date_of_birth',
    'marital_status', 'emergency_contact_name', 'emergency_contact_phone',
    'id_number', 'passport_number', 'visa_number', 'department', 'position'
  ];
  date_fields TEXT[] := ARRAY['date_of_birth'];
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Check if field is in whitelist
    IF NEW.field_name = ANY(field_whitelist) THEN
      -- For date fields, cast the text value to date
      IF NEW.field_name = ANY(date_fields) THEN
        EXECUTE format(
          'UPDATE public.profiles SET %I = $1::date, updated_at = now() WHERE user_id = $2',
          NEW.field_name
        ) USING NEW.new_value, NEW.user_id;
      ELSE
        EXECUTE format(
          'UPDATE public.profiles SET %I = $1, updated_at = now() WHERE user_id = $2',
          NEW.field_name
        ) USING NEW.new_value, NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
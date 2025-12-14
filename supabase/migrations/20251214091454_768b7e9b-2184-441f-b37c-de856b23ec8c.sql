
-- Fix WS ORR user: create organization, profile, and role

-- 1. Create the organization for the employer
INSERT INTO public.organizations (name, organization_type, owner_id, subscription_tier, max_employees)
VALUES ('Birmingham', 'individual', '113ce072-1b4d-4c0a-80e1-cc6b7234642f', 'free', 1);

-- 2. Create the profile with organization_id
INSERT INTO public.profiles (user_id, first_name, last_name, email, is_employer, organization_id)
SELECT 
  '113ce072-1b4d-4c0a-80e1-cc6b7234642f',
  'WS',
  'ORR',
  'wilson@birminghamfood.com.hk',
  true,
  id
FROM public.organizations 
WHERE owner_id = '113ce072-1b4d-4c0a-80e1-cc6b7234642f';

-- 3. Create organization member entry
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
  id,
  '113ce072-1b4d-4c0a-80e1-cc6b7234642f',
  'owner'
FROM public.organizations 
WHERE owner_id = '113ce072-1b4d-4c0a-80e1-cc6b7234642f';

-- 4. Create user role as hr_admin (employer role)
INSERT INTO public.user_roles (user_id, role)
VALUES ('113ce072-1b4d-4c0a-80e1-cc6b7234642f', 'hr_admin');

-- 5. Fix the handle_new_user trigger - ensure it's attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

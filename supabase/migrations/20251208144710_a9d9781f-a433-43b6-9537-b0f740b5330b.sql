-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('free', 'mini', 'sme', 'enterprise');

-- Create organization type enum
CREATE TYPE public.organization_type AS ENUM ('individual', 'company');

-- Create invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Organizations table (employers/companies)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization_type organization_type NOT NULL DEFAULT 'individual',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  max_employees INTEGER NOT NULL DEFAULT 1,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization members table (links employees to organizations)
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID,
  UNIQUE(organization_id, user_id)
);

-- Employee invitations table
CREATE TABLE public.employee_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invitation_code TEXT NOT NULL UNIQUE DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  email TEXT,
  status invitation_status NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  accepted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE
);

-- Subscription pricing reference table
CREATE TABLE public.subscription_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier subscription_tier NOT NULL UNIQUE,
  min_employees INTEGER NOT NULL,
  max_employees INTEGER NOT NULL,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing tiers
INSERT INTO public.subscription_pricing (tier, min_employees, max_employees, monthly_price, description) VALUES
  ('free', 1, 1, 0, 'One-to-one: Domestic helper and employer - Free'),
  ('mini', 2, 5, 9.99, 'Mini size company: 2-5 employees'),
  ('sme', 6, 20, 29.99, 'SME size company: 6-20 employees'),
  ('enterprise', 21, 50, 79.99, 'Enterprise company: 21-50 employees');

-- Add organization_id to profiles
ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN is_employer BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_pricing ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (owner_id = auth.uid() OR id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Owners can update their organization"
  ON public.organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Administrators can manage all organizations"
  ON public.organizations FOR ALL
  USING (is_administrator(auth.uid()));

-- Organization members policies
CREATE POLICY "Members can view their organization members"
  ON public.organization_members FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Organization owners can manage members"
  ON public.organization_members FOR ALL
  USING (organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Administrators can manage all members"
  ON public.organization_members FOR ALL
  USING (is_administrator(auth.uid()));

-- Invitations policies
CREATE POLICY "Organization owners can manage invitations"
  ON public.employee_invitations FOR ALL
  USING (organization_id IN (
    SELECT id FROM public.organizations WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can view invitation by code for joining"
  ON public.employee_invitations FOR SELECT
  USING (status = 'pending' AND expires_at > now());

CREATE POLICY "Authenticated users can accept invitations"
  ON public.employee_invitations FOR UPDATE
  USING (status = 'pending' AND expires_at > now())
  WITH CHECK (accepted_by = auth.uid());

CREATE POLICY "Administrators can manage all invitations"
  ON public.employee_invitations FOR ALL
  USING (is_administrator(auth.uid()));

-- Subscription pricing is readable by all authenticated users
CREATE POLICY "All authenticated users can view pricing"
  ON public.subscription_pricing FOR SELECT
  USING (is_active = true);

CREATE POLICY "Administrators can manage pricing"
  ON public.subscription_pricing FOR ALL
  USING (is_administrator(auth.uid()));

-- Function to check employee count and update subscription tier
CREATE OR REPLACE FUNCTION public.check_organization_capacity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  org_max INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM public.organization_members
  WHERE organization_id = NEW.organization_id;
  
  SELECT max_employees INTO org_max
  FROM public.organizations
  WHERE id = NEW.organization_id;
  
  IF current_count >= org_max THEN
    RAISE EXCEPTION 'Organization has reached maximum employee capacity. Please upgrade subscription.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to check capacity before adding members
CREATE TRIGGER check_org_capacity_before_insert
  BEFORE INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_organization_capacity();

-- Update timestamp trigger for organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Add industry_type column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN industry_type TEXT DEFAULT 'household' 
CHECK (industry_type IN ('household', 'business'));

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.industry_type IS 'Type of industry: household (domestic helpers) or business (SE/SME employees)';
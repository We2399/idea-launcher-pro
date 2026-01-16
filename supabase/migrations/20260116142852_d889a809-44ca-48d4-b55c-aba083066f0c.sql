-- Add language_code column to store translations
ALTER TABLE public.public_holidays 
ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en';

-- Add a source_import_id to link translations together
ALTER TABLE public.public_holidays 
ADD COLUMN IF NOT EXISTS source_import_id UUID;

-- Create index for efficient querying by language
CREATE INDEX IF NOT EXISTS idx_public_holidays_language ON public.public_holidays(language_code);

-- Create index for grouping translations
CREATE INDEX IF NOT EXISTS idx_public_holidays_source_import ON public.public_holidays(source_import_id);
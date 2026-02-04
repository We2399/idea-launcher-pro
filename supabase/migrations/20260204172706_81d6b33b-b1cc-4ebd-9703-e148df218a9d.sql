-- Create device_tokens table for storing FCM push notification tokens
CREATE TABLE public.device_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own device tokens"
ON public.device_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own device tokens"
ON public.device_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own device tokens"
ON public.device_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own device tokens"
ON public.device_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_device_tokens_user_id ON public.device_tokens(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_device_tokens_updated_at
BEFORE UPDATE ON public.device_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
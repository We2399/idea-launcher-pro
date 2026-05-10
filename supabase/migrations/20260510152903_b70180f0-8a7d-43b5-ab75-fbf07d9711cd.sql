
-- Add voice message support to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Allow content to be empty for voice messages (drop NOT NULL if exists; fall back to keeping empty string)
ALTER TABLE public.chat_messages ALTER COLUMN content DROP NOT NULL;

-- Validation: voice messages must have audio_url
CREATE OR REPLACE FUNCTION public.validate_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.message_type = 'voice' THEN
    IF NEW.audio_url IS NULL OR length(NEW.audio_url) = 0 THEN
      RAISE EXCEPTION 'Voice messages require an audio_url';
    END IF;
  ELSIF NEW.message_type = 'text' THEN
    IF NEW.content IS NULL OR length(trim(NEW.content)) = 0 THEN
      RAISE EXCEPTION 'Text messages require non-empty content';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid message_type: %', NEW.message_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_messages_validate ON public.chat_messages;
CREATE TRIGGER chat_messages_validate
  BEFORE INSERT OR UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_chat_message();

-- Create private storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for voice-messages bucket
-- Path convention: {sender_id}/{receiver_id}/{filename}
-- Sender uploads to their own folder
CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-messages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Sender or receiver can read
CREATE POLICY "Sender or receiver can read voice messages"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.uid()::text = (storage.foldername(name))[2]
    OR is_administrator(auth.uid())
    OR is_hr_admin(auth.uid())
  )
);

-- Sender can delete
CREATE POLICY "Sender can delete their voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-messages'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

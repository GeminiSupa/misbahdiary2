-- Team Messaging System
-- Adds messaging functionality for team members to communicate

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- If recipient_id is NULL, it's a group message to all firm members
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS messages_firm_id_idx ON public.messages(firm_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_recipient_id_idx ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_firm_recipient_idx ON public.messages(firm_id, recipient_id);
CREATE INDEX IF NOT EXISTS messages_unread_idx ON public.messages(recipient_id, is_read) WHERE is_read = false;

-- RLS Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their firm
DROP POLICY IF EXISTS "Firm members can view messages" ON public.messages;
CREATE POLICY "Firm members can view messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.firm_id = messages.firm_id
      AND profiles.id = auth.uid()
    )
  );

-- Users can send messages to their firm members
DROP POLICY IF EXISTS "Firm members can send messages" ON public.messages;
CREATE POLICY "Firm members can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.firm_id = messages.firm_id
      AND profiles.id = auth.uid()
      AND profiles.id = messages.sender_id
    )
    AND (
      -- Can send to specific recipient in same firm
      (
        messages.recipient_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = messages.recipient_id
          AND profiles.firm_id = messages.firm_id
        )
      )
      -- Or send group message (recipient_id is NULL)
      OR messages.recipient_id IS NULL
    )
  );

-- Users can update their own messages (mark as read, edit)
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
CREATE POLICY "Users can update messages"
  ON public.messages
  FOR UPDATE
  USING (
    -- Can update if they're the recipient (mark as read)
    messages.recipient_id = auth.uid()
    -- Or if they're the sender (edit their message)
    OR messages.sender_id = auth.uid()
  )
  WITH CHECK (
    messages.recipient_id = auth.uid()
    OR messages.sender_id = auth.uid()
  );

-- Users can delete their own messages
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
  ON public.messages
  FOR DELETE
  USING (messages.sender_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_messages_timestamp ON public.messages;
CREATE TRIGGER update_messages_timestamp
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Enable Realtime for messages table
-- This allows real-time subscriptions to message changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Comments
COMMENT ON TABLE public.messages IS 'Team messaging system for firm members';
COMMENT ON COLUMN public.messages.recipient_id IS 'NULL means group message to all firm members';
COMMENT ON COLUMN public.messages.is_read IS 'Whether the recipient has read the message';

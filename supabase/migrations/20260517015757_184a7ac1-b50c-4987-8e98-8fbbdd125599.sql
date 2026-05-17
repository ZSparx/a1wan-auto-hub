
-- Set search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Revoke public execute on SECURITY DEFINER helpers; they're only used inside RLS policies and triggers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Tighten contact_messages insert: only allow rows where the inserter has filled the required text fields with reasonable lengths
DROP POLICY "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a contact message" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(name) BETWEEN 1 AND 120
    AND char_length(email) BETWEEN 3 AND 200
    AND char_length(message) BETWEEN 1 AND 4000
    AND read = false
  );

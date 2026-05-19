
CREATE TABLE public.customer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('admin','customer')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  read_by_admin boolean NOT NULL DEFAULT false,
  read_by_customer boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_messages_customer ON public.customer_messages(customer_id, created_at DESC);

ALTER TABLE public.customer_messages ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins manage messages"
  ON public.customer_messages FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Customers: read their own thread
CREATE POLICY "Customers read own messages"
  ON public.customer_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id);

-- Customers: send messages as themselves
CREATE POLICY "Customers send messages"
  ON public.customer_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id AND sender = 'customer');

-- Customers: mark admin replies as read
CREATE POLICY "Customers mark own thread read"
  ON public.customer_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

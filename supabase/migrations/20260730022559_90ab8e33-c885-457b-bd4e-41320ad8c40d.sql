ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS mechanic_id uuid;

CREATE OR REPLACE FUNCTION public.enforce_admin_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') >= 2 THEN
      RAISE EXCEPTION 'Admin limit reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_admin_limit_trg ON public.user_roles;
CREATE TRIGGER enforce_admin_limit_trg
BEFORE INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_limit();

DROP POLICY IF EXISTS "Mechanics view assigned work orders" ON public.work_orders;
CREATE POLICY "Mechanics view assigned work orders" ON public.work_orders
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'mechanic'::app_role) AND mechanic_id = auth.uid());

DROP POLICY IF EXISTS "Mechanics update assigned work orders" ON public.work_orders;
CREATE POLICY "Mechanics update assigned work orders" ON public.work_orders
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'mechanic'::app_role) AND mechanic_id = auth.uid())
WITH CHECK (has_role(auth.uid(), 'mechanic'::app_role) AND mechanic_id = auth.uid());
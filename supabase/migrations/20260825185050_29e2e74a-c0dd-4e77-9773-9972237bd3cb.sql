-- Clear all app data
TRUNCATE TABLE public.invoice_items, public.invoices, public.bookings, public.customer_messages, public.contact_messages, public.work_orders, public.vehicles RESTART IDENTITY CASCADE;

-- Remove all users (cascades to profiles + user_roles)
DELETE FROM auth.users;

-- First signup becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_count int;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';

  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;

  RETURN NEW;
END;
$function$;

-- Public helper so the signup page can show the "claim owner account" banner
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$function$;

GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;
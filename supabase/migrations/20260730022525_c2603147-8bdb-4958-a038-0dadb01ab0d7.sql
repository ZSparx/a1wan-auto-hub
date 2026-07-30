TRUNCATE TABLE public.invoice_items, public.invoices, public.customer_messages, public.contact_messages, public.bookings, public.work_orders, public.vehicles, public.cars_for_sale, public.user_roles, public.profiles CASCADE;
DELETE FROM auth.users;
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mechanic';
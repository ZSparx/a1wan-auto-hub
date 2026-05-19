
TRUNCATE TABLE public.invoice_items, public.invoices, public.bookings, public.work_orders, public.vehicles, public.contact_messages, public.cars_for_sale, public.user_roles, public.profiles RESTART IDENTITY CASCADE;
DELETE FROM auth.users;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id, 'authenticated', 'authenticated',
    'betcastillo21@gmail.com',
    crypt('alwanauto21', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Humberto Castillo"}'::jsonb,
    false, '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', 'betcastillo21@gmail.com', 'email_verified', true),
    'email', new_user_id::text, now(), now(), now()
  );

  -- Ensure profile exists (trigger may or may not have created it) and is correct
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new_user_id, 'Humberto Castillo', 'betcastillo21@gmail.com')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

  -- Replace any auto-assigned role with admin
  DELETE FROM public.user_roles WHERE user_id = new_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (new_user_id, 'admin');
END $$;

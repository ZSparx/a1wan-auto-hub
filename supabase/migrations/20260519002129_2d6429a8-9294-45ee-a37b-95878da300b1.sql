-- Create public car-photos bucket with admin-only writes
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-photos', 'car-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Car photos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'car-photos');

CREATE POLICY "Admins can upload car photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'car-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update car photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-photos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete car photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-photos' AND public.has_role(auth.uid(), 'admin'));
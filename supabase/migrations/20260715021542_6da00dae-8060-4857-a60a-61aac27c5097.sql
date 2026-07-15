DROP POLICY IF EXISTS "Car photos are publicly viewable" ON storage.objects;

CREATE POLICY "Admins can list car photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
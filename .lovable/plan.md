# Plan: Fix public storage bucket listing warning

## Problem
The `car-photos` storage bucket has a broad `SELECT` policy for the `public` role, which lets anyone list every file name/path in the bucket via the Storage API.

## Goal
Block public directory listing while keeping car photos viewable through their public URLs.

## How the app uses the bucket
- Admin upload: `supabase.storage.from("car-photos").upload(...)`
- Admin remove: `supabase.storage.from("car-photos").remove(...)`
- Public view: `getPublicUrl(...)` from stored paths
- No code path calls `.list()` on this bucket.

## Proposed change
Update the `storage.objects` SELECT policy so it only allows listing for admin users, not the public role. Because the bucket itself remains public, direct image URLs still work for everyone.

## Migration
Replace the existing public SELECT policy with an admin-only one:

```sql
DROP POLICY IF EXISTS "Car photos are publicly viewable" ON storage.objects;

CREATE POLICY "Admins can list car photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'car-photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
```

## Verification
- Re-run the security scan to confirm the warning is gone.
- Confirm the published/preview site still loads car images from public URLs.
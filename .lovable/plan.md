## Today's behavior

In **Admin → Cars for Sale → New listing**, the only way to attach a photo is to paste a hosted image URL into a text field. There is no actual file upload, so you'd have to host the image somewhere else first.

## What I'll add

Real photo uploads from your computer or phone, stored in Lovable Cloud, with a public URL automatically saved on the listing. One main photo per car (matches the current `image_url` field), admins-only access. The public `/cars-for-sale` page keeps working unchanged — it just reads `image_url` like today.

### 1. Storage bucket

Create a public-read storage bucket `car-photos` with admin-only write/delete. Files keyed as `{carId-or-uuid}/{timestamp}-{filename}`.

### 2. Admin upload UI

In `src/routes/_admin/admin.cars.tsx`, replace the "Image URL" text input with a drop zone + file picker that:
- Accepts JPG / PNG / WebP, max ~8 MB
- Shows a live preview after selection
- On submit, uploads to `car-photos` via `supabase.storage`, gets the public URL, and saves it as `image_url` on the new listing
- Lets you replace or remove the photo on existing listings (same upload control on each card)

### 3. Cleanup

When a listing is deleted or its photo is replaced, the old file is removed from the bucket so storage doesn't accumulate stale images.

## Technical notes

- Bucket: `storage.buckets` row with `public = true`; RLS on `storage.objects` — public `SELECT` for `bucket_id = 'car-photos'`, `INSERT`/`UPDATE`/`DELETE` gated by `has_role(auth.uid(), 'admin')`.
- Upload happens client-side from the admin page using the existing `supabase` browser client (admin is authenticated, RLS enforces the role check).
- Path convention: `car-photos/{listing_id_or_temp_uuid}/{Date.now()}-{sanitizedName}`.
- File validation in the form before upload (MIME type + size). Toast on failure.
- No schema change needed — we keep `cars_for_sale.image_url text` and just populate it with the storage public URL.

## Out of scope (say the word if you want them)

- Multiple photos / gallery per listing (would need a `car_images` table)
- Image resizing/optimization
- A separate "staff" role

-- Make the bioimpedance-images bucket public so profile photos can be displayed
UPDATE storage.buckets SET public = true WHERE id = 'bioimpedance-images';

-- Add public policy for viewing files
CREATE POLICY "Public can view bioimpedance images"
ON storage.objects FOR SELECT
USING (bucket_id = 'bioimpedance-images');
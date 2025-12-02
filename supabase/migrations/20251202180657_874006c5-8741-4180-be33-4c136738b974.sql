-- Create users enum
CREATE TYPE public.user_person AS ENUM ('reneer', 'ana_paula');

-- Create bioimpedance measurements table
CREATE TABLE public.bioimpedance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_person user_person NOT NULL,
  measurement_date DATE NOT NULL,
  week_number INTEGER,
  monjaro_dose DECIMAL(4,2),
  status TEXT,
  weight DECIMAL(5,2),
  bmi DECIMAL(4,2),
  body_fat_percent DECIMAL(4,2),
  fat_mass DECIMAL(5,2),
  lean_mass DECIMAL(5,2),
  muscle_mass DECIMAL(5,2),
  muscle_rate_percent DECIMAL(4,2),
  skeletal_muscle_percent DECIMAL(4,2),
  bone_mass DECIMAL(4,2),
  protein_mass DECIMAL(4,2),
  protein_percent DECIMAL(4,2),
  body_water_percent DECIMAL(4,2),
  moisture_content DECIMAL(5,2),
  subcutaneous_fat_percent DECIMAL(4,2),
  visceral_fat DECIMAL(4,2),
  bmr INTEGER,
  metabolic_age INTEGER,
  whr DECIMAL(4,3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bioimpedance ENABLE ROW LEVEL SECURITY;

-- Create policy for public read (no auth required for this family app)
CREATE POLICY "Allow public read access" ON public.bioimpedance FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.bioimpedance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.bioimpedance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.bioimpedance FOR DELETE USING (true);

-- Create storage bucket for bioimpedance images
INSERT INTO storage.buckets (id, name, public) VALUES ('bioimpedance-images', 'bioimpedance-images', true);

-- Storage policies
CREATE POLICY "Allow public read on bioimpedance images" ON storage.objects FOR SELECT USING (bucket_id = 'bioimpedance-images');
CREATE POLICY "Allow public upload on bioimpedance images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bioimpedance-images');

-- Insert initial data for Reneer (12 weeks)
INSERT INTO public.bioimpedance (user_person, measurement_date, week_number, monjaro_dose, status, weight, bmi, body_fat_percent, fat_mass, lean_mass, muscle_mass, muscle_rate_percent, skeletal_muscle_percent, bone_mass, protein_mass, protein_percent, body_water_percent, moisture_content, subcutaneous_fat_percent, visceral_fat, bmr, metabolic_age, whr) VALUES
('reneer', '2024-09-02', 1, 2.5, 'Inicial', 110.4, 36.9, 35.0, 38.6, 71.9, 67.1, 60.7, 37.4, 4.8, 14.4, 13.0, 47.7, 52.7, 25.0, 16, 1920, 42, 0.99),
('reneer', '2024-09-09', 2, 2.5, 'Adaptação', 108.6, 36.3, 34.8, 37.8, 70.7, 66.0, 60.8, 37.4, 4.7, 14.1, 13.0, 47.8, 51.9, 24.8, 16, 1899, 42, 1.04),
('reneer', '2024-09-16', 3, 4.0, 'Escalada', 106.8, 35.7, 34.7, 37.1, 69.9, 65.2, 61.0, 37.5, 4.7, 14.0, 13.1, 47.9, 51.2, 24.7, 16, 1877, 42, 1.06),
('reneer', '2024-09-23', 4, 5.0, 'Escalada', 105.9, 35.4, 32.7, 34.6, 71.4, 66.6, 62.8, 38.7, 4.8, 14.3, 13.5, 49.4, 52.3, 23.3, 14, 1910, 41, 0.94),
('reneer', '2024-09-30', 5, 5.0, 'Estabilização', 104.3, 34.8, 32.8, 34.2, 70.1, 65.4, 62.7, 38.6, 4.7, 14.0, 13.4, 49.3, 51.4, 23.4, 14, 1884, 41, 0.93),
('reneer', '2024-10-07', 6, 5.0, 'HIATO 14d', 105.8, 35.4, 33.8, 35.8, 70.2, 65.5, 61.8, 38.0, 4.7, 14.1, 13.2, 48.6, 51.5, 24.1, 15, 1884, 41, 1.04),
('reneer', '2024-10-21', 7, 5.0, 'Recuperação', 104.8, 35.0, 33.5, 37.1, 69.9, 65.0, 62.1, 38.2, 4.7, 14.0, 13.1, 48.8, 51.2, 23.9, 15, 1875, 41, 1.06),
('reneer', '2024-10-28', 8, 7.5, 'Escalada', 103.9, 34.7, 32.6, 33.9, 70.0, 65.3, 62.9, 38.7, 4.7, 14.0, 13.5, 49.4, 51.4, 23.3, 14, 1882, 41, 0.94),
('reneer', '2024-11-04', 9, 0, 'Ciclo 7d', 103.1, 34.4, 31.5, 32.5, 70.6, 65.9, 63.9, 39.3, 4.7, 14.1, 13.7, 50.2, 51.8, 22.5, 13, 1894, 41, 0.93),
('reneer', '2024-11-11', 10, 0, 'HIATO 14d', 103.4, 34.5, 31.9, 33.0, 70.4, 65.7, 63.5, 39.1, 4.7, 14.1, 13.6, 49.9, 51.6, 22.8, 14, 1890, 41, 0.93),
('reneer', '2024-11-25', 11, 7.5, 'Retomada', 103.4, 34.5, 31.9, 33.0, 70.4, 65.7, 63.5, 39.1, 4.7, 14.1, 13.6, 49.9, 51.6, 22.8, 14, 1890, 41, 0.93),
('reneer', '2024-12-02', 12, 7.5, 'HIATO 12d', 103.3, 34.5, 32.1, 33.2, 70.1, 65.4, 63.4, 39.0, 4.7, 14.0, 13.6, 49.8, 51.4, 22.9, 14, 1888, 33, 0.93);

-- Insert initial data for Ana Paula
INSERT INTO public.bioimpedance (user_person, measurement_date, week_number, monjaro_dose, status, weight, bmi, body_fat_percent, fat_mass, lean_mass, muscle_mass, muscle_rate_percent, skeletal_muscle_percent, bone_mass, protein_mass, protein_percent, body_water_percent, moisture_content, subcutaneous_fat_percent, visceral_fat, bmr, metabolic_age, whr) VALUES
('ana_paula', '2024-12-02', 1, 2.5, 'Inicial', 60.6, 24.0, 33.1, 20.1, 40.5, 37.8, 62.4, 36.5, 2.7, 8.1, 13.4, 49.0, 29.7, 23.6, 8, 1244, 39, 0.87);
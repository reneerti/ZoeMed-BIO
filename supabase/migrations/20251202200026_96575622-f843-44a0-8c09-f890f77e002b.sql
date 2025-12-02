-- Create user_profiles table for storing avatar URLs
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_person TEXT NOT NULL UNIQUE CHECK (user_person IN ('reneer', 'ana_paula')),
  avatar_url TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is a family app with localStorage auth)
CREATE POLICY "Allow public read access on user_profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

-- Allow public insert access
CREATE POLICY "Allow public insert access on user_profiles" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Allow public update access on user_profiles" 
ON public.user_profiles 
FOR UPDATE 
USING (true);

-- Insert default profiles
INSERT INTO public.user_profiles (user_person, display_name) VALUES 
  ('reneer', 'Reneer'),
  ('ana_paula', 'Ana Paula');

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_profiles_updated_at();
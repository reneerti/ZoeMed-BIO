-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height NUMERIC,
  address TEXT,
  medical_notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monjaro_treatments table
CREATE TABLE public.monjaro_treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  dose NUMERIC NOT NULL,
  application_date DATE NOT NULL,
  week_number INTEGER,
  notes TEXT,
  side_effects TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_fields_config table
CREATE TABLE public.custom_fields_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'textarea')),
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add patient_id to bioimpedance table
ALTER TABLE public.bioimpedance ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monjaro_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields_config ENABLE ROW LEVEL SECURITY;

-- Create triggers
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_user_profiles_updated_at();

CREATE TRIGGER update_monjaro_treatments_updated_at
BEFORE UPDATE ON public.monjaro_treatments
FOR EACH ROW
EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- RLS for custom_fields_config (everyone can read)
CREATE POLICY "Everyone can read custom fields config"
ON public.custom_fields_config
FOR SELECT
USING (true);

CREATE POLICY "Admins and master can manage custom fields"
ON public.custom_fields_config
FOR ALL
USING (has_role(auth.uid(), 'admin'));
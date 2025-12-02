-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles (only admins can view all, users can view their own)
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Assign admin role to existing user (reneerti@gmail.com)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'reneerti@gmail.com';

-- Update bioimpedance RLS policies - viewers can only SELECT
DROP POLICY IF EXISTS "Authenticated users can delete bioimpedance" ON public.bioimpedance;
DROP POLICY IF EXISTS "Authenticated users can insert bioimpedance" ON public.bioimpedance;
DROP POLICY IF EXISTS "Authenticated users can update bioimpedance" ON public.bioimpedance;

CREATE POLICY "Only admins can insert bioimpedance"
ON public.bioimpedance FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update bioimpedance"
ON public.bioimpedance FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete bioimpedance"
ON public.bioimpedance FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update supplementation RLS policies - viewers can only SELECT
DROP POLICY IF EXISTS "Authenticated users can insert supplementation" ON public.supplementation;
DROP POLICY IF EXISTS "Authenticated users can update supplementation" ON public.supplementation;
DROP POLICY IF EXISTS "Authenticated users can delete supplementation" ON public.supplementation;

CREATE POLICY "Only admins can insert supplementation"
ON public.supplementation FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update supplementation"
ON public.supplementation FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete supplementation"
ON public.supplementation FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update user_profiles RLS - viewers can only SELECT
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON public.user_profiles;

CREATE POLICY "Only admins can insert profiles"
ON public.user_profiles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update profiles"
ON public.user_profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
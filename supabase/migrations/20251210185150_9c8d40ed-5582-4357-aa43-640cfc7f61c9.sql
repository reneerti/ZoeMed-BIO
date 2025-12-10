-- Create function to check if user is master
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS Policies for patients table
CREATE POLICY "Master can do everything on patients"
ON public.patients
FOR ALL
USING (public.is_master(auth.uid()));

CREATE POLICY "Users can view their own patient record"
ON public.patients
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own patient record"
ON public.patients
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own patient record"
ON public.patients
FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_master(auth.uid()));

-- RLS Policies for monjaro_treatments
CREATE POLICY "Master can do everything on monjaro_treatments"
ON public.monjaro_treatments
FOR ALL
USING (public.is_master(auth.uid()));

CREATE POLICY "Users can view their own monjaro treatments"
ON public.monjaro_treatments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = monjaro_treatments.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own monjaro treatments"
ON public.monjaro_treatments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = monjaro_treatments.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own monjaro treatments"
ON public.monjaro_treatments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = monjaro_treatments.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Update bioimpedance RLS to include patient-based access
CREATE POLICY "Users can view their own bioimpedance via patient"
ON public.bioimpedance
FOR SELECT
USING (
  patient_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = bioimpedance.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own bioimpedance via patient"
ON public.bioimpedance
FOR INSERT
WITH CHECK (
  patient_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = bioimpedance.patient_id
    AND patients.user_id = auth.uid()
  )
);
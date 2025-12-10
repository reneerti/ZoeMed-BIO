-- Drop existing policies on patients table
DROP POLICY IF EXISTS "Master can do everything on patients" ON public.patients;
DROP POLICY IF EXISTS "Users can view their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Users can insert their own patient record" ON public.patients;

-- Create strict RLS policies for patients table
-- Only MASTER (admin) can see all patients
CREATE POLICY "Master can view all patients" 
ON public.patients 
FOR SELECT 
USING (is_master(auth.uid()));

-- Users can ONLY view their own patient record (strict user_id match)
CREATE POLICY "Users can view only their own patient record" 
ON public.patients 
FOR SELECT 
USING (user_id = auth.uid());

-- Only MASTER can insert patients
CREATE POLICY "Master can insert patients" 
ON public.patients 
FOR INSERT 
WITH CHECK (is_master(auth.uid()));

-- Users can insert their own patient record if user_id matches
CREATE POLICY "Users can insert their own patient record" 
ON public.patients 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Only MASTER can update any patient
CREATE POLICY "Master can update all patients" 
ON public.patients 
FOR UPDATE 
USING (is_master(auth.uid()));

-- Users can ONLY update their own patient record
CREATE POLICY "Users can update only their own patient record" 
ON public.patients 
FOR UPDATE 
USING (user_id = auth.uid());

-- Only MASTER can delete patients
CREATE POLICY "Master can delete patients" 
ON public.patients 
FOR DELETE 
USING (is_master(auth.uid()));
-- ================================================
-- FIX user_goals TABLE RLS POLICIES
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read goals" ON public.user_goals;
DROP POLICY IF EXISTS "Only admins can insert goals" ON public.user_goals;
DROP POLICY IF EXISTS "Only admins can update goals" ON public.user_goals;
DROP POLICY IF EXISTS "Only admins can delete goals" ON public.user_goals;

-- Create a function to get the user_person for the current user
CREATE OR REPLACE FUNCTION public.get_user_person_for_user(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name FROM public.patients p WHERE p.user_id = _user_id LIMIT 1
$$;

-- Master can view all goals
CREATE POLICY "Master can view all goals" 
ON public.user_goals 
FOR SELECT 
USING (is_master(auth.uid()));

-- Users can only view goals for their linked patient (via patients table)
CREATE POLICY "Users can view their own goals" 
ON public.user_goals 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.user_id = auth.uid() 
    AND (p.name = user_goals.user_person OR LOWER(REPLACE(p.name, ' ', '_')) = user_goals.user_person)
  )
);

-- Only master can insert goals
CREATE POLICY "Master can insert goals" 
ON public.user_goals 
FOR INSERT 
WITH CHECK (is_master(auth.uid()));

-- Only master can update goals
CREATE POLICY "Master can update goals" 
ON public.user_goals 
FOR UPDATE 
USING (is_master(auth.uid()));

-- Only master can delete goals
CREATE POLICY "Master can delete goals" 
ON public.user_goals 
FOR DELETE 
USING (is_master(auth.uid()));

-- ================================================
-- FIX notifications TABLE RLS POLICIES
-- ================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update notification read status" ON public.notifications;
DROP POLICY IF EXISTS "Only admins can delete notifications" ON public.notifications;

-- Master can view all notifications
CREATE POLICY "Master can view all notifications" 
ON public.notifications 
FOR SELECT 
USING (is_master(auth.uid()));

-- Users can only view their own notifications (matching user_person via patients table)
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.user_id = auth.uid() 
    AND (p.name = notifications.user_person OR LOWER(REPLACE(p.name, ' ', '_')) = notifications.user_person)
  )
);

-- System/triggers can insert notifications (using service role)
CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Users can ONLY update their own notifications
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  is_master(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.user_id = auth.uid() 
    AND (p.name = notifications.user_person OR LOWER(REPLACE(p.name, ' ', '_')) = notifications.user_person)
  )
);

-- Only master can delete notifications
CREATE POLICY "Master can delete notifications" 
ON public.notifications 
FOR DELETE 
USING (is_master(auth.uid()));
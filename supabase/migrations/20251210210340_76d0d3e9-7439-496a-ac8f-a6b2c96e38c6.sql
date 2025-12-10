-- Fix SECURITY DEFINER view issue - drop and recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_top3;

-- Create a function to get top 3 leaderboard (safer approach)
CREATE OR REPLACE FUNCTION public.get_leaderboard_top3()
RETURNS TABLE (
  rank_position INTEGER,
  patient_name TEXT,
  score NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    ps.rank_position,
    p.name AS patient_name,
    ps.score
  FROM public.patient_scores ps
  JOIN public.patients p ON p.id = ps.patient_id
  WHERE ps.rank_position <= 3
  ORDER BY ps.rank_position ASC;
$$;

-- Add policy for authenticated users to see top 3 scores (limited info)
CREATE POLICY "Authenticated users can view top 3 scores" 
ON public.patient_scores 
FOR SELECT 
TO authenticated
USING (rank_position <= 3);
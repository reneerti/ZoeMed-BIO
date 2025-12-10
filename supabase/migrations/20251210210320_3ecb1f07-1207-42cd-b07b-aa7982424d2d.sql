-- =============================================
-- 1. FIX AI_ANALYSIS_HISTORY SECURITY
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can read analysis history" ON public.ai_analysis_history;

-- Master can view all analysis history
CREATE POLICY "Master can view all analysis history" 
ON public.ai_analysis_history 
FOR SELECT 
USING (is_master(auth.uid()));

-- Users can only view their own analysis history
CREATE POLICY "Users can view their own analysis history" 
ON public.ai_analysis_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.user_id = auth.uid() 
    AND (p.name = ai_analysis_history.user_person OR LOWER(REPLACE(p.name, ' ', '_')) = ai_analysis_history.user_person)
  )
);

-- =============================================
-- 2. FIX BIOIMPEDANCE SECURITY
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can read bioimpedance" ON public.bioimpedance;

-- Master can view all bioimpedance
CREATE POLICY "Master can view all bioimpedance" 
ON public.bioimpedance 
FOR SELECT 
USING (is_master(auth.uid()));

-- Users can only view their own bioimpedance (via user_person match)
CREATE POLICY "Users can view their own bioimpedance by user_person" 
ON public.bioimpedance 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.user_id = auth.uid() 
    AND (p.name::text = user_person::text OR LOWER(REPLACE(p.name, ' ', '_')) = user_person::text)
  )
);

-- =============================================
-- 3. CREATE PATIENT SCORES TABLE
-- =============================================
CREATE TABLE public.patient_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  weight_evolution NUMERIC DEFAULT 0,
  fat_evolution NUMERIC DEFAULT 0,
  muscle_evolution NUMERIC DEFAULT 0,
  criticality TEXT DEFAULT 'normal' CHECK (criticality IN ('healthy', 'normal', 'attention', 'critical')),
  rank_position INTEGER,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id)
);

-- Enable RLS
ALTER TABLE public.patient_scores ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE PUBLIC LEADERBOARD VIEW (TOP 3 ONLY)
-- =============================================
CREATE OR REPLACE VIEW public.leaderboard_top3 AS
SELECT 
  ps.rank_position,
  p.name AS patient_name,
  ps.score
FROM public.patient_scores ps
JOIN public.patients p ON p.id = ps.patient_id
WHERE ps.rank_position <= 3
ORDER BY ps.rank_position ASC;

-- =============================================
-- 5. RLS POLICIES FOR PATIENT_SCORES
-- =============================================

-- Everyone can see the leaderboard (top 3 only - name, position, score)
-- This is handled by the view which only exposes limited data

-- Master can view all scores
CREATE POLICY "Master can view all patient scores" 
ON public.patient_scores 
FOR SELECT 
USING (is_master(auth.uid()));

-- Users can view their own score
CREATE POLICY "Users can view their own score" 
ON public.patient_scores 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.patients p 
    WHERE p.id = patient_scores.patient_id 
    AND p.user_id = auth.uid()
  )
);

-- Master can manage all scores
CREATE POLICY "Master can insert scores" 
ON public.patient_scores 
FOR INSERT 
WITH CHECK (is_master(auth.uid()));

CREATE POLICY "Master can update scores" 
ON public.patient_scores 
FOR UPDATE 
USING (is_master(auth.uid()));

CREATE POLICY "Master can delete scores" 
ON public.patient_scores 
FOR DELETE 
USING (is_master(auth.uid()));

-- =============================================
-- 6. FUNCTION TO CALCULATE AND UPDATE SCORES
-- =============================================
CREATE OR REPLACE FUNCTION public.calculate_patient_score(p_patient_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score NUMERIC := 0;
  v_weight_evolution NUMERIC := 0;
  v_fat_evolution NUMERIC := 0;
  v_muscle_evolution NUMERIC := 0;
  v_criticality TEXT := 'normal';
  v_first_record RECORD;
  v_last_record RECORD;
  v_patient_name TEXT;
BEGIN
  -- Get patient name
  SELECT name INTO v_patient_name FROM public.patients WHERE id = p_patient_id;
  
  -- Get first bioimpedance record
  SELECT weight, body_fat_percent, muscle_rate_percent 
  INTO v_first_record
  FROM public.bioimpedance 
  WHERE patient_id = p_patient_id 
     OR user_person::text = v_patient_name 
     OR user_person::text = LOWER(REPLACE(v_patient_name, ' ', '_'))
  ORDER BY measurement_date ASC 
  LIMIT 1;
  
  -- Get last bioimpedance record
  SELECT weight, body_fat_percent, muscle_rate_percent 
  INTO v_last_record
  FROM public.bioimpedance 
  WHERE patient_id = p_patient_id 
     OR user_person::text = v_patient_name 
     OR user_person::text = LOWER(REPLACE(v_patient_name, ' ', '_'))
  ORDER BY measurement_date DESC 
  LIMIT 1;
  
  -- Calculate evolutions if we have both records
  IF v_first_record.weight IS NOT NULL AND v_last_record.weight IS NOT NULL THEN
    -- Weight evolution (positive = weight loss = good)
    v_weight_evolution := ((v_first_record.weight - v_last_record.weight) / v_first_record.weight) * 100;
    
    -- Fat evolution (positive = fat loss = good)
    IF v_first_record.body_fat_percent IS NOT NULL AND v_last_record.body_fat_percent IS NOT NULL THEN
      v_fat_evolution := v_first_record.body_fat_percent - v_last_record.body_fat_percent;
    END IF;
    
    -- Muscle evolution (positive = muscle gain = good)
    IF v_first_record.muscle_rate_percent IS NOT NULL AND v_last_record.muscle_rate_percent IS NOT NULL THEN
      v_muscle_evolution := v_last_record.muscle_rate_percent - v_first_record.muscle_rate_percent;
    END IF;
    
    -- Calculate score: weighted sum of evolutions
    v_score := (v_weight_evolution * 40) + (v_fat_evolution * 35) + (v_muscle_evolution * 25);
    
    -- Determine criticality based on score
    IF v_score >= 50 THEN
      v_criticality := 'healthy';
    ELSIF v_score >= 20 THEN
      v_criticality := 'normal';
    ELSIF v_score >= 0 THEN
      v_criticality := 'attention';
    ELSE
      v_criticality := 'critical';
    END IF;
  END IF;
  
  -- Upsert the score
  INSERT INTO public.patient_scores (patient_id, score, weight_evolution, fat_evolution, muscle_evolution, criticality, last_calculated_at)
  VALUES (p_patient_id, v_score, v_weight_evolution, v_fat_evolution, v_muscle_evolution, v_criticality, now())
  ON CONFLICT (patient_id) 
  DO UPDATE SET 
    score = EXCLUDED.score,
    weight_evolution = EXCLUDED.weight_evolution,
    fat_evolution = EXCLUDED.fat_evolution,
    muscle_evolution = EXCLUDED.muscle_evolution,
    criticality = EXCLUDED.criticality,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();
  
  RETURN v_score;
END;
$$;

-- =============================================
-- 7. FUNCTION TO UPDATE ALL RANKINGS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update rank positions based on score (highest score = rank 1)
  UPDATE public.patient_scores ps
  SET rank_position = ranked.new_rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM public.patient_scores
  ) ranked
  WHERE ps.id = ranked.id;
END;
$$;

-- =============================================
-- 8. TRIGGER TO AUTO-UPDATE SCORES ON BIOIMPEDANCE CHANGE
-- =============================================
CREATE OR REPLACE FUNCTION public.trigger_update_patient_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Find patient_id from patient_id column or user_person match
  IF NEW.patient_id IS NOT NULL THEN
    v_patient_id := NEW.patient_id;
  ELSE
    SELECT id INTO v_patient_id 
    FROM public.patients 
    WHERE name::text = NEW.user_person::text 
       OR LOWER(REPLACE(name, ' ', '_')) = NEW.user_person::text
    LIMIT 1;
  END IF;
  
  -- Calculate score for this patient
  IF v_patient_id IS NOT NULL THEN
    PERFORM public.calculate_patient_score(v_patient_id);
    PERFORM public.update_leaderboard_rankings();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_bioimpedance_score_update
AFTER INSERT OR UPDATE ON public.bioimpedance
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_patient_score();
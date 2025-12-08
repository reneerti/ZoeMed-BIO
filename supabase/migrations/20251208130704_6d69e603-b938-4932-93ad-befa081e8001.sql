-- Create table for AI analysis history
CREATE TABLE public.ai_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_person TEXT NOT NULL,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  summary TEXT NOT NULL,
  full_analysis TEXT NOT NULL,
  weight_at_analysis NUMERIC,
  bmi_at_analysis NUMERIC,
  fat_at_analysis NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_analysis_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read analysis history"
ON public.ai_analysis_history
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert analysis history"
ON public.ai_analysis_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete analysis history"
ON public.ai_analysis_history
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_ai_analysis_user_date ON public.ai_analysis_history(user_person, analysis_date DESC);
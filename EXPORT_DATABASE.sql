-- =====================================================
-- ZOEMEDBIO - EXPORTAÇÃO COMPLETA DO BANCO DE DADOS
-- Projeto Supabase: dgoxrfhaxxhedibygcxz
-- Data: 2025-12-11
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'viewer');
CREATE TYPE public.user_person AS ENUM ('reneer', 'ana_paula');

-- =====================================================
-- 2. TABELAS
-- =====================================================

-- Tabela: patients
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    gender TEXT,
    birth_date DATE,
    height NUMERIC,
    avatar_url TEXT,
    medical_notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active'::text,
    user_id UUID,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: user_roles
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'viewer'::app_role,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Tabela: bioimpedance
CREATE TABLE public.bioimpedance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_person user_person NOT NULL,
    patient_id UUID,
    measurement_date DATE NOT NULL,
    week_number INTEGER,
    weight NUMERIC,
    bmi NUMERIC,
    body_fat_percent NUMERIC,
    fat_mass NUMERIC,
    muscle_rate_percent NUMERIC,
    muscle_mass NUMERIC,
    lean_mass NUMERIC,
    skeletal_muscle_percent NUMERIC,
    bone_mass NUMERIC,
    body_water_percent NUMERIC,
    moisture_content NUMERIC,
    protein_percent NUMERIC,
    protein_mass NUMERIC,
    subcutaneous_fat_percent NUMERIC,
    visceral_fat NUMERIC,
    bmr INTEGER,
    metabolic_age INTEGER,
    whr NUMERIC,
    monjaro_dose NUMERIC,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: ai_analysis_history
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

-- Tabela: notifications
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_person TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metric_name TEXT,
    old_value NUMERIC,
    new_value NUMERIC,
    change_value NUMERIC,
    is_positive BOOLEAN DEFAULT true,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: supplementation
CREATE TABLE public.supplementation (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_person TEXT NOT NULL,
    supplement_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: user_goals
CREATE TABLE public.user_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_person TEXT NOT NULL,
    target_weight NUMERIC,
    target_body_fat NUMERIC,
    target_muscle NUMERIC,
    target_visceral_fat NUMERIC,
    target_bmi NUMERIC,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: user_profiles
CREATE TABLE public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_person TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: patient_scores
CREATE TABLE public.patient_scores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    score NUMERIC NOT NULL DEFAULT 0,
    weight_evolution NUMERIC DEFAULT 0,
    fat_evolution NUMERIC DEFAULT 0,
    muscle_evolution NUMERIC DEFAULT 0,
    rank_position INTEGER,
    criticality TEXT DEFAULT 'normal'::text,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (patient_id)
);

-- Tabela: monjaro_treatments
CREATE TABLE public.monjaro_treatments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL,
    application_date DATE NOT NULL,
    dose NUMERIC NOT NULL,
    week_number INTEGER,
    side_effects TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela: custom_fields_config
CREATE TABLE public.custom_fields_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. FUNÇÕES
-- =====================================================

-- Função: is_master
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Função: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função: get_user_person_for_user
CREATE OR REPLACE FUNCTION public.get_user_person_for_user(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.name FROM public.patients p WHERE p.user_id = _user_id LIMIT 1
$$;

-- Função: handle_new_user_role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;

-- Função: update_user_profiles_updated_at
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função: check_bioimpedance_changes (para notificações automáticas)
CREATE OR REPLACE FUNCTION public.check_bioimpedance_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  prev_record RECORD;
  weight_change NUMERIC;
  fat_change NUMERIC;
  muscle_change NUMERIC;
  visceral_change NUMERIC;
  bmi_change NUMERIC;
  user_name TEXT;
BEGIN
  SELECT * INTO prev_record
  FROM public.bioimpedance
  WHERE user_person = NEW.user_person
    AND id != NEW.id
  ORDER BY measurement_date DESC
  LIMIT 1;

  IF prev_record IS NULL THEN
    RETURN NEW;
  END IF;

  user_name := CASE WHEN NEW.user_person = 'reneer' THEN 'Reneer' ELSE 'Ana Paula' END;

  IF NEW.weight IS NOT NULL AND prev_record.weight IS NOT NULL THEN
    weight_change := NEW.weight - prev_record.weight;
    IF ABS(weight_change) >= 1 THEN
      INSERT INTO public.notifications (user_person, notification_type, title, message, metric_name, old_value, new_value, change_value, is_positive)
      VALUES (
        NEW.user_person,
        'weight_change',
        CASE WHEN weight_change < 0 THEN '🎉 Perda de Peso!' ELSE '⚠️ Ganho de Peso' END,
        user_name || ': ' || ABS(weight_change)::TEXT || ' kg ' || CASE WHEN weight_change < 0 THEN 'perdidos' ELSE 'ganhos' END,
        'Peso',
        prev_record.weight,
        NEW.weight,
        weight_change,
        weight_change < 0
      );
    END IF;
  END IF;

  IF NEW.body_fat_percent IS NOT NULL AND prev_record.body_fat_percent IS NOT NULL THEN
    fat_change := NEW.body_fat_percent - prev_record.body_fat_percent;
    IF ABS(fat_change) >= 0.5 THEN
      INSERT INTO public.notifications (user_person, notification_type, title, message, metric_name, old_value, new_value, change_value, is_positive)
      VALUES (
        NEW.user_person,
        'fat_change',
        CASE WHEN fat_change < 0 THEN '🔥 Gordura Reduzida!' ELSE '⚠️ Aumento de Gordura' END,
        user_name || ': ' || ABS(fat_change)::TEXT || '% de gordura ' || CASE WHEN fat_change < 0 THEN 'reduzida' ELSE 'aumentada' END,
        'Gordura Corporal',
        prev_record.body_fat_percent,
        NEW.body_fat_percent,
        fat_change,
        fat_change < 0
      );
    END IF;
  END IF;

  IF NEW.muscle_rate_percent IS NOT NULL AND prev_record.muscle_rate_percent IS NOT NULL THEN
    muscle_change := NEW.muscle_rate_percent - prev_record.muscle_rate_percent;
    IF ABS(muscle_change) >= 0.5 THEN
      INSERT INTO public.notifications (user_person, notification_type, title, message, metric_name, old_value, new_value, change_value, is_positive)
      VALUES (
        NEW.user_person,
        'muscle_change',
        CASE WHEN muscle_change > 0 THEN '💪 Músculo Aumentou!' ELSE '⚠️ Perda Muscular' END,
        user_name || ': ' || ABS(muscle_change)::TEXT || '% de músculo ' || CASE WHEN muscle_change > 0 THEN 'ganho' ELSE 'perdido' END,
        'Taxa Muscular',
        prev_record.muscle_rate_percent,
        NEW.muscle_rate_percent,
        muscle_change,
        muscle_change > 0
      );
    END IF;
  END IF;

  IF NEW.visceral_fat IS NOT NULL AND prev_record.visceral_fat IS NOT NULL THEN
    visceral_change := NEW.visceral_fat - prev_record.visceral_fat;
    IF ABS(visceral_change) >= 1 THEN
      INSERT INTO public.notifications (user_person, notification_type, title, message, metric_name, old_value, new_value, change_value, is_positive)
      VALUES (
        NEW.user_person,
        'visceral_change',
        CASE WHEN visceral_change < 0 THEN '❤️ Gordura Visceral Reduzida!' ELSE '⚠️ Aumento de Gordura Visceral' END,
        user_name || ': Gordura visceral ' || CASE WHEN visceral_change < 0 THEN 'reduziu' ELSE 'aumentou' END || ' ' || ABS(visceral_change)::TEXT || ' pontos',
        'Gordura Visceral',
        prev_record.visceral_fat,
        NEW.visceral_fat,
        visceral_change,
        visceral_change < 0
      );
    END IF;
  END IF;

  IF NEW.bmi IS NOT NULL AND prev_record.bmi IS NOT NULL THEN
    bmi_change := NEW.bmi - prev_record.bmi;
    IF ABS(bmi_change) >= 1 THEN
      INSERT INTO public.notifications (user_person, notification_type, title, message, metric_name, old_value, new_value, change_value, is_positive)
      VALUES (
        NEW.user_person,
        'bmi_change',
        CASE WHEN bmi_change < 0 THEN '📉 IMC Reduziu!' ELSE '📈 IMC Aumentou' END,
        user_name || ': IMC foi de ' || prev_record.bmi::TEXT || ' para ' || NEW.bmi::TEXT,
        'IMC',
        prev_record.bmi,
        NEW.bmi,
        bmi_change,
        bmi_change < 0
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Função: calculate_patient_score
CREATE OR REPLACE FUNCTION public.calculate_patient_score(p_patient_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  SELECT name INTO v_patient_name FROM public.patients WHERE id = p_patient_id;
  
  SELECT weight, body_fat_percent, muscle_rate_percent 
  INTO v_first_record
  FROM public.bioimpedance 
  WHERE patient_id = p_patient_id 
     OR user_person::text = v_patient_name 
     OR user_person::text = LOWER(REPLACE(v_patient_name, ' ', '_'))
  ORDER BY measurement_date ASC 
  LIMIT 1;
  
  SELECT weight, body_fat_percent, muscle_rate_percent 
  INTO v_last_record
  FROM public.bioimpedance 
  WHERE patient_id = p_patient_id 
     OR user_person::text = v_patient_name 
     OR user_person::text = LOWER(REPLACE(v_patient_name, ' ', '_'))
  ORDER BY measurement_date DESC 
  LIMIT 1;
  
  IF v_first_record.weight IS NOT NULL AND v_last_record.weight IS NOT NULL THEN
    v_weight_evolution := ((v_first_record.weight - v_last_record.weight) / v_first_record.weight) * 100;
    
    IF v_first_record.body_fat_percent IS NOT NULL AND v_last_record.body_fat_percent IS NOT NULL THEN
      v_fat_evolution := v_first_record.body_fat_percent - v_last_record.body_fat_percent;
    END IF;
    
    IF v_first_record.muscle_rate_percent IS NOT NULL AND v_last_record.muscle_rate_percent IS NOT NULL THEN
      v_muscle_evolution := v_last_record.muscle_rate_percent - v_first_record.muscle_rate_percent;
    END IF;
    
    v_score := (v_weight_evolution * 40) + (v_fat_evolution * 35) + (v_muscle_evolution * 25);
    
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

-- Função: update_leaderboard_rankings
CREATE OR REPLACE FUNCTION public.update_leaderboard_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.patient_scores ps
  SET rank_position = ranked.new_rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM public.patient_scores
  ) ranked
  WHERE ps.id = ranked.id;
END;
$$;

-- Função: trigger_update_patient_score
CREATE OR REPLACE FUNCTION public.trigger_update_patient_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  IF NEW.patient_id IS NOT NULL THEN
    v_patient_id := NEW.patient_id;
  ELSE
    SELECT id INTO v_patient_id 
    FROM public.patients 
    WHERE name::text = NEW.user_person::text 
       OR LOWER(REPLACE(name, ' ', '_')) = NEW.user_person::text
    LIMIT 1;
  END IF;
  
  IF v_patient_id IS NOT NULL THEN
    PERFORM public.calculate_patient_score(v_patient_id);
    PERFORM public.update_leaderboard_rankings();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Função: get_leaderboard_top3
CREATE OR REPLACE FUNCTION public.get_leaderboard_top3()
RETURNS TABLE(rank_position integer, patient_name text, score numeric)
LANGUAGE sql
STABLE
SET search_path TO 'public'
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

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Trigger: criar role para novos usuários
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Trigger: atualizar updated_at em user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- Trigger: verificar mudanças de bioimpedância para notificações
CREATE TRIGGER trigger_check_bioimpedance_changes
  AFTER INSERT ON public.bioimpedance
  FOR EACH ROW EXECUTE FUNCTION public.check_bioimpedance_changes();

-- Trigger: atualizar score do paciente após inserção de bioimpedância
CREATE TRIGGER trigger_update_patient_score_on_bioimpedance
  AFTER INSERT ON public.bioimpedance
  FOR EACH ROW EXECUTE FUNCTION public.trigger_update_patient_score();

-- =====================================================
-- 5. HABILITAR RLS
-- =====================================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bioimpedance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplementation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monjaro_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

-- PATIENTS
CREATE POLICY "Master can view all patients" ON public.patients FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Master can insert patients" ON public.patients FOR INSERT WITH CHECK (is_master(auth.uid()));
CREATE POLICY "Master can update all patients" ON public.patients FOR UPDATE USING (is_master(auth.uid()));
CREATE POLICY "Master can delete patients" ON public.patients FOR DELETE USING (is_master(auth.uid()));
CREATE POLICY "Users can view only their own patient record" ON public.patients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own patient record" ON public.patients FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update only their own patient record" ON public.patients FOR UPDATE USING (user_id = auth.uid());

-- USER_ROLES
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- BIOIMPEDANCE
CREATE POLICY "Master can view all bioimpedance" ON public.bioimpedance FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Only admins can insert bioimpedance" ON public.bioimpedance FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update bioimpedance" ON public.bioimpedance FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete bioimpedance" ON public.bioimpedance FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own bioimpedance via patient" ON public.bioimpedance FOR SELECT USING ((patient_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM patients WHERE patients.id = bioimpedance.patient_id AND patients.user_id = auth.uid())));
CREATE POLICY "Users can view their own bioimpedance by user_person" ON public.bioimpedance FOR SELECT USING (EXISTS (SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND (p.name = bioimpedance.user_person::text OR lower(replace(p.name, ' ', '_')) = bioimpedance.user_person::text)));
CREATE POLICY "Users can insert their own bioimpedance via patient" ON public.bioimpedance FOR INSERT WITH CHECK ((patient_id IS NOT NULL) AND (EXISTS (SELECT 1 FROM patients WHERE patients.id = bioimpedance.patient_id AND patients.user_id = auth.uid())));

-- AI_ANALYSIS_HISTORY
CREATE POLICY "Master can view all analysis history" ON public.ai_analysis_history FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Only admins can insert analysis history" ON public.ai_analysis_history FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can delete analysis history" ON public.ai_analysis_history FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own analysis history" ON public.ai_analysis_history FOR SELECT USING (EXISTS (SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND (p.name = ai_analysis_history.user_person OR lower(replace(p.name, ' ', '_')) = ai_analysis_history.user_person)));

-- NOTIFICATIONS
CREATE POLICY "Master can view all notifications" ON public.notifications FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Master can delete notifications" ON public.notifications FOR DELETE USING (is_master(auth.uid()));
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (EXISTS (SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND (p.name = notifications.user_person OR lower(replace(p.name, ' ', '_')) = notifications.user_person)));
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (is_master(auth.uid()) OR EXISTS (SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND (p.name = notifications.user_person OR lower(replace(p.name, ' ', '_')) = notifications.user_person)));

-- SUPPLEMENTATION
CREATE POLICY "Master can view all supplementation" ON public.supplementation FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Master can insert supplementation" ON public.supplementation FOR INSERT WITH CHECK (is_master(auth.uid()));
CREATE POLICY "Master can update supplementation" ON public.supplementation FOR UPDATE USING (is_master(auth.uid()));
CREATE POLICY "Master can delete supplementation" ON public.supplementation FOR DELETE USING (is_master(auth.uid()));
CREATE POLICY "Users can view their own supplementation" ON public.supplementation FOR SELECT USING (EXISTS (SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND (p.name = supplementation.user_person OR lower(replace(p.name, ' ', '_')) = supplementation.user_person)));

-- USER_GOALS
CREATE POLICY "Master can view all goals" ON public.user_goals FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Master can insert goals" ON public.user_goals FOR INSERT WITH CHECK (is_master(auth.uid()));
CREATE POLICY "Master can update goals" ON public.user_goals FOR UPDATE USING (is_master(auth.uid()));
CREATE POLICY "Master can delete goals" ON public.user_goals FOR DELETE USING (is_master(auth.uid()));
CREATE POLICY "Users can view their own goals" ON public.user_goals FOR SELECT USING (EXISTS (SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND (p.name = user_goals.user_person OR lower(replace(p.name, ' ', '_')) = user_goals.user_person)));

-- USER_PROFILES
CREATE POLICY "Authenticated users can read profiles" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Only admins can insert profiles" ON public.user_profiles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only admins can update profiles" ON public.user_profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- PATIENT_SCORES
CREATE POLICY "Master can view all patient scores" ON public.patient_scores FOR SELECT USING (is_master(auth.uid()));
CREATE POLICY "Master can insert scores" ON public.patient_scores FOR INSERT WITH CHECK (is_master(auth.uid()));
CREATE POLICY "Master can update scores" ON public.patient_scores FOR UPDATE USING (is_master(auth.uid()));
CREATE POLICY "Master can delete scores" ON public.patient_scores FOR DELETE USING (is_master(auth.uid()));
CREATE POLICY "Authenticated users can view top 3 scores" ON public.patient_scores FOR SELECT USING (rank_position <= 3);
CREATE POLICY "Users can view their own score" ON public.patient_scores FOR SELECT USING (EXISTS (SELECT 1 FROM patients p WHERE p.id = patient_scores.patient_id AND p.user_id = auth.uid()));

-- MONJARO_TREATMENTS
CREATE POLICY "Master can do everything on monjaro_treatments" ON public.monjaro_treatments FOR ALL USING (is_master(auth.uid()));
CREATE POLICY "Users can view their own monjaro treatments" ON public.monjaro_treatments FOR SELECT USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = monjaro_treatments.patient_id AND patients.user_id = auth.uid()));
CREATE POLICY "Users can insert their own monjaro treatments" ON public.monjaro_treatments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM patients WHERE patients.id = monjaro_treatments.patient_id AND patients.user_id = auth.uid()));
CREATE POLICY "Users can update their own monjaro treatments" ON public.monjaro_treatments FOR UPDATE USING (EXISTS (SELECT 1 FROM patients WHERE patients.id = monjaro_treatments.patient_id AND patients.user_id = auth.uid()));

-- CUSTOM_FIELDS_CONFIG
CREATE POLICY "Everyone can read custom fields config" ON public.custom_fields_config FOR SELECT USING (true);
CREATE POLICY "Admins and master can manage custom fields" ON public.custom_fields_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 7. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('bioimpedance-images', 'bioimpedance-images', false);

-- Storage policies
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bioimpedance-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view images" ON storage.objects FOR SELECT USING (bucket_id = 'bioimpedance-images' AND auth.role() = 'authenticated');
CREATE POLICY "Admins can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'bioimpedance-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- =====================================================
-- 8. DADOS INICIAIS (OPCIONAL - DESCOMENTAR SE QUISER)
-- =====================================================

-- Inserir usuário master (após criar conta via Auth)
-- INSERT INTO public.user_roles (user_id, role) VALUES ('SEU_USER_ID_AQUI', 'admin');

-- =====================================================
-- FIM DA EXPORTAÇÃO
-- =====================================================

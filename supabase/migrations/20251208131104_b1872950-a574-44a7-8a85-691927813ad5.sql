-- Create notifications table
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

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read notifications"
ON public.notifications
FOR SELECT
USING (true);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update notification read status"
ON public.notifications
FOR UPDATE
USING (true);

CREATE POLICY "Only admins can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_notifications_user_date ON public.notifications(user_person, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_person, is_read) WHERE is_read = false;

-- Create function to check for significant changes and create notifications
CREATE OR REPLACE FUNCTION public.check_bioimpedance_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  -- Get the previous record for this user
  SELECT * INTO prev_record
  FROM public.bioimpedance
  WHERE user_person = NEW.user_person
    AND id != NEW.id
  ORDER BY measurement_date DESC
  LIMIT 1;

  -- If no previous record, skip
  IF prev_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Set user name
  user_name := CASE WHEN NEW.user_person = 'reneer' THEN 'Reneer' ELSE 'Ana Paula' END;

  -- Check weight change (threshold: 1kg)
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

  -- Check fat percentage change (threshold: 0.5%)
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

  -- Check muscle percentage change (threshold: 0.5%)
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

  -- Check visceral fat change (threshold: 1)
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

  -- Check BMI milestone changes (every 1 point)
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

-- Create trigger to run after insert on bioimpedance
CREATE TRIGGER trigger_check_bioimpedance_changes
AFTER INSERT ON public.bioimpedance
FOR EACH ROW
EXECUTE FUNCTION public.check_bioimpedance_changes();
-- Migration: create competency_levels table
CREATE TABLE IF NOT EXISTS public.competency_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.competency_levels
  ADD CONSTRAINT competency_levels_user_skill_unique UNIQUE (user_id, skill_name);

-- Optional: enable row level security and a permissive policy for now
ALTER TABLE public.competency_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to competency levels" ON public.competency_levels
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add to realtime publication
ALTER PUBLICATION IF EXISTS supabase_realtime
  ADD TABLE public.competency_levels;

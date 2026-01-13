-- Create visual_kanban_items table
CREATE TABLE public.visual_kanban_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  column_id TEXT NOT NULL DEFAULT 'todo', -- 'todo', 'doing', 'done'
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visual_gut_items table
CREATE TABLE public.visual_gut_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem TEXT NOT NULL,
  gravity INTEGER NOT NULL DEFAULT 3,
  urgency INTEGER NOT NULL DEFAULT 3,
  trend INTEGER NOT NULL DEFAULT 3,
  score INTEGER GENERATED ALWAYS AS (gravity * urgency * trend) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visual_eisenhower_items table
CREATE TABLE public.visual_eisenhower_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task TEXT NOT NULL,
  quadrant TEXT NOT NULL, -- 'do', 'schedule', 'delegate', 'eliminate'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visual_5w2h_items table
CREATE TABLE public.visual_5w2h_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  what TEXT NOT NULL,
  why TEXT,
  "where" TEXT, -- quoted because 'where' is keyword
  "when" TEXT,
  who TEXT,
  how TEXT,
  how_much TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create visual_pareto_items table
CREATE TABLE public.visual_pareto_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cause TEXT NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.visual_kanban_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_gut_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_eisenhower_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_5w2h_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_pareto_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see/manage THEIR OWN items
-- Kanban
CREATE POLICY "Users manage own kanban items" ON public.visual_kanban_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- GUT
CREATE POLICY "Users manage own gut items" ON public.visual_gut_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Eisenhower
CREATE POLICY "Users manage own eisenhower items" ON public.visual_eisenhower_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5W2H
CREATE POLICY "Users manage own 5w2h items" ON public.visual_5w2h_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pareto
CREATE POLICY "Users manage own pareto items" ON public.visual_pareto_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.visual_kanban_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visual_gut_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visual_eisenhower_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visual_5w2h_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visual_pareto_items;

-- Create KPIs table
CREATE TABLE public.kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  current NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  status TEXT CHECK (status IN ('on-track', 'at-risk', 'off-track')) DEFAULT 'on-track',
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- KPI History for charting
CREATE TABLE public.kpi_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_id UUID REFERENCES public.kpis(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(kpi_id, recorded_at)
);

-- Create OKRs table
CREATE TABLE public.okrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objective TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  quarter TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Key Results for OKRs
CREATE TABLE public.key_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  okr_id UUID REFERENCES public.okrs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  current NUMERIC NOT NULL DEFAULT 0,
  target NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  status TEXT CHECK (status IN ('completed', 'on-track', 'at-risk', 'not-started')) DEFAULT 'not-started',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Trainings table
CREATE TABLE public.trainings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  participants_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  duration TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'pending')) DEFAULT 'pending',
  deadline DATE,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admins see all, Users see department)

-- KPIs
CREATE POLICY "Admins manage all KPIs" ON public.kpis FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Managers manage department KPIs" ON public.kpis FOR ALL TO authenticated 
  USING (department_id = public.get_user_department(auth.uid()) AND public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Users view department KPIs" ON public.kpis FOR SELECT TO authenticated USING (department_id = public.get_user_department(auth.uid()));

-- KPI History
CREATE POLICY "KPI History access" ON public.kpi_history FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.kpis WHERE id = kpi_id AND (department_id = public.get_user_department(auth.uid()) OR public.is_admin(auth.uid()))));

-- OKRs
CREATE POLICY "Admins manage all OKRs" ON public.okrs FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Managers manage department OKRs" ON public.okrs FOR ALL TO authenticated 
  USING (department_id = public.get_user_department(auth.uid()) AND public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Users view department OKRs" ON public.okrs FOR SELECT TO authenticated USING (department_id = public.get_user_department(auth.uid()));

-- Key Results
CREATE POLICY "Key Results access" ON public.key_results FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.okrs WHERE id = okr_id AND (department_id = public.get_user_department(auth.uid()) OR public.is_admin(auth.uid()))));

-- Trainings
CREATE POLICY "Admins manage all Trainings" ON public.trainings FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Managers manage department Trainings" ON public.trainings FOR ALL TO authenticated 
  USING (department_id = public.get_user_department(auth.uid()) AND public.has_role(auth.uid(), 'gerente'));
CREATE POLICY "Users view department Trainings" ON public.trainings FOR SELECT TO authenticated USING (department_id = public.get_user_department(auth.uid()));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kpis, public.kpi_history, public.okrs, public.key_results, public.trainings;

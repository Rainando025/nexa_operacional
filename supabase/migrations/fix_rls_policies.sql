-- REMOVER policies antigas que podem estar bloqueando
DROP POLICY IF EXISTS "Admins manage all KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Managers manage department KPIs" ON public.kpis;
DROP POLICY IF EXISTS "Users view department KPIs" ON public.kpis;

-- CRIAR policies permissivas para TESTAR
-- Admins podem fazer tudo
CREATE POLICY "Admins full access to KPIs" ON public.kpis
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Managers podem gerenciar KPIs do departamento
CREATE POLICY "Managers manage department KPIs" ON public.kpis
  FOR ALL TO authenticated
  USING (
    department_id = public.get_user_department(auth.uid()) 
    AND public.has_role(auth.uid(), 'gerente')
  )
  WITH CHECK (
    department_id = public.get_user_department(auth.uid()) 
    AND public.has_role(auth.uid(), 'gerente')
  );

-- TODOS podem INSERIR KPIs (para testar)
CREATE POLICY "Users can insert KPIs" ON public.kpis
  FOR INSERT TO authenticated
  WITH CHECK (department_id = public.get_user_department(auth.uid()));

-- TODOS podem VER KPIs do departamento
CREATE POLICY "Users can view department KPIs" ON public.kpis
  FOR SELECT TO authenticated
  USING (department_id = public.get_user_department(auth.uid()));

-- Fazer o mesmo para OKRs
DROP POLICY IF EXISTS "Admins manage all OKRs" ON public.okrs;
DROP POLICY IF EXISTS "Managers manage department OKRs" ON public.okrs;
DROP POLICY IF EXISTS "Users view department OKRs" ON public.okrs;

CREATE POLICY "Admins full access to OKRs" ON public.okrs
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert OKRs" ON public.okrs
  FOR INSERT TO authenticated
  WITH CHECK (department_id = public.get_user_department(auth.uid()));

CREATE POLICY "Users can view department OKRs" ON public.okrs
  FOR SELECT TO authenticated
  USING (department_id = public.get_user_department(auth.uid()));

-- KPI History - permitir inserção
DROP POLICY IF EXISTS "Users can insert KPI history" ON public.kpi_history;
CREATE POLICY "Users can insert KPI history" ON public.kpi_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view KPI history" ON public.kpi_history
  FOR SELECT TO authenticated
  USING (true);

-- Key Results - permitir inserção
DROP POLICY IF EXISTS "Users can insert key results" ON public.key_results;
CREATE POLICY "Users can insert key results" ON public.key_results
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view key results" ON public.key_results
  FOR SELECT TO authenticated
  USING (true);

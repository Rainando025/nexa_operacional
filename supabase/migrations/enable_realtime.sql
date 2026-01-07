-- Execute APENAS esta parte para habilitar o Realtime nas tabelas existentes

ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.kpis, 
  public.kpi_history, 
  public.okrs, 
  public.key_results, 
  public.trainings,
  public.notifications;

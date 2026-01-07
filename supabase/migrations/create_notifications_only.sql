-- Criar APENAS a tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT NOT NULL,
  read_by_admins UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies para notificações
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado pode inserir notificações
CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins e Managers podem ver todas as notificações
CREATE POLICY "Admins and Managers can view all notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid()) OR 
    public.has_role(auth.uid(), 'gerente')
  );

-- Admins podem atualizar notificações (marcar como lidas)
CREATE POLICY "Admins can update notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Habilitar Realtime APENAS para notifications (as outras já estão habilitadas)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create agenda_events table for calendar events/reminders
CREATE TABLE public.agenda_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view own events"
ON public.agenda_events FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own events
CREATE POLICY "Users can create own events"
ON public.agenda_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events"
ON public.agenda_events FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
ON public.agenda_events FOR DELETE
USING (auth.uid() = user_id);

-- Create mural_posts table for department announcements
CREATE TABLE public.mural_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mural_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view global posts
CREATE POLICY "Anyone can view global posts"
ON public.mural_posts FOR SELECT
USING (is_global = true);

-- Users can view posts from their department
CREATE POLICY "Users can view department posts"
ON public.mural_posts FOR SELECT
USING (department_id = get_user_department(auth.uid()));

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
ON public.mural_posts FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can manage all posts
CREATE POLICY "Admins can manage all posts"
ON public.mural_posts FOR ALL
USING (is_admin(auth.uid()));

-- Managers can create posts for their department
CREATE POLICY "Managers can create department posts"
ON public.mural_posts FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'gerente') AND 
  (department_id = get_user_department(auth.uid()) OR is_global = false)
);

-- Managers can update their own posts
CREATE POLICY "Authors can update own posts"
ON public.mural_posts FOR UPDATE
USING (auth.uid() = author_id);

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
ON public.mural_posts FOR DELETE
USING (auth.uid() = author_id);

-- Add trigger for updated_at
CREATE TRIGGER update_agenda_events_updated_at
BEFORE UPDATE ON public.agenda_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mural_posts_updated_at
BEFORE UPDATE ON public.mural_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
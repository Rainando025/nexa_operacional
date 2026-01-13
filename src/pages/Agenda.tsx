import { useState, useEffect, useCallback, useRef } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Clock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/SearchBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/hooks/useAppStore";
import { cn } from "@/lib/utils";

interface AgendaEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  created_at: string;
  completed: boolean; // new field to track completion
}

export default function Agenda() {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { addNotification } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // For Kanban search
  const [kanbanSearch, setKanbanSearch] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [saving, setSaving] = useState(false);

  // Reminder states
  const [reminderEvent, setReminderEvent] = useState<AgendaEvent | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const remindedEventsRef = useRef<Set<string>>(new Set());



  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);

      const { data, error } = await supabase
        .from("agenda_events")
        .select("*, completed") // fetch completed flag if exists
        .gte("event_date", format(start, "yyyy-MM-dd"))
        .lte("event_date", format(end, "yyyy-MM-dd"))
        .order("event_date")
        .order("event_time");

      if (error) throw error;
      // Ensure completed field exists
      const enriched = (data || []).map((e: any) => ({ ...e, completed: e.completed ?? false }));
      setEvents(enriched);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Erro ao carregar eventos",
        description: (error as Error).message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEventTitle("");
    setEventDescription("");
    setEventTime("");
    setModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventTitle.trim() || !selectedDate || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("agenda_events").insert({
        user_id: user.id,
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        event_date: format(selectedDate, "yyyy-MM-dd"),
        event_time: eventTime || null,
        completed: false,
      });

      if (error) throw error;

      toast({
        title: "Evento criado",
        description: "O evento foi adicionado à sua agenda.",
      });

      addNotification({
        userName: profile?.name || "Usuário",
        action: "CRIOU",
        resource: "Agenda",
        details: `Criou um novo evento: "${eventTitle.trim()}" para o dia ${format(selectedDate, "dd/MM/yyyy")}`,
      });

      setModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        title: "Erro ao salvar evento",
        description: (error as Error).message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("agenda_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      const event = events.find(e => e.id === eventId);
      toast({
        title: "Evento removido",
        description: "O evento foi removido da sua agenda.",
      });

      addNotification({
        userName: profile?.name || "Usuário",
        action: "EXCLUIU",
        resource: "Agenda",
        details: `Removeu o evento: "${event?.title || "Desconhecido"}"`,
      });

      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Erro ao remover evento",
        description: (error as Error).message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate start padding (days from previous month)
  const startDay = monthStart.getDay();
  const paddingDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  // Filter events by search query
  const filteredEvents = searchQuery
    ? events.filter(e =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : events;

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(e => isSameDay(new Date(e.event_date + "T00:00:00"), day));
  };

  // Reminder for upcoming events (next 2 days)
  useEffect(() => {
    const today = new Date();
    const upcoming = events.filter(e => {
      const evDate = new Date(e.event_date + "T00:00:00");
      const diff = (evDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 2 && !e.completed;
    });
    if (upcoming.length) {
      addNotification({
        userName: profile?.name || "Usuário",
        action: "LEMBRETE",
        resource: "Agenda",
        details: `Você tem ${upcoming.length} evento(s) nos próximos 2 dias.`,
      });
    }
  }, [events, profile?.name]);

  // Interval check for exact time reminders (Popup)
  useEffect(() => {
    const checkReminders = () => {
      // Don't trigger reminders while user is adding an event (avoids focus trap/black screen issues)
      if (modalOpen) return;

      const now = new Date();
      // const currentHash = `${format(now, "yyyy-MM-dd")}T${format(now, "HH:mm")}`;

      events.forEach(event => {
        if (!event.event_time || event.completed || remindedEventsRef.current.has(event.id)) return;

        const eventDateStr = event.event_date;
        const eventTimeStr = event.event_time.slice(0, 5); // HH:mm

        const isSameDate = eventDateStr === format(now, "yyyy-MM-dd");
        if (isSameDate && eventTimeStr === format(now, "HH:mm")) {
          setReminderEvent(event);
          setReminderOpen(true);
          remindedEventsRef.current.add(event.id);

          // Optional: Play sound? Not requested but good UX.
        }
      });
    };

    // Check every 10 seconds
    const interval = setInterval(checkReminders, 10000);

    // Initial check
    checkReminders();

    return () => clearInterval(interval);
  }, [events, modalOpen]);

  const dayEvents = selectedDate ? getEventsForDay(selectedDate) : [];


  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Agenda
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus eventos, lembretes e agendamentos
          </p>
        </div>
        {/* Search Bar */}
        <SearchBar placeholder="Buscar eventos..." onSearch={(q) => setSearchQuery(q)} />
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <h2 className="text-xl font-semibold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <Button variant="outline" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          Próximo <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="stat-card p-0 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-secondary/50">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
            <div key={day} className="p-3 text-center font-medium text-sm border-b border-border/50">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Padding days from previous month */}
            {paddingDays.map((day, i) => (
              <div
                key={`padding-${i}`}
                className="min-h-24 p-2 border-b border-r border-border/30 bg-muted/20 opacity-50"
              >
                <span className="text-sm text-muted-foreground">{format(day, "d")}</span>
              </div>
            ))}

            {/* Current month days */}
            {days.map((day) => {
              const dayEventsList = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-24 p-2 border-b border-r border-border/30 cursor-pointer transition-colors hover:bg-primary/5",
                    isToday && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        isToday && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEventsList.length > 0 && (
                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                        {dayEventsList.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEventsList.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded truncate transition-colors",
                          event.completed ? "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30" : "bg-primary/20 text-primary"
                        )}
                        title={event.title}
                      >
                        {event.event_time && (
                          <span className="font-medium mr-1">{event.event_time.slice(0, 5)}</span>
                        )}
                        {event.title}
                      </div>
                    ))}
                    {dayEventsList.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEventsList.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Event Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </DialogTitle>
            <DialogDescription>
              Adicione um novo evento ou veja os eventos do dia
            </DialogDescription>
          </DialogHeader>

          {/* Existing events for selected day */}
          {dayEvents.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              <Label className="text-muted-foreground">Eventos do dia:</Label>
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    {event.event_time && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.event_time.slice(0, 5)}
                      </p>
                    )}
                    {event.description && (
                      <p className="text-sm text-muted-foreground truncate">{event.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div /* onClick={() => setEditingKanban(item.id)} */ className="cursor-pointer flex-1">
                        <p className="font-medium text-sm">{/* {item.title} */}</p> {/* item.title is not defined here */}
                        <p className="text-xs text-muted-foreground mt-1">{/* {item.description} */}</p> {/* item.description is not defined here */}
                      </div>
                      {/* Concluir Button */}
                      <Button variant="ghost" size="icon" onClick={(e) => {
                        e.stopPropagation();
                        // Mark as completed
                        // const updated = { ...item, completed: true }; // item is not defined here
                        // updateKanbanItem(column.id, item.id, "description", updated.description); // column and item are not defined here
                        // Change background via CSS class later
                      }}>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={event.completed ? "default" : "outline"}
                      size="icon"
                      className={cn("h-8 w-8", event.completed && "bg-green-600 hover:bg-green-700")}
                      onClick={async () => {
                        try {
                          const newStatus = !event.completed;
                          const { error } = await supabase
                            .from("agenda_events")
                            .update({ completed: newStatus })
                            .eq("id", event.id);

                          if (error) throw error;

                          // Update local state
                          setEvents(prev => prev.map(e => e.id === event.id ? { ...e, completed: newStatus } : e));

                          toast({
                            title: newStatus ? "Concluído" : "Reaberto",
                            description: newStatus ? "Evento marcado como concluído." : "Evento reaberto.",
                          });
                        } catch (error) {
                          console.error("Error updating event:", error);
                          toast({
                            title: "Erro",
                            description: "Não foi possível atualizar o evento.",
                            variant: "destructive",
                          });
                        }
                      }}
                      title={event.completed ? "Reabrir" : "Concluir"}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-muted-foreground">Novo evento:</Label>
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Título do evento"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Descrição opcional..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleSaveEvent} disabled={saving || !eventTitle.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Adicionar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Reminder Modal */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-md bg-card border-l-4 border-l-primary">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-primary">
              <Clock className="h-6 w-6" />
              Lembrete de Evento
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Você tem um evento agendado para agora.
            </DialogDescription>
          </DialogHeader>

          {reminderEvent && (
            <div className="py-4 space-y-3">
              <div className="bg-secondary/30 p-4 rounded-lg border border-border/50">
                <h3 className="font-semibold text-lg">{reminderEvent.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Clock className="h-4 w-4" />
                  <span>{reminderEvent.event_time?.slice(0, 5)}</span>
                </div>
                {reminderEvent.description && (
                  <p className="mt-2 text-sm text-foreground/80 italic">
                    {reminderEvent.description}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={() => setReminderOpen(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}

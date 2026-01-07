import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface KPI {
  id: string;
  name: string;
  category: string;
  current: number;
  target: number;
  previous: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "on-track" | "at-risk" | "off-track";
  history: { date: string; value: number }[];
}

export interface Training {
  id: string;
  title: string;
  category: "Obrigatório" | "Desenvolvimento" | "Técnico";
  participants: number;
  completed: number;
  duration: string;
  status: "active" | "completed" | "pending";
  deadline: string;
}

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  status: "completed" | "on-track" | "at-risk" | "not-started";
}

export interface OKR {
  id: string;
  objective: string;
  owner: string;
  quarter: string;
  keyResults: KeyResult[];
}

export interface Process {
  id: string;
  name: string;
  department: string;
  owner: string;
  version: string;
  status: "active" | "review" | "draft";
  risk: "low" | "medium" | "high";
  lastReview: string;
  nextReview: string;
  description?: string;
  content?: string;
}

export interface ActionNotification {
  id: string;
  user_name: string;
  action: "CRIOU" | "EDITOU" | "EXCLUIU";
  resource: string;
  details: string;
  timestamp: string;
  read_by_admins: string[]; // UUID array
}

// Initial Data
const initialTrainings: Training[] = [
  {
    id: "1",
    title: "Segurança no Trabalho",
    category: "Obrigatório",
    participants: 45,
    completed: 38,
    duration: "4h",
    status: "active",
    deadline: "15/02/2024",
  },
  {
    id: "2",
    title: "Liderança e Gestão de Equipes",
    category: "Desenvolvimento",
    participants: 20,
    completed: 12,
    duration: "8h",
    status: "active",
    deadline: "28/02/2024",
  },
  {
    id: "3",
    title: "Metodologias Ágeis",
    category: "Técnico",
    participants: 30,
    completed: 30,
    duration: "6h",
    status: "completed",
    deadline: "01/02/2024",
  },
];

const initialKPIs: KPI[] = [
  {
    id: "1",
    name: "Taxa de Produtividade",
    category: "Operacional",
    current: 87,
    target: 90,
    previous: 82,
    unit: "%",
    trend: "up",
    status: "on-track",
    history: [
      { date: "2024-03-01", value: 82 },
      { date: "2024-03-02", value: 83 },
      { date: "2024-03-03", value: 85 },
      { date: "2024-03-04", value: 87 },
    ],
  },
];

// Singleton store with Persistence
const STORAGE_KEY = "nexa_app_store";

const loadFromStorage = (key: string, defaultValue: any) => {
  const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
  return saved ? JSON.parse(saved) : defaultValue;
};

const saveToStorage = (key: string, value: any) => {
  localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(value));
};

let trainings = loadFromStorage("trainings", initialTrainings);
let kpis = loadFromStorage("kpis", initialKPIs);
let okrs = loadFromStorage("okrs", []);
let notifications: ActionNotification[] = [];

let listeners: (() => void)[] = [];

const notifyListeners = () => {
  saveToStorage("trainings", trainings);
  saveToStorage("kpis", kpis);
  saveToStorage("okrs", okrs);
  listeners.forEach((l) => l());
};

// Global fetching for notifications
const fetchNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) throw error;
    notifications = data || [];
    notifyListeners();
  } catch (err) {
    console.error("Error fetching notifications:", err);
  }
};

export function useAppStore() {
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    listeners.push(forceUpdate);
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("global_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          notifications = [payload.new as ActionNotification, ...notifications].slice(0, 50);
          notifyListeners();
        }
      )
      .subscribe();

    return () => {
      listeners = listeners.filter((l) => l !== forceUpdate);
      supabase.removeChannel(channel);
    };
  }, [forceUpdate]);

  const addKPI = useCallback((kpi: Omit<KPI, "id">) => {
    const newKPI = {
      ...kpi,
      id: Date.now().toString(),
      history: kpi.history || [{ date: new Date().toISOString().split('T')[0], value: kpi.current }]
    };
    kpis = [...kpis, newKPI];
    notifyListeners();
  }, []);

  const updateKPI = useCallback((id: string, updates: Partial<KPI>) => {
    kpis = kpis.map((k) => (k.id === id ? { ...k, ...updates } : k));
    notifyListeners();
  }, []);

  const recordKPIValue = useCallback((id: string, value: number, date?: string) => {
    const d = date || new Date().toISOString().split('T')[0];
    kpis = kpis.map((k) => {
      if (k.id === id) {
        const history = [...k.history];
        const existingIndex = history.findIndex((h) => h.date === d);
        if (existingIndex >= 0) {
          history[existingIndex] = { date: d, value };
        } else {
          history.push({ date: d, value });
          history.sort((a, b) => a.date.localeCompare(b.date));
        }

        const latest = history[history.length - 1].value;
        const previous = history.length > 1 ? history[history.length - 2].value : k.previous;
        const trend = latest > previous ? "up" : latest < previous ? "down" : "stable";

        const ratio = latest / k.target;
        const status = ratio >= 0.95 ? "on-track" : ratio >= 0.8 ? "at-risk" : "off-track";

        return { ...k, history, current: latest, previous, trend, status };
      }
      return k;
    });
    notifyListeners();
  }, []);

  const deleteKPI = useCallback((id: string) => {
    kpis = kpis.filter((k) => k.id !== id);
    notifyListeners();
  }, []);

  const addOKR = useCallback((okr: Omit<OKR, "id">) => {
    const newOKR = { ...okr, id: Date.now().toString() };
    okrs = [...okrs, newOKR];
    notifyListeners();
  }, []);

  const updateOKR = useCallback((id: string, updates: Partial<OKR>) => {
    okrs = okrs.map((o) => (o.id === id ? { ...o, ...updates } : o));
    notifyListeners();
  }, []);

  const deleteOKR = useCallback((id: string) => {
    okrs = okrs.filter((o) => o.id !== id);
    notifyListeners();
  }, []);

  const addNotification = useCallback(async (notification: Omit<ActionNotification, "id" | "timestamp" | "read_by_admins">) => {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_name: notification.user_name,
        action: notification.action,
        resource: notification.resource,
        details: notification.details,
      });
      if (error) throw error;
      // Realtime listener will handle local update
    } catch (err) {
      console.error("Error adding notification:", err);
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async (adminId: string) => {
    try {
      // Logic for read_by_admins array in DB is more complex than a simple local read=true
      // For now, let's keep it simple or implement the array update
      const { error } = await supabase.rpc('mark_notifications_read', { admin_id: adminId });
      if (error) throw error;
      fetchNotifications();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  }, []);

  return {
    trainings,
    kpis,
    okrs,
    addTraining: (t: any) => { trainings = [...trainings, { ...t, id: Date.now().toString() }]; notifyListeners(); },
    updateTraining: (id: string, u: any) => { trainings = trainings.map(t => t.id === id ? { ...t, ...u } : t); notifyListeners(); },
    deleteTraining: (id: string) => { trainings = trainings.filter(t => t.id !== id); notifyListeners(); },
    addKPI,
    updateKPI,
    recordKPIValue,
    deleteKPI,
    addOKR,
    updateOKR,
    deleteOKR,
    notifications,
    addNotification,
    markAllNotificationsAsRead,
    refreshNotifications: fetchNotifications,
  };
}

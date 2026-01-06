import { useState, useCallback } from "react";

// Types
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

// ... rest of interfaces ...
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
  {
    id: "4",
    title: "Excel Avançado",
    category: "Técnico",
    participants: 25,
    completed: 18,
    duration: "10h",
    status: "active",
    deadline: "20/02/2024",
  },
  {
    id: "5",
    title: "Comunicação Efetiva",
    category: "Desenvolvimento",
    participants: 50,
    completed: 0,
    duration: "3h",
    status: "pending",
    deadline: "01/03/2024",
  },
  {
    id: "6",
    title: "Qualidade Total",
    category: "Obrigatório",
    participants: 60,
    completed: 55,
    duration: "5h",
    status: "active",
    deadline: "10/02/2024",
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
  {
    id: "2",
    name: "Índice de Qualidade",
    category: "Qualidade",
    current: 94,
    target: 95,
    previous: 91,
    unit: "%",
    trend: "up",
    status: "on-track",
    history: [
      { date: "2024-03-01", value: 91 },
      { date: "2024-03-02", value: 92 },
      { date: "2024-03-03", value: 93 },
      { date: "2024-03-04", value: 94 },
    ],
  },
  {
    id: "3",
    name: "Tempo Médio de Entrega",
    category: "Logística",
    current: 2.8,
    target: 2.5,
    previous: 3.2,
    unit: "dias",
    trend: "down",
    status: "at-risk",
    history: [
      { date: "2024-03-01", value: 3.2 },
      { date: "2024-03-02", value: 3.1 },
      { date: "2024-03-03", value: 2.9 },
      { date: "2024-03-04", value: 2.8 },
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
let okrs = loadFromStorage("okrs", []); // OKRs history not needed for now

let listeners: (() => void)[] = [];

const notifyListeners = () => {
  saveToStorage("trainings", trainings);
  saveToStorage("kpis", kpis);
  saveToStorage("okrs", okrs);
  listeners.forEach((l) => l());
};

export function useAppStore() {
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Subscribe to changes
  useState(() => {
    listeners.push(forceUpdate);
    return () => {
      listeners = listeners.filter((l) => l !== forceUpdate);
    };
  });

  // KPIs
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

        // Update current value to the latest recorded one
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

  // OKRs
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

  return {
    trainings,
    kpis,
    okrs,
    addTraining: (t: any) => { trainings = [...trainings, { ...t, id: Date.now().toString() }]; notifyListeners(); }, // Simplified for brevity
    updateTraining: (id: string, u: any) => { trainings = trainings.map(t => t.id === id ? { ...t, ...u } : t); notifyListeners(); },
    deleteTraining: (id: string) => { trainings = trainings.filter(t => t.id !== id); notifyListeners(); },
    addKPI,
    updateKPI,
    recordKPIValue,
    deleteKPI,
    addOKR,
    updateOKR,
    deleteOKR,
  };
}


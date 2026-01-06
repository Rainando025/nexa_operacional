import { useState, useCallback } from "react";

// Types
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
  },
  {
    id: "4",
    name: "Satisfação do Cliente",
    category: "Atendimento",
    current: 4.5,
    target: 4.7,
    previous: 4.3,
    unit: "/5",
    trend: "up",
    status: "on-track",
  },
  {
    id: "5",
    name: "Taxa de Retrabalho",
    category: "Qualidade",
    current: 8,
    target: 5,
    previous: 10,
    unit: "%",
    trend: "down",
    status: "off-track",
  },
  {
    id: "6",
    name: "Custo por Unidade",
    category: "Financeiro",
    current: 45.5,
    target: 42,
    previous: 48,
    unit: "R$",
    trend: "down",
    status: "at-risk",
  },
];

const initialOKRs: OKR[] = [
  {
    id: "1",
    objective: "Aumentar a eficiência operacional em 25%",
    owner: "Equipe Operações",
    quarter: "Q1 2024",
    keyResults: [
      { id: "1a", title: "Reduzir tempo de ciclo de produção", current: 18, target: 15, unit: "min", status: "on-track" },
      { id: "1b", title: "Aumentar taxa de utilização de máquinas", current: 85, target: 92, unit: "%", status: "on-track" },
      { id: "1c", title: "Diminuir retrabalho", current: 5, target: 3, unit: "%", status: "at-risk" },
    ],
  },
  {
    id: "2",
    objective: "Melhorar a satisfação do cliente para NPS 70+",
    owner: "Equipe Atendimento",
    quarter: "Q1 2024",
    keyResults: [
      { id: "2a", title: "Atingir NPS de 70", current: 65, target: 70, unit: "pts", status: "on-track" },
      { id: "2b", title: "Reduzir tempo de resposta", current: 2, target: 1, unit: "h", status: "at-risk" },
      { id: "2c", title: "Aumentar taxa de resolução no primeiro contato", current: 80, target: 85, unit: "%", status: "completed" },
    ],
  },
  {
    id: "3",
    objective: "Desenvolver cultura de melhoria contínua",
    owner: "RH",
    quarter: "Q1 2024",
    keyResults: [
      { id: "3a", title: "Implementar programa de sugestões", current: 100, target: 100, unit: "%", status: "completed" },
      { id: "3b", title: "Treinar 100% dos líderes em Lean", current: 75, target: 100, unit: "%", status: "on-track" },
      { id: "3c", title: "Realizar 12 Kaizens", current: 8, target: 12, unit: "eventos", status: "on-track" },
    ],
  },
];

// Singleton store
let trainings = [...initialTrainings];
let kpis = [...initialKPIs];
let okrs = [...initialOKRs];
let listeners: (() => void)[] = [];

const notifyListeners = () => {
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

  // Trainings
  const addTraining = useCallback((training: Omit<Training, "id">) => {
    const newTraining = { ...training, id: Date.now().toString() };
    trainings = [...trainings, newTraining];
    notifyListeners();
  }, []);

  const updateTraining = useCallback((id: string, updates: Partial<Training>) => {
    trainings = trainings.map((t) => (t.id === id ? { ...t, ...updates } : t));
    notifyListeners();
  }, []);

  const deleteTraining = useCallback((id: string) => {
    trainings = trainings.filter((t) => t.id !== id);
    notifyListeners();
  }, []);

  // KPIs
  const addKPI = useCallback((kpi: Omit<KPI, "id">) => {
    const newKPI = { ...kpi, id: Date.now().toString() };
    kpis = [...kpis, newKPI];
    notifyListeners();
  }, []);

  const updateKPI = useCallback((id: string, updates: Partial<KPI>) => {
    kpis = kpis.map((k) => (k.id === id ? { ...k, ...updates } : k));
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
    addTraining,
    updateTraining,
    deleteTraining,
    addKPI,
    updateKPI,
    deleteKPI,
    addOKR,
    updateOKR,
    deleteOKR,
  };
}

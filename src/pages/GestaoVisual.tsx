import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Table2,
  Target,
  Clock,
  BarChart3,
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Edit,
  Check,
  X,
  Share2,
  Box,
  MousePointer2,
  Type,
  Link,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/hooks/useAppStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Types
interface KanbanItem {
  id: string;
  title: string;
  description: string;
  assignee?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

interface GUTItem {
  id: string;
  problem: string;
  gravity: number;
  urgency: number;
  trend: number;
  score: number;
}

interface EisenhowerItem {
  id: string;
  task: string;
  quadrant: "do" | "schedule" | "delegate" | "eliminate";
}

interface W5H2Item {
  id: string;
  what: string;
  why: string;
  where: string;
  when: string;
  who: string;
  how: string;
  howMuch: string;
}

interface ParetoItem {
  id: string;
  cause: string;
  frequency: number;
  percentage?: number;
  cumulative?: number;
}

interface FlowNode {
  id: string;
  type: "process" | "decision" | "start" | "end" | "document";
  label: string;
  x: number;
  y: number;
}

interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
}

// Initial data
const initialKanban: KanbanColumn[] = [
  {
    id: "todo",
    title: "A Fazer",
    items: [
      { id: "k1", title: "Revisar processo de compras", description: "Análise completa do fluxo atual" },
      { id: "k2", title: "Treinar equipe em 5S", description: "Capacitação para nova metodologia" },
      { id: "k3", title: "Mapear desperdícios", description: "Identificar gargalos na produção" },
    ],
  },
  {
    id: "doing",
    title: "Fazendo",
    items: [
      { id: "k4", title: "Implementar Kanban físico", description: "Instalar quadros na fábrica", assignee: "João" },
    ],
  },
  {
    id: "done",
    title: "Feito",
    items: [
      { id: "k5", title: "Atualizar procedimentos", description: "Documentar novos processos" },
      { id: "k6", title: "Análise de indicadores", description: "Relatório mensal completo" },
    ],
  },
];

const initialGUT: GUTItem[] = [
  { id: "g1", problem: "Alto índice de retrabalho na linha A", gravity: 5, urgency: 5, trend: 4, score: 100 },
  { id: "g2", problem: "Atraso nas entregas de fornecedores", gravity: 4, urgency: 5, trend: 3, score: 60 },
  { id: "g3", problem: "Falta de treinamento em qualidade", gravity: 3, urgency: 3, trend: 4, score: 36 },
  { id: "g4", problem: "Sistema de gestão desatualizado", gravity: 4, urgency: 3, trend: 5, score: 60 },
  { id: "g5", problem: "Comunicação interna deficiente", gravity: 3, urgency: 4, trend: 3, score: 36 },
];

const initialEisenhower: EisenhowerItem[] = [
  { id: "e1", task: "Resolver reclamação urgente do cliente", quadrant: "do" },
  { id: "e2", task: "Planejamento estratégico anual", quadrant: "schedule" },
  { id: "e3", task: "Responder emails de rotina", quadrant: "delegate" },
  { id: "e4", task: "Reuniões sem pauta definida", quadrant: "eliminate" },
  { id: "e5", task: "Treinamento de equipe", quadrant: "schedule" },
  { id: "e6", task: "Auditoria de emergência", quadrant: "do" },
];

const initialW5H2: W5H2Item[] = [
  {
    id: "w1",
    what: "Implementar sistema de gestão de qualidade",
    why: "Reduzir defeitos e melhorar satisfação do cliente",
    where: "Linha de produção A e B",
    when: "Q1 2024",
    who: "Equipe de Qualidade",
    how: "Treinamento + novas ferramentas de inspeção",
    howMuch: "R$ 50.000",
  },
  {
    id: "w2",
    what: "Automatizar processo de pedidos",
    why: "Eliminar erros manuais e acelerar processamento",
    where: "Departamento Comercial",
    when: "Março 2024",
    who: "TI + Vendas",
    how: "Implementação de ERP integrado",
    howMuch: "R$ 120.000",
  },
];

const initialPareto: ParetoItem[] = [
  { id: "p1", cause: "Falha de máquina", frequency: 45 },
  { id: "p2", cause: "Erro de operador", frequency: 30 },
  { id: "p3", cause: "Material defeituoso", frequency: 15 },
  { id: "p4", cause: "Falta de treinamento", frequency: 7 },
  { id: "p5", cause: "Outros", frequency: 3 },
];


export default function GestaoVisual() {
  const { profile } = useAuth();
  const { addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState("kanban");
  const [kanbanData, setKanbanData] = useState<KanbanColumn[]>(initialKanban);
  const [gutData, setGutData] = useState<GUTItem[]>(initialGUT);
  const [eisenhowerData, setEisenhowerData] = useState<EisenhowerItem[]>(initialEisenhower);
  const [w5h2Data, setW5H2Data] = useState<W5H2Item[]>(initialW5H2);
  const [paretoData, setParetoData] = useState<ParetoItem[]>(initialPareto);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [edges, setEdges] = useState<FlowEdge[]>([]);
  const [zoom, setZoom] = useState(1);

  // Dialog states
  const [newKanbanItem, setNewKanbanItem] = useState<{ title: string; description: string; columnId: string }>({ title: "", description: "", columnId: "todo" });
  const [newGutItem, setNewGutItem] = useState({ problem: "", gravity: 3, urgency: 3, trend: 3 });
  const [newEisenhowerItem, setNewEisenhowerItem] = useState<{ task: string; quadrant: EisenhowerItem["quadrant"] }>({ task: "", quadrant: "do" });
  const [newW5H2Item, setNewW5H2Item] = useState<Omit<W5H2Item, "id">>({ what: "", why: "", where: "", when: "", who: "", how: "", howMuch: "" });
  const [newParetoItem, setNewParetoItem] = useState({ cause: "", frequency: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Edit states
  const [editingGut, setEditingGut] = useState<string | null>(null);
  const [editingEisenhower, setEditingEisenhower] = useState<string | null>(null);
  const [editingW5H2, setEditingW5H2] = useState<string | null>(null);
  const [editingPareto, setEditingPareto] = useState<string | null>(null);
  const [editingKanban, setEditingKanban] = useState<string | null>(null);

  // Calculate Pareto percentages with memoization
  const paretoWithCalcs = useMemo(() => {
    const total = paretoData.reduce((acc, item) => acc + item.frequency, 0);
    let cumulative = 0;
    return [...paretoData]
      .sort((a, b) => b.frequency - a.frequency)
      .map((item) => {
        const percentage = (item.frequency / total) * 100;
        cumulative += percentage;
        return { ...item, percentage, cumulative };
      });
  }, [paretoData]);

  // Memoized sorted GUT data
  const sortedGutData = useMemo(() => {
    return [...gutData].sort((a, b) => b.score - a.score);
  }, [gutData]);

  // Add functions
  const addKanbanItem = () => {
    const newItem: KanbanItem = {
      id: `k${Date.now()}`,
      title: newKanbanItem.title,
      description: newKanbanItem.description,
    };
    setKanbanData((prev) =>
      prev.map((col) =>
        col.id === newKanbanItem.columnId ? { ...col, items: [...col.items, newItem] } : col
      )
    );
    addNotification({
      userName: profile?.name || "Usuário",
      action: "CRIOU",
      resource: "Kanban",
      details: `Criou uma nova tarefa: "${newItem.title}"`,
    });
    setNewKanbanItem({ title: "", description: "", columnId: "todo" });
    setDialogOpen(false);
  };

  const addGutItem = () => {
    const score = newGutItem.gravity * newGutItem.urgency * newGutItem.trend;
    const newItem: GUTItem = {
      id: `g${Date.now()}`,
      ...newGutItem,
      score,
    };
    setGutData((prev) => [...prev, newItem].sort((a, b) => b.score - a.score));
    addNotification({
      userName: profile?.name || "Usuário",
      action: "CRIOU",
      resource: "Matriz GUT",
      details: `Adicionou um problema à Matriz GUT: "${newItem.problem}"`,
    });
    setNewGutItem({ problem: "", gravity: 3, urgency: 3, trend: 3 });
    setDialogOpen(false);
  };

  const addEisenhowerItem = () => {
    const newItem: EisenhowerItem = {
      id: `e${Date.now()}`,
      task: newEisenhowerItem.task,
      quadrant: newEisenhowerItem.quadrant,
    };
    setEisenhowerData((prev) => [...prev, newItem]);
    addNotification({
      userName: profile?.name || "Usuário",
      action: "CRIOU",
      resource: "Eisenhower",
      details: `Adicionou uma tarefa à Matriz Eisenhower: "${newItem.task}"`,
    });
    setNewEisenhowerItem({ task: "", quadrant: "do" });
    setDialogOpen(false);
  };

  const addW5H2Item = () => {
    const newItem: W5H2Item = {
      id: `w${Date.now()}`,
      ...newW5H2Item,
    };
    setW5H2Data((prev) => [...prev, newItem]);
    addNotification({
      userName: profile?.name || "Usuário",
      action: "CRIOU",
      resource: "W5H2",
      details: `Adicionou um plano de ação (W5H2): "${newItem.what}"`,
    });
    setNewW5H2Item({ what: "", why: "", where: "", when: "", who: "", how: "", howMuch: "" });
    setDialogOpen(false);
  };

  const addParetoItem = () => {
    const newItem: ParetoItem = {
      id: `p${Date.now()}`,
      cause: newParetoItem.cause,
      frequency: newParetoItem.frequency,
    };
    setParetoData((prev) => [...prev, newItem]);
    addNotification({
      userName: profile?.name || "Usuário",
      action: "CRIOU",
      resource: "Pareto",
      details: `Adicionou uma causa ao Diagrama de Pareto: "${newItem.cause}"`,
    });
    setNewParetoItem({ cause: "", frequency: 0 });
    setDialogOpen(false);
  };

  // Delete functions
  const deleteKanbanItem = (columnId: string, itemId: string) => {
    const column = kanbanData.find(c => c.id === columnId);
    const item = column?.items.find(i => i.id === itemId);
    setKanbanData((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, items: col.items.filter((item) => item.id !== itemId) } : col
      )
    );
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EXCLUIU",
      resource: "Kanban",
      details: `Excluiu a tarefa: "${item?.title || "Desconhecida"}"`,
    });
  };

  const deleteGutItem = (id: string) => {
    const item = gutData.find(i => i.id === id);
    setGutData((prev) => prev.filter((item) => item.id !== id));
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EXCLUIU",
      resource: "Matriz GUT",
      details: `Excluiu o problema: "${item?.problem || "Desconhecido"}"`,
    });
  };

  const deleteEisenhowerItem = (id: string) => {
    const item = eisenhowerData.find(i => i.id === id);
    setEisenhowerData((prev) => prev.filter((item) => item.id !== id));
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EXCLUIU",
      resource: "Eisenhower",
      details: `Excluiu a tarefa: "${item?.task || "Desconhecida"}"`,
    });
  };

  const deleteW5H2Item = (id: string) => {
    const item = w5h2Data.find(i => i.id === id);
    setW5H2Data((prev) => prev.filter((item) => item.id !== id));
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EXCLUIU",
      resource: "W5H2",
      details: `Excluiu o plano de ação: "${item?.what || "Desconhecido"}"`,
    });
  };

  const deleteParetoItem = (id: string) => {
    const item = paretoData.find(i => i.id === id);
    setParetoData((prev) => prev.filter((item) => item.id !== id));
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EXCLUIU",
      resource: "Pareto",
      details: `Excluiu a causa: "${item?.cause || "Desconhecida"}"`,
    });
  };

  // Update functions
  const updateGutItem = (id: string, field: keyof GUTItem, value: number | string) => {
    setGutData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "gravity" || field === "urgency" || field === "trend") {
          updated.score = updated.gravity * updated.urgency * updated.trend;
        }
        return updated;
      }).sort((a, b) => b.score - a.score)
    );
  };

  const updateEisenhowerItem = (id: string, task: string) => {
    setEisenhowerData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, task } : item))
    );
  };

  const updateW5H2Item = (id: string, field: keyof W5H2Item, value: string) => {
    setW5H2Data((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updateParetoItem = (id: string, field: "cause" | "frequency", value: string | number) => {
    setParetoData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updateKanbanItem = (columnId: string, itemId: string, field: keyof KanbanItem, value: string) => {
    setKanbanData((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? {
            ...col,
            items: col.items.map((item) =>
              item.id === itemId ? { ...item, [field]: value } : item
            ),
          }
          : col
      )
    );
  };

  // Move Kanban item between columns (status)
  const moveKanbanItem = (itemId: string, fromColumn: string, toColumn: string) => {
    if (fromColumn === toColumn) return;

    const item = kanbanData
      .find((col) => col.id === fromColumn)
      ?.items.find((i) => i.id === itemId);

    if (!item) return;

    setKanbanData((prev) =>
      prev.map((col) => {
        if (col.id === fromColumn) {
          return { ...col, items: col.items.filter((i) => i.id !== itemId) };
        }
        if (col.id === toColumn) {
          return { ...col, items: [...col.items, item] };
        }
        return col;
      })
    );

    const targetCol = kanbanData.find((c) => c.id === toColumn);
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EDITOU",
      resource: "Kanban",
      details: `Moveu a tarefa "${item.title}" para "${targetCol?.title || toColumn}"`,
    });
  };

  const renderAddDialog = () => {
    switch (activeTab) {
      case "kanban":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newKanbanItem.title}
                onChange={(e) => setNewKanbanItem((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título da tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newKanbanItem.description}
                onChange={(e) => setNewKanbanItem((p) => ({ ...p, description: e.target.value }))}
                placeholder="Descrição da tarefa"
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium">Coluna</label>
                <Select
                  value={newKanbanItem.columnId}
                  onValueChange={(v) => setNewKanbanItem((p) => ({ ...p, columnId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kanbanData.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={addKanbanItem} className="w-full">
              Adicionar Item
            </Button>
          </div>
        );

      case "gut":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Problema</label>
              <Input
                value={newGutItem.problem}
                onChange={(e) => setNewGutItem((p) => ({ ...p, problem: e.target.value }))}
                placeholder="Descreva o problema"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Gravidade (1-5)</label>
                <Select
                  value={newGutItem.gravity.toString()}
                  onValueChange={(v) => setNewGutItem((p) => ({ ...p, gravity: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Urgência (1-5)</label>
                <Select
                  value={newGutItem.urgency.toString()}
                  onValueChange={(v) => setNewGutItem((p) => ({ ...p, urgency: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tendência (1-5)</label>
                <Select
                  value={newGutItem.trend.toString()}
                  onValueChange={(v) => setNewGutItem((p) => ({ ...p, trend: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Score: {newGutItem.gravity * newGutItem.urgency * newGutItem.trend}
            </p>
            <Button onClick={addGutItem} className="w-full">
              Adicionar Problema
            </Button>
          </div>
        );

      case "eisenhower":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tarefa</label>
              <Input
                value={newEisenhowerItem.task}
                onChange={(e) => setNewEisenhowerItem((p) => ({ ...p, task: e.target.value }))}
                placeholder="Descreva a tarefa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quadrante</label>
              <Select
                value={newEisenhowerItem.quadrant}
                onValueChange={(v) => setNewEisenhowerItem((p) => ({ ...p, quadrant: v as EisenhowerItem["quadrant"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="do">Fazer (Urgente + Importante)</SelectItem>
                  <SelectItem value="schedule">Agendar (Importante)</SelectItem>
                  <SelectItem value="delegate">Delegar (Urgente)</SelectItem>
                  <SelectItem value="eliminate">Eliminar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addEisenhowerItem} className="w-full">
              Adicionar Tarefa
            </Button>
          </div>
        );

      case "5w2h":
        return (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium">What (O quê?)</label>
              <Input
                value={newW5H2Item.what}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, what: e.target.value }))}
                placeholder="O que será feito?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Why (Por quê?)</label>
              <Input
                value={newW5H2Item.why}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, why: e.target.value }))}
                placeholder="Por que será feito?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Where (Onde?)</label>
              <Input
                value={newW5H2Item.where}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, where: e.target.value }))}
                placeholder="Onde será feito?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">When (Quando?)</label>
              <Input
                value={newW5H2Item.when}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, when: e.target.value }))}
                placeholder="Quando será feito?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Who (Quem?)</label>
              <Input
                value={newW5H2Item.who}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, who: e.target.value }))}
                placeholder="Quem fará?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">How (Como?)</label>
              <Textarea
                value={newW5H2Item.how}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, how: e.target.value }))}
                placeholder="Como será feito?"
              />
            </div>
            <div>
              <label className="text-sm font-medium">How Much (Quanto custa?)</label>
              <Input
                value={newW5H2Item.howMuch}
                onChange={(e) => setNewW5H2Item((p) => ({ ...p, howMuch: e.target.value }))}
                placeholder="Quanto custará?"
              />
            </div>
            <Button onClick={addW5H2Item} className="w-full">
              Adicionar Plano
            </Button>
          </div>
        );

      case "pareto":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Causa</label>
              <Input
                value={newParetoItem.cause}
                onChange={(e) => setNewParetoItem((p) => ({ ...p, cause: e.target.value }))}
                placeholder="Descreva a causa"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Frequência</label>
              <Input
                type="number"
                value={newParetoItem.frequency}
                onChange={(e) => setNewParetoItem((p) => ({ ...p, frequency: parseInt(e.target.value) || 0 }))}
                placeholder="Número de ocorrências"
              />
            </div>
            <Button onClick={addParetoItem} className="w-full">
              Adicionar Causa
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão Visual</h1>
          <p className="text-muted-foreground mt-1">
            Ferramentas visuais para gestão de processos e tomada de decisão
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Adicionar{" "}
                {activeTab === "kanban" && "Tarefa"}
                {activeTab === "gut" && "Problema GUT"}
                {activeTab === "eisenhower" && "Tarefa Eisenhower"}
                {activeTab === "5w2h" && "Plano 5W2H"}
                {activeTab === "pareto" && "Causa Pareto"}
              </DialogTitle>
            </DialogHeader>
            {renderAddDialog()}
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
          <TabsTrigger value="kanban" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Kanban</span>
          </TabsTrigger>
          <TabsTrigger value="gut" className="gap-2">
            <Table2 className="h-4 w-4" />
            <span className="hidden sm:inline">Matriz GUT</span>
          </TabsTrigger>
          <TabsTrigger value="eisenhower" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Eisenhower</span>
          </TabsTrigger>
          <TabsTrigger value="5w2h" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">5W2H</span>
          </TabsTrigger>
          <TabsTrigger value="pareto" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Pareto</span>
          </TabsTrigger>
          <TabsTrigger value="fluxograma" className="gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Fluxograma</span>
          </TabsTrigger>
        </TabsList>

        {/* Kanban */}
        <TabsContent value="kanban" className="space-y-4">
          <p className="text-sm text-muted-foreground">Edite o card e selecione o status (coluna)</p>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanData.map((column) => (
              <div
                key={column.id}
                className={cn(
                  "flex-shrink-0 w-72 bg-secondary/30 rounded-lg p-4 space-y-3 border-t-4",
                  column.id === "todo" && "border-t-gray-400",
                  column.id === "doing" && "border-t-orange-500",
                  column.id === "done" && "border-t-green-500"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{column.title}</h3>
                  <Badge variant="secondary">{column.items.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {column.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "stat-card p-3 hover:shadow-lg transition-all group border-l-4",
                        column.id === "todo" && "border-l-gray-400",
                        column.id === "doing" && "border-l-orange-500",
                        column.id === "done" && "border-l-green-500",
                        editingKanban === item.id && "cursor-default"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          {editingKanban === item.id ? (
                            <div className="space-y-2">
                              <Input
                                value={item.title}
                                onChange={(e) => updateKanbanItem(column.id, item.id, "title", e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 text-sm font-medium"
                                placeholder="Título"
                              />
                              <Textarea
                                value={item.description}
                                onChange={(e) => updateKanbanItem(column.id, item.id, "description", e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                                className="text-xs min-h-[40px]"
                                placeholder="Descrição"
                              />
                              <Button
                                size="sm"
                                className="w-full h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingKanban(null);
                                }}
                              >
                                <Check className="h-3 w-3 mr-1" /> Salvar
                              </Button>
                            </div>
                          ) : (
                            <div onClick={() => setEditingKanban(item.id)} className="cursor-pointer">
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 truncate">{item.description}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {editingKanban !== item.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingKanban(item.id);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteKanbanItem(column.id, item.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* GUT Matrix */}
        <TabsContent value="gut" className="space-y-4">
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Tabela GUT */}
            <div className="stat-card p-0 overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Problema</th>
                    <th className="text-center p-4 font-medium w-16">G</th>
                    <th className="text-center p-4 font-medium w-16">U</th>
                    <th className="text-center p-4 font-medium w-16">T</th>
                    <th className="text-center p-4 font-medium w-20">Score</th>
                    <th className="text-center p-4 font-medium w-16">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedGutData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-t border-border/50 hover:bg-secondary/30 transition-colors",
                        index === 0 && "bg-destructive/5"
                      )}
                    >
                      <td className="p-4">
                        {editingGut === item.id ? (
                          <Input
                            value={item.problem}
                            onChange={(e) => updateGutItem(item.id, "problem", e.target.value)}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingGut(item.id)}>
                            {index === 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            <span className="text-sm truncate max-w-[150px]">{item.problem}</span>
                            <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </td>
                      <td className="text-center p-2">
                        <Select
                          value={item.gravity.toString()}
                          onValueChange={(v) => updateGutItem(item.id, "gravity", parseInt(v))}
                        >
                          <SelectTrigger className="w-14 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-center p-2">
                        <Select
                          value={item.urgency.toString()}
                          onValueChange={(v) => updateGutItem(item.id, "urgency", parseInt(v))}
                        >
                          <SelectTrigger className="w-14 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-center p-2">
                        <Select
                          value={item.trend.toString()}
                          onValueChange={(v) => updateGutItem(item.id, "trend", parseInt(v))}
                        >
                          <SelectTrigger className="w-14 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-center p-4">
                        <Badge
                          className={cn(
                            item.score >= 80 ? "bg-destructive/10 text-destructive" :
                              item.score >= 40 ? "bg-warning/10 text-warning" :
                                "bg-success/10 text-success"
                          )}
                        >
                          {item.score}
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center gap-1 justify-center">
                          {editingGut === item.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingGut(null)}
                            >
                              <Check className="h-3 w-3 text-success" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteGutItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Radar Chart GUT */}
            <div className="stat-card">
              <h3 className="font-semibold mb-4">Análise Radar GUT</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={sortedGutData.slice(0, 5).map(item => ({
                    problem: item.problem.substring(0, 15) + (item.problem.length > 15 ? '...' : ''),
                    Gravidade: item.gravity,
                    Urgência: item.urgency,
                    Tendência: item.trend,
                  }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="problem"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 5]}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    />
                    <Radar name="Gravidade" dataKey="Gravidade" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                    <Radar name="Urgência" dataKey="Urgência" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.3} />
                    <Radar name="Tendência" dataKey="Tendência" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Score Bar Chart */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4">Score GUT por Problema</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedGutData.map(item => ({
                  name: item.problem.substring(0, 20) + (item.problem.length > 20 ? '...' : ''),
                  score: item.score,
                  fill: item.score >= 80 ? 'hsl(var(--destructive))' : item.score >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--success))'
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    domain={[0, 125]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="stat-card">
              <h4 className="font-medium mb-2">Gravidade (G)</h4>
              <p className="text-muted-foreground text-xs">
                1 = Sem gravidade | 5 = Extremamente grave
              </p>
            </div>
            <div className="stat-card">
              <h4 className="font-medium mb-2">Urgência (U)</h4>
              <p className="text-muted-foreground text-xs">
                1 = Pode esperar | 5 = Ação imediata
              </p>
            </div>
            <div className="stat-card">
              <h4 className="font-medium mb-2">Tendência (T)</h4>
              <p className="text-muted-foreground text-xs">
                1 = Não vai piorar | 5 = Piora rápida
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Eisenhower Matrix */}
        <TabsContent value="eisenhower" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Do - Urgent & Important */}
            <div className="stat-card border-2 border-destructive/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold">FAZER</h3>
                  <p className="text-xs text-muted-foreground">Urgente + Importante</p>
                </div>
              </div>
              <div className="space-y-2">
                {eisenhowerData.filter((i) => i.quadrant === "do").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/5 rounded group">
                    {editingEisenhower === item.id ? (
                      <Input
                        value={item.task}
                        onChange={(e) => updateEisenhowerItem(item.id, e.target.value)}
                        className="h-7 text-sm flex-1 mr-2"
                        onBlur={() => setEditingEisenhower(null)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm cursor-pointer hover:text-primary flex-1"
                        onClick={() => setEditingEisenhower(item.id)}
                      >
                        {item.task}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {editingEisenhower !== item.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEisenhower(item.id);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEisenhowerItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule - Important but not urgent */}
            <div className="stat-card border-2 border-primary/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AGENDAR</h3>
                  <p className="text-xs text-muted-foreground">Importante</p>
                </div>
              </div>
              <div className="space-y-2">
                {eisenhowerData.filter((i) => i.quadrant === "schedule").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-primary/5 rounded group">
                    {editingEisenhower === item.id ? (
                      <Input
                        value={item.task}
                        onChange={(e) => updateEisenhowerItem(item.id, e.target.value)}
                        className="h-7 text-sm flex-1 mr-2"
                        onBlur={() => setEditingEisenhower(null)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm cursor-pointer hover:text-primary flex-1"
                        onClick={() => setEditingEisenhower(item.id)}
                      >
                        {item.task}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {editingEisenhower !== item.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEisenhower(item.id);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEisenhowerItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delegate - Urgent but not important */}
            <div className="stat-card border-2 border-warning/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded bg-warning/10 flex items-center justify-center">
                  <Circle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">DELEGAR</h3>
                  <p className="text-xs text-muted-foreground">Urgente</p>
                </div>
              </div>
              <div className="space-y-2">
                {eisenhowerData.filter((i) => i.quadrant === "delegate").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-warning/5 rounded group">
                    {editingEisenhower === item.id ? (
                      <Input
                        value={item.task}
                        onChange={(e) => updateEisenhowerItem(item.id, e.target.value)}
                        className="h-7 text-sm flex-1 mr-2"
                        onBlur={() => setEditingEisenhower(null)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm cursor-pointer hover:text-primary flex-1"
                        onClick={() => setEditingEisenhower(item.id)}
                      >
                        {item.task}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {editingEisenhower !== item.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEisenhower(item.id);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEisenhowerItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Eliminate - Neither urgent nor important */}
            <div className="stat-card border-2 border-muted/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">ELIMINAR</h3>
                  <p className="text-xs text-muted-foreground">Nem Urgente nem Importante</p>
                </div>
              </div>
              <div className="space-y-2">
                {eisenhowerData.filter((i) => i.quadrant === "eliminate").map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/20 rounded group">
                    {editingEisenhower === item.id ? (
                      <Input
                        value={item.task}
                        onChange={(e) => updateEisenhowerItem(item.id, e.target.value)}
                        className="h-7 text-sm flex-1 mr-2"
                        onBlur={() => setEditingEisenhower(null)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm line-through text-muted-foreground cursor-pointer hover:text-primary flex-1"
                        onClick={() => setEditingEisenhower(item.id)}
                      >
                        {item.task}
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {editingEisenhower !== item.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEisenhower(item.id);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEisenhowerItem(item.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 5W2H */}
        <TabsContent value="5w2h" className="space-y-4">
          {w5h2Data.map((item) => (
            <div key={item.id} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                {editingW5H2 === item.id ? (
                  <Input
                    value={item.what}
                    onChange={(e) => updateW5H2Item(item.id, "what", e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="text-lg font-semibold"
                    autoFocus
                  />
                ) : (
                  <h3
                    className="font-semibold text-lg cursor-pointer hover:text-primary"
                    onClick={() => setEditingW5H2(item.id)}
                  >
                    {item.what}
                  </h3>
                )}
                <div className="flex gap-1">
                  {editingW5H2 !== item.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingW5H2(item.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {editingW5H2 === item.id && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingW5H2(null)}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteW5H2Item(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["why", "where", "when", "who"] as const).map((field) => (
                  <div key={field} className="space-y-1">
                    <p className="text-xs font-medium text-primary">{field.toUpperCase()}</p>
                    {editingW5H2 === item.id ? (
                      <Input
                        value={item[field]}
                        onChange={(e) => updateW5H2Item(item.id, field, e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{item[field]}</p>
                    )}
                  </div>
                ))}
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-primary">HOW (Como?)</p>
                  {editingW5H2 === item.id ? (
                    <Input
                      value={item.how}
                      onChange={(e) => updateW5H2Item(item.id, "how", e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{item.how}</p>
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs font-medium text-primary">HOW MUCH (Quanto?)</p>
                  {editingW5H2 === item.id ? (
                    <Input
                      value={item.howMuch}
                      onChange={(e) => updateW5H2Item(item.id, "howMuch", e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{item.howMuch}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Pareto */}
        <TabsContent value="pareto" className="space-y-4">
          {/* Gráfico Pareto Recharts */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4">Diagrama de Pareto - Análise 80/20</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoWithCalcs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="cause"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    label={{ value: 'Frequência', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    label={{ value: '% Acumulado', angle: 90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'cumulative' ? `${value.toFixed(1)}%` : value,
                      name === 'frequency' ? 'Frequência' : '% Acumulado'
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => value === 'frequency' ? 'Frequência' : '% Acumulado'}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="frequency"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name="frequency"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 5 }}
                    name="cumulative"
                  />
                  {/* Linha de referência 80% */}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span className="text-muted-foreground">Frequência (barras)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-destructive rounded" />
                <span className="text-muted-foreground">% Acumulado (linha)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-destructive font-medium">80%</span>
                <span className="text-muted-foreground">= limite Pareto</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="stat-card p-0 overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Causa</th>
                    <th className="text-center p-4 font-medium w-24">Freq.</th>
                    <th className="text-center p-4 font-medium w-20">%</th>
                    <th className="text-center p-4 font-medium w-20">Acum.</th>
                    <th className="text-center p-4 font-medium w-16">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {paretoWithCalcs.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-t border-border/50 hover:bg-secondary/30 transition-colors",
                        (item.cumulative || 0) <= 80 && "bg-destructive/5"
                      )}
                    >
                      <td className="p-4">
                        {editingPareto === item.id ? (
                          <Input
                            value={item.cause}
                            onChange={(e) => updateParetoItem(item.id, "cause", e.target.value)}
                            className="h-8 text-sm"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            onBlur={() => setEditingPareto(null)}
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-primary"
                            onClick={() => setEditingPareto(item.id)}
                          >
                            {item.cause}
                          </span>
                        )}
                      </td>
                      <td className="text-center p-2">
                        <Input
                          type="number"
                          value={item.frequency}
                          onChange={(e) => updateParetoItem(item.id, "frequency", parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center text-sm"
                        />
                      </td>
                      <td className="text-center p-4">{item.percentage?.toFixed(1)}%</td>
                      <td className="text-center p-4">
                        <Badge
                          className={cn(
                            (item.cumulative || 0) <= 80 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.cumulative?.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-center p-4">
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingPareto(item.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteParetoItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stat-card">
              <h3 className="font-semibold mb-4">Resumo da Análise</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <p className="text-sm font-medium text-destructive mb-1">Causas Principais (80%)</p>
                  <p className="text-2xl font-bold">{paretoWithCalcs.filter(i => (i.cumulative || 0) <= 80).length} causas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Representam {paretoWithCalcs.filter(i => (i.cumulative || 0) <= 80).reduce((acc, i) => acc + i.frequency, 0)} ocorrências
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm font-medium mb-1">Causas Secundárias (20%)</p>
                  <p className="text-2xl font-bold">{paretoWithCalcs.filter(i => (i.cumulative || 0) > 80).length} causas</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Representam {paretoWithCalcs.filter(i => (i.cumulative || 0) > 80).reduce((acc, i) => acc + i.frequency, 0)} ocorrências
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">Princípio de Pareto:</span> Foque nas causas destacadas para resolver 80% dos problemas com 20% do esforço.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        {/* Fluxograma */}
        <TabsContent value="fluxograma" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Toolbar */}
            <div className="w-full sm:w-48 bg-secondary/30 rounded-xl p-4 space-y-4 border border-border/50">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ferramentas</p>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs"
                  onClick={() => {
                    const id = `node-${Date.now()}`;
                    setNodes([...nodes, { id, type: "process", label: "Novo Processo", x: 50, y: 50 }]);
                  }}
                >
                  <Box className="h-4 w-4 text-blue-400" /> Processo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs"
                  onClick={() => {
                    const id = `node-${Date.now()}`;
                    setNodes([...nodes, { id, type: "decision", label: "Decisão?", x: 100, y: 100 }]);
                  }}
                >
                  <Zap className="h-4 w-4 text-yellow-400" /> Decisão
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs"
                  onClick={() => {
                    const id = `node-${Date.now()}`;
                    setNodes([...nodes, { id, type: "start", label: "Início", x: 20, y: 20 }]);
                  }}
                >
                  <Circle className="h-4 w-4 text-green-400" /> Início/Fim
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs"
                  onClick={() => {
                    const id = `node-${Date.now()}`;
                    setNodes([...nodes, { id, type: "document", label: "Documento", x: 150, y: 150 }]);
                  }}
                >
                  <FileText className="h-4 w-4 text-orange-400" /> Documento
                </Button>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Instruções</p>
                <ul className="text-[10px] text-muted-foreground space-y-1 list-disc pl-3">
                  <li>Arraste os blocos para posicionar</li>
                  <li>Clique no texto para editar</li>
                  <li>Use o mouse wheel para dar zoom</li>
                </ul>
              </div>
            </div>

            {/* Canvas Area */}
            <div
              className="flex-1 min-h-[700px] bg-white rounded-xl relative overflow-hidden border border-border shadow-lg group select-none"
              onWheel={(e) => {
                // Check if mouse is over canvas
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoom(prev => Math.min(Math.max(0.3, prev + delta), 2));
              }}
            >
              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 bg-secondary/80 backdrop-blur-sm p-2 rounded-lg border border-border pointer-events-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}>-</Button>
                <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</Button>
                <Button variant="ghost" size="sm" onClick={() => setZoom(1)}>Reset</Button>
              </div>

              {/* Scalable Content */}
              <div
                className="absolute inset-0 transition-transform duration-75 origin-top-left"
                style={{ transform: `scale(${zoom})`, width: '5000px', height: '5000px' }}
              >
                {/* SVG for Connections */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                    </marker>
                  </defs>
                  {edges.map((edge) => {
                    const source = nodes.find(n => n.id === edge.sourceId);
                    const target = nodes.find(n => n.id === edge.targetId);
                    if (!source || !target) return null;

                    // Calculate center coordinates
                    const sx = source.x + 80;
                    const sy = source.y + 30;
                    const tx = target.x + 80;
                    const ty = target.y + 30;

                    return (
                      <g key={edge.id}>
                        <path
                          d={`M ${sx} ${sy} C ${sx} ${sy + 50}, ${tx} ${ty - 50}, ${tx} ${ty}`}
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                        <circle cx={sx} cy={sy} r="3" fill="#64748b" />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes */}
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className={cn(
                      "absolute w-40 h-20 flex items-center justify-center p-4 text-center text-[11px] font-medium border shadow-md cursor-move transition-shadow active:shadow-xl z-10",
                      node.type === "process" && "bg-blue-50/90 border-blue-200 rounded-md",
                      node.type === "decision" && "bg-yellow-50/90 border-yellow-200",
                      node.type === "start" && "bg-green-50/90 border-green-200 rounded-full h-14",
                      node.type === "document" && "bg-orange-50/90 border-orange-200 rounded-none rounded-br-2xl"
                    )}
                    style={{
                      left: node.x,
                      top: node.y,
                      clipPath: node.type === "decision" ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : undefined,
                    }}
                    onMouseDown={(e) => {
                      const startX = e.clientX / zoom - node.x;
                      const startY = e.clientY / zoom - node.y;

                      const onMouseMove = (moveEvent: MouseEvent) => {
                        const newX = Math.round((moveEvent.clientX / zoom - startX) / 10) * 10;
                        const newY = Math.round((moveEvent.clientY / zoom - startY) / 10) * 10;
                        setNodes(prev => prev.map(n => n.id === node.id ? { ...n, x: newX, y: newY } : n));
                      };

                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      };

                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                    }}
                  >
                    <div className="relative w-full h-full flex items-center justify-center group/node">
                      <textarea
                        value={node.label}
                        onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, label: e.target.value } : n))}
                        className="bg-transparent border-none text-center outline-none w-full cursor-text resize-none text-[10px] leading-tight font-semibold py-1 px-2"
                        rows={2}
                      />

                      {/* Connection Handles */}
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity flex flex-col gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6 rounded-full bg-slate-800/90 hover:bg-primary border border-white/20 shadow-md"
                          title="Conectar"
                          onClick={(e) => {
                            e.stopPropagation();
                            const sourceId = (window as any).pendingEdgeSource;
                            if (sourceId && sourceId !== node.id) {
                              setEdges([...edges, { id: `edge-${Date.now()}`, sourceId, targetId: node.id }]);
                              (window as any).pendingEdgeSource = null;
                            } else {
                              (window as any).pendingEdgeSource = node.id;
                              toast({ title: "Início da conexão", description: "Selecione o próximo bloco para conectar." });
                            }
                          }}
                        >
                          <Link className="h-3 w-3 text-white" />
                        </Button>
                      </div>

                      <button
                        className="absolute -top-4 -right-4 h-6 w-6 bg-destructive/90 text-white rounded-full items-center justify-center flex opacity-0 group-hover/node:opacity-100 transition-opacity shadow-md hover:bg-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNodes(prev => prev.filter(n => n.id !== node.id));
                          setEdges(prev => prev.filter(edge => edge.sourceId !== node.id && edge.targetId !== node.id));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

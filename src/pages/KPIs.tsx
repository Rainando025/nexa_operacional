import { useState } from "react";
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  History,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAppStore, KPI } from "@/hooks/useAppStore";
import { KPIModal } from "@/components/modals/KPIModal";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "@/hooks/use-toast";

const statusConfig = {
  "on-track": { label: "No caminho", color: "bg-success/10 text-success" },
  "at-risk": { label: "Em risco", color: "bg-warning/10 text-warning" },
  "off-track": { label: "Fora da meta", color: "bg-destructive/10 text-destructive" },
};

const categories = ["Todos", "Operacional", "Qualidade", "Financeiro", "RH", "Logística", "Atendimento", "Manutenção"];

export default function KPIs() {
  const { kpis, addKPI, updateKPI, deleteKPI, recordKPIValue } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
  const [newValue, setNewValue] = useState("");

  const filteredKPIs = kpis.filter(
    (kpi) => selectedCategory === "Todos" || kpi.category === selectedCategory
  );

  const onTrackCount = kpis.filter((k) => k.status === "on-track").length;
  const atRiskCount = kpis.filter((k) => k.status === "at-risk").length;
  const offTrackCount = kpis.filter((k) => k.status === "off-track").length;

  const handleCreate = () => {
    setEditingKPI(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (kpi: KPI) => {
    setEditingKPI(kpi);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: Omit<KPI, "id">) => {
    if (editingKPI) {
      updateKPI(editingKPI.id, data);
    } else {
      addKPI(data);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteKPI(deletingId);
      setDeletingId(null);
    }
  };

  const handleRecordValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKPI && newValue) {
      recordKPIValue(selectedKPI.id, parseFloat(newValue));
      toast({
        title: "Valor registrado!",
        description: `O valor de ${newValue}${selectedKPI.unit} foi registrado com sucesso.`,
      });
      setNewValue("");
      // Update selected KPI to reflect changes in history
      const updated = kpis.find(k => k.id === selectedKPI.id);
      if (updated) setSelectedKPI(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">KPIs</h1>
          <p className="text-muted-foreground mt-1">
            Indicadores-chave de desempenho
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Novo KPI
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{onTrackCount}</p>
              <p className="text-sm text-muted-foreground">No caminho</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Minus className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atRiskCount}</p>
              <p className="text-sm text-muted-foreground">Em risco</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{offTrackCount}</p>
              <p className="text-sm text-muted-foreground">Fora da meta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-secondary/50">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredKPIs.map((kpi, index) => {
          const status = statusConfig[kpi.status as keyof typeof statusConfig];
          const progress = (kpi.current / kpi.target) * 100;
          const change = kpi.current - kpi.previous;
          const changePercent = kpi.previous !== 0
            ? ((change / kpi.previous) * 100).toFixed(1)
            : "0";

          return (
            <div
              key={kpi.id}
              className="stat-card animate-fade-in cursor-pointer group hover:border-primary/50 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setSelectedKPI(kpi)}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {kpi.category}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(kpi); }}>
                      Editar Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeletingId(kpi.id); }}
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-semibold text-sm mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                {kpi.name}
              </h3>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-2xl font-bold">{kpi.current}</span>
                    <span className="text-muted-foreground text-xs ml-1">{kpi.unit}</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded",
                      change >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
                    )}
                  >
                    {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(Number(changePercent))}%
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="h-12 w-full -mx-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpi.history || []}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={change >= 0 ? "#10b981" : "#ef4444"}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-medium">
                    <span>Meta: {kpi.target}{kpi.unit}</span>
                    <span>{Math.min(progress, 100).toFixed(0)}%</span>
                  </div>
                  <Progress
                    value={Math.min(progress, 100)}
                    className={cn(
                      "h-1.5",
                      kpi.status === "off-track" && "[&>div]:bg-destructive",
                      kpi.status === "at-risk" && "[&>div]:bg-warning"
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-3 mt-1">
                  <Badge className={cn("text-[10px] font-bold h-5", status.color)}>
                    {status.label}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2">
                    Registrar <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* KPI Details Sheet */}
      <Sheet open={!!selectedKPI} onOpenChange={(open) => !open && setSelectedKPI(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selectedKPI && (
            <div className="space-y-6">
              <SheetHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedKPI.category}</Badge>
                  <Badge className={statusConfig[selectedKPI.status as keyof typeof statusConfig].color}>
                    {statusConfig[selectedKPI.status as keyof typeof statusConfig].label}
                  </Badge>
                </div>
                <SheetTitle className="text-2xl">{selectedKPI.name}</SheetTitle>
                <SheetDescription>
                  Visualize o histórico e registre novos indicadores diários.
                </SheetDescription>
              </SheetHeader>

              {/* Monthly Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Média Mensal</p>
                  <p className="text-xl font-bold">
                    {(selectedKPI.history.reduce((acc, curr) => acc + curr.value, 0) / (selectedKPI.history.length || 1)).toFixed(1)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{selectedKPI.unit}</span>
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Mensurável</p>
                  <p className="text-xl font-bold">
                    {selectedKPI.history.reduce((acc, curr) => acc + curr.value, 0).toFixed(1)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{selectedKPI.unit}</span>
                  </p>
                </div>
              </div>

              {/* Record Value Form */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Plus className="h-4 w-4" /> Registrar Indicador de Hoje
                </div>
                <form onSubmit={handleRecordValue} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Valor atingido"
                      type="number"
                      step="0.1"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">
                      {selectedKPI.unit}
                    </span>
                  </div>
                  <Button type="submit">Salvar</Button>
                </form>
              </div>

              {/* History Chart */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <History className="h-4 w-4 text-primary" /> Histórico Últimos 30 dias
                </div>
                <div className="h-48 w-full bg-secondary/20 rounded-xl p-4 border">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedKPI.history}>
                      <XAxis hide dataKey="date" />
                      <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#60a5fa' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed History Table */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Calendar className="h-4 w-4 text-primary" /> Registros Diários
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {[...selectedKPI.history].reverse().map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-xs border border-border/50">
                      <span className="font-medium">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                      <span className="font-bold">{h.value}{selectedKPI.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal */}
      <KPIModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingKPI}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir KPI?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O KPI será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


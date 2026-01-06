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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import { useAppStore, KPI } from "@/hooks/useAppStore";
import { KPIModal } from "@/components/modals/KPIModal";

const statusConfig = {
  "on-track": { label: "No caminho", color: "bg-success/10 text-success" },
  "at-risk": { label: "Em risco", color: "bg-warning/10 text-warning" },
  "off-track": { label: "Fora da meta", color: "bg-destructive/10 text-destructive" },
};

const categories = ["Todos", "Operacional", "Qualidade", "Financeiro", "RH", "Logística", "Atendimento", "Manutenção"];

export default function KPIs() {
  const { kpis, addKPI, updateKPI, deleteKPI } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPI | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary" className="text-xs">
                  {kpi.category}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(kpi)}>
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setDeletingId(kpi.id)}
                    >
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-medium text-sm mb-4 line-clamp-2">
                {kpi.name}
              </h3>

              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-3xl font-bold">{kpi.current}</span>
                    <span className="text-muted-foreground ml-1">{kpi.unit}</span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      kpi.trend === "up" && change > 0
                        ? "text-success"
                        : kpi.trend === "down" && change < 0
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {change > 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    {Math.abs(Number(changePercent))}%
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
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

                <Badge className={cn("text-xs w-full justify-center", status.color)}>
                  {status.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

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

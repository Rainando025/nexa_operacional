import { useState } from "react";
import {
  Crosshair,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  Trash2,
  Edit,
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
import { useAppStore, OKR, KeyResult } from "@/hooks/useAppStore";
import { OKRModal } from "@/components/modals/OKRModal";
import { useAuth } from "@/hooks/useAuth";

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  "on-track": { icon: Circle, color: "text-info", bg: "bg-info/10" },
  "at-risk": { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  "not-started": { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function OKRs() {
  const { okrs, addOKR, updateOKR, deleteOKR, addNotification } = useAppStore();
  const { profile } = useAuth();
  const [expandedOKRs, setExpandedOKRs] = useState<string[]>(okrs.slice(0, 2).map(o => o.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedOKRs((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const calculateProgress = (keyResults: KeyResult[]) => {
    if (keyResults.length === 0) return 0;
    const total = keyResults.reduce((acc, kr) => {
      const progress = Math.min((kr.current / kr.target) * 100, 100);
      return acc + progress;
    }, 0);
    return Math.round(total / keyResults.length);
  };

  const handleCreate = () => {
    setEditingOKR(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (okr: OKR) => {
    setEditingOKR(okr);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: Omit<OKR, "id">) => {
    if (editingOKR) {
      updateOKR(editingOKR.id, data);
      addNotification({
        userName: profile?.name || "Usuário",
        action: "EDITOU",
        resource: "OKR",
        details: `Editou o objetivo: "${data.objective}"`,
      });
    } else {
      addOKR(data);
      addNotification({
        userName: profile?.name || "Usuário",
        action: "CRIOU",
        resource: "OKR",
        details: `Criou o novo objetivo: "${data.objective}"`,
      });
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      const okrToDelete = okrs.find((o) => o.id === deletingId);
      deleteOKR(deletingId);
      addNotification({
        userName: profile?.name || "Usuário",
        action: "EXCLUIU",
        resource: "OKR",
        details: `Excluiu o objetivo: "${okrToDelete?.objective || "Desconhecido"}"`,
      });
      setDeletingId(null);
    }
  };

  const totalKeyResults = okrs.reduce((acc, okr) => acc + okr.keyResults.length, 0);
  const completedKeyResults = okrs.reduce(
    (acc, okr) => acc + okr.keyResults.filter((kr) => kr.status === "completed").length,
    0
  );
  const atRiskKeyResults = okrs.reduce(
    (acc, okr) => acc + okr.keyResults.filter((kr) => kr.status === "at-risk").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">OKRs</h1>
          <p className="text-muted-foreground mt-1">
            Objetivos e Resultados-Chave
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm py-1.5 px-3">
            Q1 2024
          </Badge>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Novo OKR
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Crosshair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{okrs.length}</p>
              <p className="text-sm text-muted-foreground">Objetivos</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Circle className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalKeyResults}</p>
              <p className="text-sm text-muted-foreground">Key Results</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedKeyResults}</p>
              <p className="text-sm text-muted-foreground">Concluídos</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{atRiskKeyResults}</p>
              <p className="text-sm text-muted-foreground">Em risco</p>
            </div>
          </div>
        </div>
      </div>

      {/* OKR List */}
      <div className="space-y-4">
        {okrs.map((okr, index) => {
          const isExpanded = expandedOKRs.includes(okr.id);
          const progress = calculateProgress(okr.keyResults);

          return (
            <div
              key={okr.id}
              className="stat-card animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Objective Header */}
              <div className="flex items-start gap-4">
                <button
                  className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => toggleExpand(okr.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => toggleExpand(okr.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{okr.objective}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {okr.owner} • {okr.quarter}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {progress}%
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(okr)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeletingId(okr.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Key Results */}
              {isExpanded && (
                <div className="mt-6 ml-9 space-y-3">
                  {okr.keyResults.map((kr) => {
                    const status = statusConfig[kr.status];
                    const krProgress = Math.min(
                      (kr.current / kr.target) * 100,
                      100
                    );
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={kr.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className={cn("p-1.5 rounded-full", status.bg)}>
                          <StatusIcon className={cn("h-4 w-4", status.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{kr.title}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Progress
                              value={krProgress}
                              className={cn(
                                "flex-1 h-1.5",
                                kr.status === "at-risk" && "[&>div]:bg-warning",
                                kr.status === "completed" && "[&>div]:bg-success"
                              )}
                            />
                            <span className="text-sm text-muted-foreground shrink-0">
                              {kr.current}/{kr.target} {kr.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <OKRModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        initialData={editingOKR}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir OKR?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O OKR e todos os seus Key Results serão removidos permanentemente.
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

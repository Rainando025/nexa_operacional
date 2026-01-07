import { useState, useEffect } from "react";
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
  Loader2,
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
import { OKRModal } from "@/components/modals/OKRModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/hooks/useAppStore";
import { toast } from "@/hooks/use-toast";

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
  department_id?: string;
  owner_id?: string;
}

const statusConfig = {
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  "on-track": { icon: Circle, color: "text-info", bg: "bg-info/10" },
  "at-risk": { icon: Clock, color: "text-warning", bg: "bg-warning/10" },
  "not-started": { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function OKRs() {
  const { profile, isAdmin } = useAuth();
  const { addNotification } = useAppStore();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOKRs, setExpandedOKRs] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOKR, setEditingOKR] = useState<OKR | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOKRs = async () => {
    setLoading(true);
    try {
      // Admins veem todos os OKRs, outros usuários veem apenas do seu departamento
      let query = supabase.from("okrs").select("*");

      if (!isAdmin && profile?.department_id) {
        query = query.eq("department_id", profile.department_id);
      }

      const { data: okrsData, error: okrsError } = await query;

      if (okrsError) throw okrsError;

      const okrsWithKRs = await Promise.all(
        (okrsData || []).map(async (okr) => {
          const { data: krsData } = await supabase
            .from("key_results")
            .select("*")
            .eq("okr_id", okr.id);

          return {
            ...okr,
            keyResults: (krsData || []).map((kr: any) => ({
              id: kr.id,
              title: kr.title,
              current: kr.current,
              target: kr.target,
              unit: kr.unit,
              status: kr.status,
            })),
          };
        })
      );

      setOkrs(okrsWithKRs as OKR[]);
      if (expandedOKRs.length === 0 && okrsWithKRs.length > 0) {
        setExpandedOKRs(okrsWithKRs.slice(0, 2).map((o: any) => o.id));
      }
    } catch (error) {
      console.error("Error fetching OKRs:", error);
      toast({
        title: "Erro ao carregar OKRs",
        description: "Não foi possível carregar os objetivos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOKRs();

    const channel = supabase
      .channel("okrs_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "okrs" }, () => fetchOKRs())
      .on("postgres_changes", { event: "*", schema: "public", table: "key_results" }, () => fetchOKRs())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.department_id]);

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

  const handleSubmit = async (data: Omit<OKR, "id">) => {
    try {
      if (editingOKR) {
        const { error: okrError } = await supabase
          .from("okrs")
          .update({
            objective: data.objective,
            owner: data.owner,
            quarter: data.quarter,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingOKR.id);

        if (okrError) throw okrError;

        await supabase.from("key_results").delete().eq("okr_id", editingOKR.id);

        const { error: krsError } = await supabase.from("key_results").insert(
          data.keyResults.map((kr) => ({
            okr_id: editingOKR.id,
            title: kr.title,
            current: kr.current,
            target: kr.target,
            unit: kr.unit,
            status: kr.status,
          }))
        );

        if (krsError) throw krsError;

        addNotification({
          user_name: profile?.name || "Usuário",
          action: "EDITOU",
          resource: "OKRs",
          details: `Atualizou o OKR: ${data.objective}`,
        });

        toast({
          title: "OKR atualizado!",
          description: `O OKR "${data.objective}" foi atualizado com sucesso.`,
        });
      } else {
        const { data: newOKR, error: okrError } = await supabase
          .from("okrs")
          .insert({
            objective: data.objective,
            owner: data.owner,
            quarter: data.quarter,
            department_id: profile?.department_id,
            owner_id: profile?.user_id,
          })
          .select()
          .single();

        if (okrError) throw okrError;

        const { error: krsError } = await supabase.from("key_results").insert(
          data.keyResults.map((kr) => ({
            okr_id: newOKR.id,
            title: kr.title,
            current: kr.current,
            target: kr.target,
            unit: kr.unit,
            status: kr.status,
          }))
        );

        if (krsError) throw krsError;

        addNotification({
          user_name: profile?.name || "Usuário",
          action: "CRIOU",
          resource: "OKRs",
          details: `Criou o OKR: ${data.objective}`,
        });

        toast({
          title: "OKR criado!",
          description: `O OKR "${data.objective}" foi criado com sucesso.`,
        });
      }

      setIsModalOpen(false);
      fetchOKRs();
    } catch (error) {
      console.error("Error saving OKR:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o OKR.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const okrToDelete = okrs.find((o) => o.id === deletingId);
      const { error } = await supabase.from("okrs").delete().eq("id", deletingId);

      if (error) throw error;

      addNotification({
        user_name: profile?.name || "Usuário",
        action: "EXCLUIU",
        resource: "OKRs",
        details: `Excluiu o OKR: ${okrToDelete?.objective || "Desconhecido"}`,
      });

      toast({
        title: "OKR excluído!",
        description: "O OKR foi removido com sucesso.",
      });

      setDeletingId(null);
      fetchOKRs();
    } catch (error) {
      console.error("Error deleting OKR:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o OKR.",
        variant: "destructive",
      });
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
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
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
                  className="stat-card animate-fade-in border border-border/50 transition-all hover:shadow-md"
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
        </>
      )}
    </div>
  );
}

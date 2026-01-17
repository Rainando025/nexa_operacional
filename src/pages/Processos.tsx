import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  GitBranch,
  Plus,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProcessModal } from "@/components/modals/ProcessModal";
import { Process, useAppStore } from "@/hooks/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";


const statusConfig = {
  active: { label: "Ativo", color: "bg-success/10 text-success", icon: CheckCircle2 },
  review: { label: "Em revisão", color: "bg-warning/10 text-warning", icon: Clock },
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: FileText },
};

const riskConfig = {
  low: { label: "Baixo", color: "text-success" },
  medium: { label: "Médio", color: "text-warning" },
  high: { label: "Alto", color: "text-destructive" },
};

export default function Processos() {
  const { profile, isAdmin, isManager } = useAuth();
  const { processes, addProcess, updateProcess, deleteProcess, addNotification } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const { toast } = useToast();

  // Access Control: User's Department Name
  const [userDepartmentName, setUserDepartmentName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!profile?.department_id) return;

      const { data, error } = await supabase
        .from("departments")
        .select("name")
        .eq("id", profile.department_id)
        .single();

      if (!error && data) {
        setUserDepartmentName(data.name);
      }
    };

    fetchUserDepartment();
  }, [profile?.department_id]);

  const filteredProcesses = processes.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    // Permission Filter: Admins/Managers see all, Others see only their department
    const matchesDepartment = (isAdmin || isManager)
      ? true
      : p.department === userDepartmentName;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const activeCount = processes.filter((p) => p.status === "active").length;
  const reviewCount = processes.filter((p) => p.status === "review").length;
  const highRiskCount = processes.filter((p) => p.risk === "high").length;

  const handleNew = () => {
    setSelectedProcess(null);
    setViewOnly(false);
    setModalOpen(true);
  };

  const handleView = (process: Process) => {
    setSelectedProcess(process);
    setViewOnly(true);
    setModalOpen(true);
  };

  const handleEdit = (process: Process) => {
    setSelectedProcess(process);
    setViewOnly(false);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const process = processes.find(p => p.id === id);
    deleteProcess(id);
    toast({ title: "Processo excluído com sucesso" });
    addNotification({
      userName: profile?.name || "Usuário",
      action: "EXCLUIU",
      resource: "Processo",
      details: `Excluiu o processo: "${process?.name || id}"`,
    });
  };

  const handleSave = (data: Omit<Process, "id" | "lastReview">) => {
    if (selectedProcess) {
      updateProcess(selectedProcess.id, data);
      toast({ title: "Processo atualizado com sucesso" });
      addNotification({
        userName: profile?.name || "Usuário",
        action: "EDITOU",
        resource: "Processo",
        details: `Atualizou o processo: "${data.name}"`,
      });
    } else {
      addProcess(data);
      toast({ title: "Processo criado com sucesso" });
      addNotification({
        userName: profile?.name || "Usuário",
        action: "CRIOU",
        resource: "Processo",
        details: `Criou um novo processo: "${data.name}"`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Processos</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de processos organizacionais
          </p>
        </div>
        <Button className="gap-2" onClick={handleNew}>
          <Plus className="h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{processes.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reviewCount}</p>
              <p className="text-sm text-muted-foreground">Em revisão</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{highRiskCount}</p>
              <p className="text-sm text-muted-foreground">Alto risco</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar processos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-secondary/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="review">Em revisão</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Process Table */}
      <div className="stat-card overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Processo</TableHead>
              <TableHead className="text-muted-foreground">Departamento</TableHead>
              <TableHead className="text-muted-foreground">Responsável</TableHead>
              <TableHead className="text-muted-foreground">Versão</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Risco</TableHead>
              <TableHead className="text-muted-foreground">Próx. Revisão</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProcesses.map((process) => {
              const status = statusConfig[process.status as keyof typeof statusConfig];
              const risk = riskConfig[process.risk as keyof typeof riskConfig];
              const StatusIcon = status.icon;

              return (
                <TableRow key={process.id} className="border-border hover:bg-secondary/30">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {process.id}
                  </TableCell>
                  <TableCell className="font-medium">{process.name}</TableCell>
                  <TableCell>{process.department}</TableCell>
                  <TableCell>{process.owner}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      v{process.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("gap-1", status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn("font-medium", risk.color)}>
                      {risk.label}
                    </span>
                  </TableCell>
                  <TableCell>{process.nextReview}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(process)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(process)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(process.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ProcessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        process={selectedProcess}
        onSave={handleSave}
        viewOnly={viewOnly}
      />
    </div>
  );
}

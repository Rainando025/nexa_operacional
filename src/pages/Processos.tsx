import { useState } from "react";
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
import { Process } from "@/hooks/useAppStore";
import { useToast } from "@/hooks/use-toast";

const initialProcesses: Process[] = [
  {
    id: "PRC-001",
    name: "Processo de Compras",
    department: "Suprimentos",
    owner: "Carlos Mendes",
    version: "2.3",
    status: "active",
    lastReview: "10/01/2024",
    nextReview: "10/07/2024",
    risk: "low",
    description: "Processo padrão para requisição e aprovação de compras",
    content: "1. Solicitante preenche requisição\n2. Gestor aprova\n3. Compras realiza cotação\n4. Aprovação final\n5. Emissão de PO",
  },
  {
    id: "PRC-002",
    name: "Onboarding de Colaboradores",
    department: "RH",
    owner: "Ana Costa",
    version: "1.8",
    status: "active",
    lastReview: "05/12/2023",
    nextReview: "05/06/2024",
    risk: "medium",
    description: "Processo de integração de novos colaboradores",
    content: "1. Documentação admissional\n2. Treinamento inicial\n3. Apresentação à equipe\n4. Acesso aos sistemas\n5. Acompanhamento 30/60/90 dias",
  },
  {
    id: "PRC-003",
    name: "Controle de Qualidade",
    department: "Qualidade",
    owner: "Roberto Lima",
    version: "4.1",
    status: "active",
    lastReview: "20/01/2024",
    nextReview: "20/07/2024",
    risk: "low",
  },
  {
    id: "PRC-004",
    name: "Gestão de Incidentes",
    department: "TI",
    owner: "Paula Santos",
    version: "3.0",
    status: "review",
    lastReview: "01/10/2023",
    nextReview: "01/02/2024",
    risk: "high",
    description: "Procedimento para tratamento de incidentes de TI",
    content: "1. Registro do incidente\n2. Classificação de severidade\n3. Análise e diagnóstico\n4. Resolução\n5. Documentação e fechamento",
  },
  {
    id: "PRC-005",
    name: "Faturamento e Cobrança",
    department: "Financeiro",
    owner: "Marcos Silva",
    version: "2.5",
    status: "active",
    lastReview: "15/01/2024",
    nextReview: "15/07/2024",
    risk: "low",
  },
  {
    id: "PRC-006",
    name: "Atendimento ao Cliente",
    department: "SAC",
    owner: "Juliana Pereira",
    version: "1.2",
    status: "draft",
    lastReview: "-",
    nextReview: "28/02/2024",
    risk: "medium",
  },
];

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
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [viewOnly, setViewOnly] = useState(false);
  const { toast } = useToast();

  const filteredProcesses = processes.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
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
    setProcesses((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Processo excluído com sucesso" });
  };

  const handleSave = (data: Omit<Process, "id" | "lastReview">) => {
    if (selectedProcess) {
      setProcesses((prev) =>
        prev.map((p) => (p.id === selectedProcess.id ? { ...p, ...data } : p))
      );
      toast({ title: "Processo atualizado com sucesso" });
    } else {
      const newProcess: Process = {
        ...data,
        id: `PRC-${String(processes.length + 1).padStart(3, "0")}`,
        lastReview: "-",
      };
      setProcesses((prev) => [...prev, newProcess]);
      toast({ title: "Processo criado com sucesso" });
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

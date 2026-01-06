import { useState } from "react";
import {
  Grid3X3,
  Plus,
  Users,
  Star,
  Award,
  X,
  Trash2,
} from "lucide-react";
import AvaliacaoModal from "@/components/modals/AvaliacaoModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const initialSkills = [
  "Liderança",
  "Comunicação",
  "Análise de Dados",
  "Gestão de Projetos",
  "Excel Avançado",
  "Power BI",
  "Lean Six Sigma",
  "Negociação",
];

const initialEmployees = [
  {
    id: 1,
    name: "Maria Silva",
    role: "Gerente",
    department: "Operações",
    levels: [4, 5, 3, 5, 4, 3, 4, 4],
  },
  {
    id: 2,
    name: "João Santos",
    role: "Analista Sr",
    department: "Qualidade",
    levels: [3, 4, 5, 4, 5, 4, 5, 3],
  },
  {
    id: 3,
    name: "Ana Costa",
    role: "Coordenadora",
    department: "RH",
    levels: [5, 5, 3, 4, 3, 2, 3, 5],
  },
  {
    id: 4,
    name: "Carlos Mendes",
    role: "Especialista",
    department: "TI",
    levels: [3, 3, 5, 4, 5, 5, 4, 2],
  },
  {
    id: 5,
    name: "Paula Oliveira",
    role: "Analista",
    department: "Financeiro",
    levels: [2, 4, 4, 3, 5, 4, 3, 4],
  },
  {
    id: 6,
    name: "Roberto Lima",
    role: "Supervisor",
    department: "Produção",
    levels: [4, 4, 3, 4, 3, 2, 5, 3],
  },
];

const levelColors = {
  1: "bg-destructive/20 text-destructive",
  2: "bg-warning/20 text-warning",
  3: "bg-info/20 text-info",
  4: "bg-success/20 text-success",
  5: "bg-primary/20 text-primary",
};

const levelLabels = {
  1: "Iniciante",
  2: "Básico",
  3: "Intermediário",
  4: "Avançado",
  5: "Especialista",
};



export default function Competencias() {
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [employees, setEmployees] = useState(initialEmployees);
  const [skills] = useState(initialSkills);
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false);

  const departments = [...new Set(employees.map((e) => e.department))];

  const filteredEmployees = employees.filter(
    (e) => selectedDepartment === "all" || e.department === selectedDepartment
  );

  const avgLevels = skills.map((_, i) => {
    const sum = employees.reduce((acc, emp) => acc + emp.levels[i], 0);
    return (sum / employees.length).toFixed(1);
  });

  const gaps = skills
    .map((skill, i) => ({
      skill,
      avg: parseFloat(avgLevels[i]),
      gap: 4 - parseFloat(avgLevels[i]),
    }))
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  const updateCompetencyLevel = (empId: number, skillIdx: number, newLevel: number) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === empId
          ? { ...emp, levels: emp.levels.map((l, i) => (i === skillIdx ? newLevel : l)) }
          : emp
      )
    );
  };

  const deleteEmployee = (empId: number) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== empId));
  };

  const addEmployee = (employee: typeof initialEmployees[0]) => {
    setEmployees((prev) => [...prev, employee]);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Competências</h1>
          <p className="text-muted-foreground mt-1">
            Matriz de competências e desenvolvimento de equipe
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAvaliacaoModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <AvaliacaoModal
        open={avaliacaoModalOpen}
        onOpenChange={setAvaliacaoModalOpen}
        onSave={addEmployee}
        skills={skills}
        departments={departments}
      />

      <div className="space-y-6 mt-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Colaboradores</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Grid3X3 className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{skills.length}</p>
                <p className="text-sm text-muted-foreground">Competências</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Star className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter((e) => e.levels.some((l) => l === 5)).length}
                </p>
                <p className="text-sm text-muted-foreground">Especialistas</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Award className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gaps.length}</p>
                <p className="text-sm text-muted-foreground">Gaps identificados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48 bg-secondary/50">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Competency Matrix */}
        <div className="stat-card overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Matriz de Competências</h3>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm text-muted-foreground font-medium border-b border-border">
                  Colaborador
                </th>
                {skills.map((skill) => (
                  <th
                    key={skill}
                    className="p-3 text-xs text-muted-foreground font-medium text-center border-b border-border whitespace-nowrap"
                  >
                    {skill}
                  </th>
                ))}
                <th className="p-3 text-xs text-muted-foreground font-medium text-center border-b border-border w-16">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-secondary/30 group">
                  <td className="p-3 border-b border-border">
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {employee.role} • {employee.department}
                      </p>
                    </div>
                  </td>
                  {employee.levels.map((level, i) => (
                    <td key={i} className="p-3 text-center border-b border-border">
                      <Select
                        value={level.toString()}
                        onValueChange={(v) => updateCompetencyLevel(employee.id, i, parseInt(v))}
                      >
                        <SelectTrigger className={cn(
                          "w-10 h-10 rounded-full mx-auto",
                          levelColors[level as keyof typeof levelColors]
                        )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} - {levelLabels[n as keyof typeof levelLabels]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  ))}
                  <td className="p-3 text-center border-b border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteEmployee(employee.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="bg-secondary/20">
                <td className="p-3 font-semibold">Média</td>
                {avgLevels.map((avg, i) => (
                  <td key={i} className="p-3 text-center font-medium text-primary">
                    {avg}
                  </td>
                ))}
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="stat-card">
          <h4 className="font-medium mb-3">Legenda</h4>
          <div className="flex flex-wrap gap-4">
            {Object.entries(levelLabels).map(([level, label]) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    levelColors[parseInt(level) as keyof typeof levelColors]
                  )}
                >
                  {level}
                </div>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="stat-card">
            <h3 className="text-lg font-semibold mb-4">Gaps de Competência</h3>
            <div className="space-y-3">
              {gaps.slice(0, 5).map((gap, index) => (
                <div
                  key={gap.skill}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{gap.skill}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Média: {gap.avg.toFixed(1)}
                    </span>
                    <Badge variant="secondary" className="bg-warning/10 text-warning">
                      Gap: {gap.gap.toFixed(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

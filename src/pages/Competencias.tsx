import { useState, useEffect } from "react";
import {
  Grid3X3,
  Plus,
  Users,
  Star,
  Award,
  X,
  Trash2,
  Loader2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/hooks/useAppStore";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  1: "bg-blue-50 text-blue-600 border border-blue-100",
  2: "bg-blue-100 text-blue-700 border border-blue-200",
  3: "bg-blue-300 text-blue-900 border border-blue-400",
  4: "bg-blue-500 text-white border border-blue-600",
  5: "bg-blue-700 text-white border border-blue-800",
};

const levelLabels = {
  1: "Iniciante",
  2: "Básico",
  3: "Intermediário",
  4: "Avançado",
  5: "Especialista",
};



export default function Competencias() {
  const { profile, isAdmin } = useAuth();
  const { addNotification } = useAppStore();
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [employees, setEmployees] = useState<any[]>([]);
  const [skills] = useState(initialSkills);
  const [loading, setLoading] = useState(true);
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Fetch departments
      const { data: depts } = await supabase.from("departments").select("*");
      setAllDepartments(depts || []);

      // Fetch profiles
      let query = supabase
        .from("profiles")
        .select(`
          *,
          departments(name),
          sectors(name)
        `);

      if (!isAdmin) {
        query = query
          .eq("department_id", profile.department_id)
          .eq("sector_id", profile.sector_id);
      }

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      // Fetch levels
      const { data: levelsData, error: levelsError } = await supabase
        .from("competency_levels")
        .select("*");
      if (levelsError) throw levelsError;

      // Map profiles to employees format
      const mappedEmployees = (profilesData || []).map((p: any) => {
        const userLevels = new Array(skills.length).fill(0);
        levelsData?.forEach((l) => {
          if (l.user_id === p.user_id) {
            const skillIdx = skills.indexOf(l.skill_name);
            if (skillIdx !== -1) {
              userLevels[skillIdx] = l.level;
            }
          }
        });

        return {
          id: p.id,
          user_id: p.user_id,
          name: p.name,
          avatar_url: p.avatar_url,
          role: p.role,
          department: p.departments?.name || "N/A",
          department_id: p.department_id,
          levels: userLevels,
        };
      });

      setEmployees(mappedEmployees);
    } catch (error: any) {
      console.error("Error fetching competency data:", error);
      const msg = (error?.message || String(error)).toLowerCase();
      if (msg.includes("relation \"competency_levels\" does not exist") || msg.includes("competency_levels")) {
        toast({
          title: "Tabela de competências ausente",
          description: "A tabela `competency_levels` não existe no banco. Rode as migrações (ver supabase/migrations) para criá-la.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar a matriz de competências.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile, isAdmin]);

  const departments = [...new Set(allDepartments.map((d) => d.name))];

  const filteredEmployees = employees.filter(
    (e) => selectedDepartment === "all" || e.department === selectedDepartment
  );

  const avgLevels = skills.map((_, i) => {
    const activeEmployees = employees.filter(emp => emp.levels[i] > 0);
    if (activeEmployees.length === 0) return "0.0";
    const sum = activeEmployees.reduce((acc, emp) => acc + emp.levels[i], 0);
    return (sum / activeEmployees.length).toFixed(1);
  });

  const gaps = skills
    .map((skill, i) => ({
      skill,
      avg: parseFloat(avgLevels[i]),
      gap: 4 - parseFloat(avgLevels[i]),
    }))
    .filter((s) => s.gap > 0 && s.avg > 0)
    .sort((a, b) => b.gap - a.gap);

  const updateCompetencyLevel = async (userId: string, skillIdx: number, newLevel: number) => {
    const employee = employees.find(e => e.user_id === userId);
    const skillName = skills[skillIdx];

    try {
      const { error } = await supabase
        .from("competency_levels")
        .upsert({
          user_id: userId,
          skill_name: skillName,
          level: newLevel,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,skill_name'
        });

      if (error) throw error;

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.user_id === userId
            ? { ...emp, levels: emp.levels.map((l, i) => (i === skillIdx ? newLevel : l)) }
            : emp
        )
      );

      toast({
        title: "Nível atualizado",
        description: `Competência "${skillName}" de ${employee?.name} atualizada para ${newLevel}.`,
      });

      addNotification({
        user_name: profile?.name || "Usuário",
        action: "EDITOU",
        resource: "Competências",
        details: `Alterou o nível da competência "${skillName}" de ${employee?.name} para ${newLevel}`,
      });
    } catch (error) {
      console.error("Error updating competency:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar a alteração.",
        variant: "destructive",
      });
    }
  };

  const deleteEmployee = async (empId: string) => {
    // We don't delete profiles from here usually, but maybe we remove all their levels?
    // User didn't request profile deletion. I'll just keep the function but maybe disable it or make it clear.
    // For now, let's just make it do nothing or remove levels if it's supposed to "remove from matrix"
    toast({
      title: "Recurso não implementado",
      description: "A exclusão de colaboradores deve ser feita na gestão de usuários.",
    });
  };

  const addEmployee = (employee: any) => {
    if (!employee || !employee.name) return;
    (async () => {
      try {
        const userId = `new_${Date.now()}`;
        const inserts = skills.map((skill: string, idx: number) => ({
          user_id: userId,
          skill_name: skill,
          level: employee.levels[idx] || 0,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from("competency_levels").insert(inserts);
        if (error) throw error;

        const newEmp = {
          id: Date.now(),
          user_id: userId,
          name: employee.name,
          avatar_url: null,
          role: employee.role,
          department: employee.department,
          department_id: null,
          levels: employee.levels,
        };

        setEmployees((prev) => [...prev, newEmp]);
        toast({ title: "Avaliação adicionada", description: "Avaliação salva com sucesso." });
        addNotification({
          userName: profile?.name || "Usuário",
          action: "CRIOU",
          resource: "Competências",
          details: `Adicionou avaliação de ${employee.name}`,
        });
      } catch (error) {
        console.error("Error creating evaluation:", error);
        toast({ title: "Erro ao salvar", description: "Não foi possível salvar a avaliação.", variant: "destructive" });
      }
    })();
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
        <div className="stat-card overflow-x-auto relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
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
                {(isAdmin || profile?.role === "gerente") && (
                  <th className="p-3 text-xs text-muted-foreground font-medium text-center border-b border-border w-16">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.user_id} className="hover:bg-secondary/30 group">
                  <td className="p-3 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {employee.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {employee.role} • {employee.department}
                        </p>
                      </div>
                    </div>
                  </td>
                  {employee.levels.map((level: number, i: number) => (
                    <td key={i} className="p-3 text-center border-b border-border">
                      {isAdmin || profile?.role === "gerente" ? (
                        <Select
                          value={level.toString()}
                          onValueChange={(v) => updateCompetencyLevel(employee.user_id, i, parseInt(v))}
                        >
                          <SelectTrigger className={cn(
                            "w-8 h-8 rounded-full mx-auto border-none p-0 flex items-center justify-center font-bold text-xs transition-transform hover:scale-110",
                            levelColors[level as keyof typeof levelColors] || "bg-secondary text-muted-foreground"
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
                      ) : (
                        <div className={cn(
                          "w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs",
                          levelColors[level as keyof typeof levelColors] || "bg-secondary text-muted-foreground"
                        )}>
                          {level || "-"}
                        </div>
                      )}
                    </td>
                  ))}
                  {(isAdmin || profile?.role === "gerente") && (
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
                  )}
                </tr>
              ))}
              <tr className="bg-secondary/20">
                <td className="p-3 font-semibold text-sm">Média</td>
                {avgLevels.map((avg, i) => (
                  <td key={i} className="p-3 text-center font-bold text-primary text-sm">
                    {avg}
                  </td>
                ))}
                {(isAdmin || profile?.role === "gerente") && <td></td>}
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

import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { OKRProgress } from "@/components/dashboard/OKRProgress";
import { KPIChart } from "@/components/dashboard/KPIChart";
import { useAppStore } from "@/hooks/useAppStore";
import { useOKRs } from "@/hooks/useOKRs";
import { useKPIs } from "@/hooks/useKPIs";
import {
  GraduationCap,
  Target,
  Crosshair,
  GitBranch,
  TrendingUp,
  Users,
} from "lucide-react";

export default function Dashboard() {
  const { trainings } = useAppStore();
  const { kpis } = useKPIs();
  const { okrs } = useOKRs();

  const activeTrainings = trainings.filter((t) => t.status === "active").length;
  const onTrackKPIs = kpis.filter((k) => k.status === "on-track").length;
  const totalKeyResults = okrs.reduce((acc, okr) => acc + okr.keyResults.length, 0);

  // Calculate overall efficiency
  const avgKPIProgress = kpis.length > 0
    ? Math.round(kpis.reduce((acc, k) => acc + (k.current / k.target) * 100, 0) / kpis.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da eficiência operacional
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Última atualização:</span>
          <span className="text-foreground font-medium">Agora</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Treinamentos Ativos"
          value={activeTrainings}
          change={`${trainings.length} total`}
          changeType="positive"
          icon={GraduationCap}
          delay={0}
        />
        <StatCard
          title="KPIs Monitorados"
          value={kpis.length}
          change={`${onTrackKPIs} no caminho`}
          changeType="positive"
          icon={Target}
          delay={100}
        />
        <StatCard
          title="OKRs em Progresso"
          value={okrs.length}
          change={`${totalKeyResults} key results`}
          changeType="neutral"
          icon={Crosshair}
          delay={200}
        />
        <StatCard
          title="Processos Mapeados"
          value={156}
          change="+8 novos"
          changeType="positive"
          icon={GitBranch}
          delay={300}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* KPI Chart - Spans 2 columns */}
        <div className="lg:col-span-2">
          <KPIChart />
        </div>

        {/* Overall Progress */}
        <div className="stat-card flex flex-col items-center justify-center gap-4">
          <h3 className="text-lg font-semibold">Eficiência Geral</h3>
          <ProgressRing progress={Math.min(avgKPIProgress, 100)} size={160} label="do objetivo" />
          <div className="grid grid-cols-2 gap-4 w-full mt-4">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Tendência</p>
              <p className="text-sm font-semibold text-success">+12%</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <Users className="h-5 w-5 text-info mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Equipes</p>
              <p className="text-sm font-semibold">8 ativas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <OKRProgress okrs={okrs} />
        <RecentActivity />
      </div>
    </div>
  );
}

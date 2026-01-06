import { CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "completed",
    title: "Treinamento de Segurança concluído",
    user: "Maria Silva",
    time: "Há 2 horas",
    icon: CheckCircle2,
  },
  {
    id: 2,
    type: "pending",
    title: "OKR Q1 precisa de atualização",
    user: "Equipe Comercial",
    time: "Há 4 horas",
    icon: Clock,
  },
  {
    id: 3,
    type: "alert",
    title: "KPI de Produtividade abaixo da meta",
    user: "Setor Produção",
    time: "Há 6 horas",
    icon: AlertCircle,
  },
  {
    id: 4,
    type: "success",
    title: "Meta de vendas atingida",
    user: "Equipe Vendas",
    time: "Há 8 horas",
    icon: TrendingUp,
  },
];

export function RecentActivity() {
  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                activity.type === "completed" && "bg-success/10 text-success",
                activity.type === "pending" && "bg-warning/10 text-warning",
                activity.type === "alert" && "bg-destructive/10 text-destructive",
                activity.type === "success" && "bg-primary/10 text-primary"
              )}
            >
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{activity.title}</p>
              <p className="text-xs text-muted-foreground">
                {activity.user} • {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

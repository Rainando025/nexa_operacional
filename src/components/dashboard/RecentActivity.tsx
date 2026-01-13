import { CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/useAppStore";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function RecentActivity() {
  const { notifications } = useAppStore();

  // Mapping types to icons/colors
  const getIconAndColor = (action: string) => {
    switch (action) {
      case "CRIOU":
        return { icon: Plus, color: "bg-success/10 text-success" };
      case "EDITOU":
        return { icon: Edit2, color: "bg-primary/10 text-primary" };
      case "EXCLUIU":
        return { icon: Trash2, color: "bg-destructive/10 text-destructive" };
      case "LEMBRETE":
        return { icon: Clock, color: "bg-warning/10 text-warning" };
      default:
        return { icon: CheckCircle2, color: "bg-secondary/10 text-secondary" };
    }
  };

  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma atividade recente.
          </p>
        ) : (
          notifications.slice(0, 10).map((n, index) => {
            const style = getIconAndColor(n.action);
            const Icon = style.icon;

            return (
              <div
                key={n.id}
                className="flex items-start gap-3 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    style.color
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {n.userName} {n.action.toLowerCase()} {n.resource}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    {n.details}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.timestamp), { locale: ptBR, addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

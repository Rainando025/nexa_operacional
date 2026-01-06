import { Progress } from "@/components/ui/progress";

const okrs = [
  {
    id: 1,
    objective: "Aumentar eficiência operacional",
    progress: 75,
    keyResults: 3,
    completed: 2,
  },
  {
    id: 2,
    objective: "Melhorar satisfação do cliente",
    progress: 60,
    keyResults: 4,
    completed: 2,
  },
  {
    id: 3,
    objective: "Reduzir custos operacionais",
    progress: 45,
    keyResults: 3,
    completed: 1,
  },
  {
    id: 4,
    objective: "Desenvolver equipe de alta performance",
    progress: 85,
    keyResults: 5,
    completed: 4,
  },
];

export function OKRProgress() {
  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold mb-4">Progresso dos OKRs</h3>
      <div className="space-y-4">
        {okrs.map((okr, index) => (
          <div
            key={okr.id}
            className="space-y-2 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate flex-1 mr-4">
                {okr.objective}
              </p>
              <span className="text-xs text-muted-foreground shrink-0">
                {okr.completed}/{okr.keyResults} KRs
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={okr.progress} className="flex-1 h-2" />
              <span className="text-sm font-medium text-primary w-12 text-right">
                {okr.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

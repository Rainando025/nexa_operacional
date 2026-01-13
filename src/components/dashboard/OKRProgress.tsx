import { Progress } from "@/components/ui/progress";
import { OKR } from "@/hooks/useOKRs";

interface OKRProgressProps {
  okrs: OKR[];
}

export function OKRProgress({ okrs }: OKRProgressProps) {
  return (
    <div className="stat-card">
      <h3 className="text-lg font-semibold mb-4">Progresso dos OKRs</h3>
      <div className="space-y-4">
        {okrs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum OKR definido.
          </p>
        ) : (
          okrs.map((okr, index) => {
            const completedKRs = okr.keyResults.filter(kr => kr.status === "completed").length;
            const progress = okr.keyResults.length > 0
              ? Math.round((okr.keyResults.reduce((acc, kr) => acc + (Math.min((kr.current / kr.target) * 100, 100)), 0)) / okr.keyResults.length)
              : 0;

            return (
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
                    {completedKRs}/{okr.keyResults.length} KRs
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="flex-1 h-2" />
                  <span className="text-sm font-medium text-primary w-12 text-right">
                    {progress}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

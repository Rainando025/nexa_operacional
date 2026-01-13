import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useKPIs } from "@/hooks/useKPIs";
import { useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function KPIChart() {
  const { kpis } = useKPIs();

  const data = useMemo(() => {
    if (!kpis.length) return [];

    // 1. Collect all unique months from history across all KPIs
    const monthMap = new Map<string, {
      name: string;
      produtividade: number[];
      qualidade: number[];
      eficiencia: number[];
      date: number
    }>();

    // Initialize with last 6 months to ensure chart looks good even with empty data
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = format(d, "yyyy-MM");
      monthMap.set(key, {
        name: format(d, "MMM", { locale: ptBR }),
        produtividade: [],
        qualidade: [],
        eficiencia: [],
        date: d.getTime()
      });
    }

    kpis.forEach(kpi => {
      kpi.history.forEach(h => {
        const date = parseISO(h.date);
        const key = format(date, "yyyy-MM");

        if (!monthMap.has(key)) {
          monthMap.set(key, {
            name: format(date, "MMM", { locale: ptBR }),
            produtividade: [],
            qualidade: [],
            eficiencia: [],
            date: date.getTime()
          });
        }

        const entry = monthMap.get(key)!;
        const progress = (h.value / kpi.target) * 100;

        // Map categories to chart lines
        if (kpi.category === "Operacional") {
          entry.produtividade.push(progress);
        } else if (kpi.category === "Qualidade") {
          entry.qualidade.push(progress);
        }

        // Eficiencia (Average of all)
        entry.eficiencia.push(progress);
      });
    });

    // Calculate averages and sort by date
    return Array.from(monthMap.values())
      .sort((a, b) => a.date - b.date)
      .slice(-6) // Keep last 6 months
      .map(entry => ({
        name: entry.name,
        produtividade: entry.produtividade.length ? entry.produtividade.reduce((a, b) => a + b, 0) / entry.produtividade.length : 0,
        qualidade: entry.qualidade.length ? entry.qualidade.reduce((a, b) => a + b, 0) / entry.qualidade.length : 0,
        eficiencia: entry.eficiencia.length ? entry.eficiencia.reduce((a, b) => a + b, 0) / entry.eficiencia.length : 0,
      }));

  }, [kpis]);

  return (
    <div className="stat-card h-[350px]">
      <h3 className="text-lg font-semibold mb-4">Evolução dos KPIs (Média % da Meta)</h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorQual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorEfic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
          <XAxis
            dataKey="name"
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 8%)",
              border: "1px solid hsl(217, 33%, 17%)",
              borderRadius: "8px",
              color: "hsl(210, 40%, 98%)",
            }}
            formatter={(value: number) => [value.toFixed(1) + "%", ""]}
          />
          <Area
            type="monotone"
            dataKey="produtividade"
            name="Operacional"
            stroke="hsl(160, 84%, 39%)"
            fillOpacity={1}
            fill="url(#colorProd)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="qualidade"
            name="Qualidade"
            stroke="hsl(217, 91%, 60%)"
            fillOpacity={1}
            fill="url(#colorQual)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="eficiencia"
            name="Geral"
            stroke="hsl(38, 92%, 50%)"
            fillOpacity={1}
            fill="url(#colorEfic)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

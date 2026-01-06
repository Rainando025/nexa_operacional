import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Jan", produtividade: 65, qualidade: 78, eficiencia: 72 },
  { name: "Fev", produtividade: 72, qualidade: 82, eficiencia: 75 },
  { name: "Mar", produtividade: 78, qualidade: 80, eficiencia: 79 },
  { name: "Abr", produtividade: 74, qualidade: 85, eficiencia: 82 },
  { name: "Mai", produtividade: 82, qualidade: 88, eficiencia: 85 },
  { name: "Jun", produtividade: 88, qualidade: 90, eficiencia: 89 },
];

export function KPIChart() {
  return (
    <div className="stat-card h-[350px]">
      <h3 className="text-lg font-semibold mb-4">Evolução dos KPIs</h3>
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
          />
          <Area
            type="monotone"
            dataKey="produtividade"
            name="Produtividade"
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
            name="Eficiência"
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

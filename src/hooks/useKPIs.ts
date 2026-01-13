import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface KPI {
    id: string;
    name: string;
    category: string;
    current: number;
    target: number;
    previous: number;
    unit: string;
    trend: "up" | "down" | "stable";
    status: "on-track" | "at-risk" | "off-track";
    history: { date: string; value: number }[];
    department_id?: string;
}

export function useKPIs() {
    const { profile, isAdmin } = useAuth();
    const { toast } = useToast();
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKPIs = async () => {
        try {
            let query = supabase.from("kpis").select("*, kpi_history(*)");

            if (!isAdmin && profile?.department_id) {
                query = query.eq("department_id", profile.department_id);
            }

            const { data: kpisData, error: kpisError } = await query;

            if (kpisError) throw kpisError;

            const kpisWithHistory = (kpisData || []).map((kpi: any) => ({
                ...kpi,
                history: (kpi.kpi_history || [])
                    .sort((a: any, b: any) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
                    .map((h: any) => ({
                        date: h.recorded_at,
                        value: h.value,
                    })),
            }));

            setKpis(kpisWithHistory as KPI[]);
        } catch (error) {
            console.error("Error fetching KPIs:", error);
            toast({
                title: "Erro ao carregar KPIs",
                description: "Não foi possível carregar os indicadores atualizados.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKPIs();

        const channel = supabase
            .channel("active_kpis_changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "kpis" }, () => fetchKPIs())
            .on("postgres_changes", { event: "*", schema: "public", table: "kpi_history" }, () => fetchKPIs())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.department_id, isAdmin]);

    return { kpis, loading, refetch: fetchKPIs };
}

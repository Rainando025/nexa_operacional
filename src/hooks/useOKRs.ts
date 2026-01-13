import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  status: "completed" | "on-track" | "at-risk" | "not-started";
  history?: { date: string; value: number }[];
}

export interface OKR {
  id: string;
  objective: string;
  owner: string;
  deadline: string;
  description?: string;
  keyResults: KeyResult[];
  department_id?: string;
  owner_id?: string;
}

export function useOKRs() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOKRs = async () => {
    try {
      // Admins veem todos os OKRs, outros usuários veem apenas do seu departamento
      let query = supabase.from("okrs").select("*, key_results(*)");

      if (!isAdmin && profile?.department_id) {
        query = query.eq("department_id", profile.department_id);
      }

      const { data: okrsData, error: okrsError } = await query;

      if (okrsError) throw okrsError;

      const okrsWithKRs = (okrsData || []).map((okr: any) => ({
        ...okr,
        keyResults: (okr.key_results || []).map((kr: any) => ({
          id: kr.id,
          title: kr.title,
          current: kr.current,
          target: kr.target,
          unit: kr.unit,
          status: kr.status,
          history: kr.history || [],
        })),
      }));

      setOkrs(okrsWithKRs as OKR[]);

      setOkrs(okrsWithKRs as OKR[]);
    } catch (error) {
      console.error("Error fetching OKRs:", error);
      toast({
        title: "Erro ao carregar OKRs",
        description: "Não foi possível carregar os dados atualizados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOKRs();

    const channel = supabase
      .channel("metrics_dashboard_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "okrs" }, () => fetchOKRs())
      .on("postgres_changes", { event: "*", schema: "public", table: "key_results" }, () => fetchOKRs())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.department_id, isAdmin]);

  return { okrs, loading, refetch: fetchOKRs };
}

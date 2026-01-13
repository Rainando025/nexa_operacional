import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Database Tables
export const TABLES = {
    KANBAN: "visual_kanban_items",
    GUT: "visual_gut_items",
    EISENHOWER: "visual_eisenhower_items",
    W5H2: "visual_5w2h_items",
    PARETO: "visual_pareto_items",
};

export function useGestaoVisual() {
    const [loading, setLoading] = useState(true);
    const [kanbanItems, setKanbanItems] = useState<any[]>([]);
    const [gutItems, setGutItems] = useState<any[]>([]);
    const [eisenhowerItems, setEisenhowerItems] = useState<any[]>([]);
    const [w5h2Items, setW5H2Items] = useState<any[]>([]);
    const [paretoItems, setParetoItems] = useState<any[]>([]);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: kanban } = await supabase.from(TABLES.KANBAN).select("*").order("position");
            const { data: gut } = await supabase.from(TABLES.GUT).select("*").order("created_at");
            const { data: eisenhower } = await supabase.from(TABLES.EISENHOWER).select("*").order("created_at");
            const { data: w5h2 } = await supabase.from(TABLES.W5H2).select("*").order("created_at");
            const { data: pareto } = await supabase.from(TABLES.PARETO).select("*").order("frequency", { ascending: false });

            if (kanban) setKanbanItems(kanban);
            if (gut) setGutItems(gut);
            if (eisenhower) setEisenhowerItems(eisenhower);
            if (w5h2) setW5H2Items(w5h2);
            if (pareto) setParetoItems(pareto);
        } catch (error) {
            console.error("Error fetching visual management data:", error);
            toast({ title: "Erro ao carregar dados", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Generic Operations
    const createItem = async (table: string, item: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from(table)
            .insert({ ...item, user_id: user.id })
            .select()
            .single();

        if (error) {
            console.error(`Error creating in ${table}:`, error);
            toast({ title: "Erro ao criar item", variant: "destructive" });
            return null;
        }
        return data;
    };

    const updateItem = async (table: string, id: string, updates: any) => {
        const { error } = await supabase
            .from(table)
            .update(updates)
            .eq("id", id);

        if (error) {
            console.error(`Error updating in ${table}:`, error);
            toast({ title: "Erro ao atualizar item", variant: "destructive" });
        }
    };

    const deleteItem = async (table: string, id: string) => {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq("id", id);

        if (error) {
            console.error(`Error deleting from ${table}:`, error);
            toast({ title: "Erro ao excluir item", variant: "destructive" });
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel("visual_management_changes")
            .on("postgres_changes", { event: "*", schema: "public" }, () => {
                fetchData(); // Simplest strategy: refetch all on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);

    return {
        loading,
        kanbanItems,
        gutItems,
        eisenhowerItems,
        w5h2Items,
        paretoItems,
        createItem,
        updateItem,
        deleteItem,
        refresh: fetchData,
    };
}

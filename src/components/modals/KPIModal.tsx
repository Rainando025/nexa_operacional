import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { KPI } from "@/hooks/useAppStore";

const kpiSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  category: z.string().min(1, "Selecione uma categoria"),
  current: z.coerce.number().min(0, "Valor deve ser positivo"),
  target: z.coerce.number().min(0, "Meta deve ser positiva"),
  unit: z.string().min(1, "Informe a unidade"),
});

type KPIFormData = z.infer<typeof kpiSchema>;

const categories = [
  "Operacional",
  "Qualidade",
  "Financeiro",
  "RH",
  "Logística",
  "Atendimento",
  "Manutenção",
];

interface KPIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<KPI, "id">) => void;
  initialData?: KPI;
}

export function KPIModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: KPIModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<KPIFormData>({
    resolver: zodResolver(kpiSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          category: initialData.category,
          current: initialData.current,
          target: initialData.target,
          unit: initialData.unit,
        }
      : {
          name: "",
          category: "",
          current: 0,
          target: 0,
          unit: "%",
        },
  });

  const calculateStatus = (current: number, target: number): KPI["status"] => {
    const ratio = current / target;
    if (ratio >= 0.95) return "on-track";
    if (ratio >= 0.8) return "at-risk";
    return "off-track";
  };

  const handleSubmit = async (data: KPIFormData) => {
    setIsSubmitting(true);
    try {
      const status = calculateStatus(data.current, data.target);
      const previous = initialData?.previous || data.current * 0.95;
      const trend: KPI["trend"] = data.current > previous ? "up" : data.current < previous ? "down" : "stable";

      const kpiData: Omit<KPI, "id"> = {
        name: data.name,
        category: data.category,
        current: data.current,
        target: data.target,
        unit: data.unit,
        previous,
        trend,
        status,
      };
      onSubmit(kpiData);
      toast({
        title: initialData ? "KPI atualizado!" : "KPI criado!",
        description: `O KPI "${data.name}" foi ${initialData ? "atualizado" : "criado"} com sucesso.`,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar KPI" : "Novo KPI"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do KPI</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Taxa de Produtividade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Atual</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input placeholder="%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : initialData ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

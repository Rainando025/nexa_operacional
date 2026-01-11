import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import { OKR, KeyResult } from "@/hooks/useAppStore";

const keyResultSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  current: z.coerce.number().min(0, "Valor deve ser positivo"),
  target: z.coerce.number().min(1, "Meta deve ser maior que 0"),
  unit: z.string().min(1, "Informe a unidade"),
});

const okrSchema = z.object({
  objective: z.string().min(5, "Objetivo deve ter no mínimo 5 caracteres"),
  owner: z.string().min(2, "Responsável deve ter no mínimo 2 caracteres"),
  deadline: z.string().min(1, "Selecione o prazo"),
  description: z.string().optional(),
  keyResults: z.array(keyResultSchema).min(1, "Adicione pelo menos 1 Key Result"),
});

type OKRFormData = z.infer<typeof okrSchema>;

interface OKRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<OKR, "id">) => void;
  initialData?: OKR;
}



export function OKRModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: OKRModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OKRFormData>({
    resolver: zodResolver(okrSchema),
    defaultValues: {
      objective: "",
      owner: "",
      deadline: new Date().toISOString().slice(0, 7),
      description: "",
      keyResults: [{ title: "", current: 0, target: 100, unit: "%" }],
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          objective: initialData.objective,
          owner: initialData.owner,
          deadline: initialData.deadline,
          description: initialData.description,
          keyResults: initialData.keyResults.map((kr) => ({
            title: kr.title,
            current: kr.current,
            target: kr.target,
            unit: kr.unit,
          })),
        });
      } else {
        form.reset({
          objective: "",
          owner: "",
          deadline: new Date().toISOString().slice(0, 7), // YYYY-MM
          description: "",
          keyResults: [{ title: "", current: 0, target: 100, unit: "%" }],
        });
      }
    }
  }, [open, initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  const calculateKRStatus = (current: number, target: number): KeyResult["status"] => {
    const ratio = current / target;
    if (ratio >= 1) return "completed";
    if (ratio >= 0.7) return "on-track";
    if (ratio >= 0.3) return "at-risk";
    return "not-started";
  };

  const handleSubmit = async (data: OKRFormData) => {
    setIsSubmitting(true);
    try {
      const keyResults: KeyResult[] = data.keyResults.map((kr, index) => ({
        id: initialData?.keyResults[index]?.id || `kr-${Date.now()}-${index}`,
        title: kr.title,
        current: kr.current,
        target: kr.target,
        unit: kr.unit,
        status: calculateKRStatus(kr.current, kr.target),
      }));

      const okrData: Omit<OKR, "id"> = {
        objective: data.objective,
        owner: data.owner,
        deadline: data.deadline,
        description: data.description,
        keyResults,
      };
      onSubmit(okrData);
      toast({
        title: initialData ? "OKR atualizado!" : "OKR criado!",
        description: `O OKR "${data.objective}" foi ${initialData ? "atualizado" : "criado"} com sucesso.`,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar OKR" : "Novo OKR"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aumentar a eficiência operacional em 25%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalhes adicionais sobre este OKR" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Equipe Operações" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Key Results</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ title: "", current: 0, target: 100, unit: "%" })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">KR {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`keyResults.${index}.title`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Título do Key Result" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.current`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Atual</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.target`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Meta</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Medida</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="%">Porcentagem (%)</SelectItem>
                              <SelectItem value="R$">Monetário (R$)</SelectItem>
                              <SelectItem value="un">Numérico (un)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
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

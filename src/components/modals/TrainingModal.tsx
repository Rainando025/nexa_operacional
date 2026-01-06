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
import { Training } from "@/hooks/useAppStore";

const trainingSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  category: z.enum(["Obrigatório", "Desenvolvimento", "Técnico"], {
    required_error: "Selecione uma categoria",
  }),
  participants: z.coerce.number().min(1, "Mínimo 1 participante"),
  duration: z.string().min(1, "Informe a duração"),
  deadline: z.string().min(1, "Informe o prazo"),
  status: z.enum(["active", "completed", "pending"], {
    required_error: "Selecione o status",
  }),
});

type TrainingFormData = z.infer<typeof trainingSchema>;

interface TrainingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Training, "id">) => void;
  initialData?: Training;
}

export function TrainingModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: TrainingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TrainingFormData>({
    resolver: zodResolver(trainingSchema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          category: initialData.category,
          participants: initialData.participants,
          duration: initialData.duration,
          deadline: initialData.deadline,
          status: initialData.status,
        }
      : {
          title: "",
          category: undefined,
          participants: 1,
          duration: "",
          deadline: "",
          status: "pending",
        },
  });

  const handleSubmit = async (data: TrainingFormData) => {
    setIsSubmitting(true);
    try {
      const trainingData: Omit<Training, "id"> = {
        title: data.title,
        category: data.category,
        participants: data.participants,
        duration: data.duration,
        deadline: data.deadline,
        status: data.status,
        completed: initialData?.completed || 0,
      };
      onSubmit(trainingData);
      toast({
        title: initialData ? "Treinamento atualizado!" : "Treinamento criado!",
        description: `O treinamento "${data.title}" foi ${initialData ? "atualizado" : "criado"} com sucesso.`,
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
            {initialData ? "Editar Treinamento" : "Novo Treinamento"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do treinamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Obrigatório">Obrigatório</SelectItem>
                        <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="Técnico">Técnico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="active">Em andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participantes</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 4h" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

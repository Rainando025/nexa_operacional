import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Process } from "@/hooks/useAppStore";

const processSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  department: z.string().min(2, "Departamento é obrigatório"),
  owner: z.string().min(2, "Responsável é obrigatório"),
  version: z.string().min(1, "Versão é obrigatória"),
  status: z.enum(["active", "review", "draft"]),
  risk: z.enum(["low", "medium", "high"]),
  nextReview: z.string().min(1, "Data de revisão é obrigatória"),
  description: z.string().optional(),
  content: z.string().optional(),
});

type ProcessFormValues = z.infer<typeof processSchema>;

interface ProcessModalProps {
  open: boolean;
  onClose: () => void;
  process?: Process | null;
  onSave: (data: Omit<Process, "id" | "lastReview">) => void;
  viewOnly?: boolean;
}

export function ProcessModal({ open, onClose, process, onSave, viewOnly = false }: ProcessModalProps) {
  const form = useForm<ProcessFormValues>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      name: "",
      department: "",
      owner: "",
      version: "1.0",
      status: "draft",
      risk: "low",
      nextReview: "",
      description: "",
      content: "",
    },
  });

  useEffect(() => {
    if (process) {
      form.reset({
        name: process.name,
        department: process.department,
        owner: process.owner,
        version: process.version,
        status: process.status,
        risk: process.risk,
        nextReview: process.nextReview,
        description: process.description || "",
        content: process.content || "",
      });
    } else {
      form.reset({
        name: "",
        department: "",
        owner: "",
        version: "1.0",
        status: "draft",
        risk: "low",
        nextReview: "",
        description: "",
        content: "",
      });
    }
  }, [process, form]);

  const onSubmit = (data: ProcessFormValues) => {
    onSave({
      name: data.name,
      department: data.department,
      owner: data.owner,
      version: data.version,
      status: data.status,
      risk: data.risk,
      nextReview: data.nextReview,
      description: data.description,
      content: data.content,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewOnly ? "Visualizar Processo" : process ? "Editar Processo" : "Novo Processo"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome do Processo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={viewOnly} placeholder="Ex: Processo de Compras" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={viewOnly} placeholder="Ex: Suprimentos" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={viewOnly} placeholder="Ex: Carlos Mendes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={viewOnly} placeholder="Ex: 1.0" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextReview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próxima Revisão</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={viewOnly} placeholder="Ex: 10/07/2024" />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value} disabled={viewOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="review">Em Revisão</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="risk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Risco</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={viewOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o risco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={viewOnly}
                        placeholder="Descreva o objetivo e escopo do processo..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Conteúdo / Procedimentos</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={viewOnly}
                        placeholder="Descreva os passos, procedimentos e instruções detalhadas do processo..."
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!viewOnly && (
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {process ? "Salvar Alterações" : "Criar Processo"}
                </Button>
              </div>
            )}

            {viewOnly && (
              <div className="flex justify-end pt-4">
                <Button type="button" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

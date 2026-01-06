import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: number;
  name: string;
  role: string;
  department: string;
  levels: number[];
}

interface AvaliacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (employee: Employee) => void;
  skills: string[];
  departments: string[];
}

const levelLabels: Record<number, string> = {
  1: "Iniciante",
  2: "Básico",
  3: "Intermediário",
  4: "Avançado",
  5: "Especialista",
};

export default function AvaliacaoModal({
  open,
  onOpenChange,
  onSave,
  skills,
  departments,
}: AvaliacaoModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [levels, setLevels] = useState<number[]>(skills.map(() => 3));

  const handleSave = () => {
    if (!name.trim() || !role.trim() || !department) return;

    onSave({
      id: Date.now(),
      name: name.trim(),
      role: role.trim(),
      department,
      levels,
    });

    // Reset form
    setName("");
    setRole("");
    setDepartment("");
    setLevels(skills.map(() => 3));
    onOpenChange(false);
  };

  const updateLevel = (index: number, value: number) => {
    setLevels((prev) => prev.map((l, i) => (i === index ? value : l)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Avaliação de Competências</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Employee Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Nome do Colaborador</Label>
              <Input
                id="emp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Digite o nome"
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-role">Cargo</Label>
              <Input
                id="emp-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Digite o cargo"
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Departamento</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills Assessment */}
          <div className="space-y-4">
            <Label>Avaliação de Competências</Label>
            <div className="grid gap-3">
              {skills.map((skill, index) => (
                <div
                  key={skill}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <span className="font-medium">{skill}</span>
                  <Select
                    value={levels[index].toString()}
                    onValueChange={(v) => updateLevel(index, parseInt(v))}
                  >
                    <SelectTrigger className="w-48 bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} - {levelLabels[n]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !role.trim() || !department}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Avaliação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

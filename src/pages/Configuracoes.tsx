import { useState, useEffect, useCallback } from "react";
import { User, Bell, Shield, Database, Palette, Users, Building2, Layers, Plus, Trash2, Edit, Check, X, Key, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database as DB } from "@/integrations/supabase/types";

type AppRole = DB["public"]["Enums"]["app_role"];

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: AppRole;
  department_id: string | null;
  sector_id: string | null;
  avatar_url: string | null;
}

interface Department {
  id: string;
  name: string;
  created_at: string;
}

interface Sector {
  id: string;
  name: string;
  department_id: string;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  coordenador: "Coordenador",
  analista: "Analista",
  operador: "Operador",
};

const roles: AppRole[] = ["admin", "gerente", "coordenador", "analista", "operador"];

export default function Configuracoes() {
  const { toast } = useToast();
  const { profile: currentProfile } = useAuth();

  // Data states
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // User management
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Create user modal
  const [createUserModal, setCreateUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AppRole>("analista");
  const [newUserDept, setNewUserDept] = useState<string>("");
  const [newUserSector, setNewUserSector] = useState<string>("");
  const [creatingUser, setCreatingUser] = useState(false);

  // Password reset modal
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Department management
  const [newDeptName, setNewDeptName] = useState("");
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [savingDept, setSavingDept] = useState(false);

  // Sector management
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorDept, setNewSectorDept] = useState("");
  const [editingSector, setEditingSector] = useState<string | null>(null);
  const [editSectorData, setEditSectorData] = useState<Sector | null>(null);
  const [sectorToDelete, setSectorToDelete] = useState<Sector | null>(null);
  const [savingSector, setSavingSector] = useState(false);

  // Fetch all data


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, deptsRes, sectorsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("name"),
        supabase.from("departments").select("*").order("name"),
        supabase.from("sectors").select("*").order("name"),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (deptsRes.data) setDepartments(deptsRes.data);
      if (sectorsRes.data) setSectors(sectorsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create user function
  const createUser = async () => {
    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email, nome e senha.",
        variant: "destructive",
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setCreatingUser(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("create-user", {
        body: {
          email: newUserEmail.trim(),
          password: newUserPassword,
          name: newUserName.trim(),
          role: newUserRole,
          department_id: newUserDept || null,
          sector_id: newUserSector || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Usuário criado",
        description: `${newUserName} foi adicionado ao sistema.`,
      });

      // Refresh users list
      await fetchData();

      // Reset form
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setNewUserRole("analista");
      setNewUserDept("");
      setNewUserSector("");
      setCreateUserModal(false);
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Erro ao criar usuário",
        description: (error as Error).message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // User functions
  const startEditUser = (user: UserProfile) => {
    setEditingUser(user.id);
    setEditUserData({ ...user });
  };

  const saveEditUser = async () => {
    if (!editUserData) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: editUserData.name,
          role: editUserData.role,
          department_id: editUserData.department_id,
          sector_id: editUserData.sector_id,
        })
        .eq("id", editUserData.id);

      if (profileError) throw profileError;

      // Update user_roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: editUserData.role })
        .eq("user_id", editUserData.user_id);

      if (roleError) throw roleError;

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram salvas.",
      });

      setUsers(prev => prev.map(u => u.id === editUserData.id ? editUserData : u));
      setEditingUser(null);
      setEditUserData(null);
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Erro ao atualizar",
        description: (error as Error).message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    // Prevent deleting yourself
    if (userToDelete.user_id === currentProfile?.user_id) {
      toast({
        title: "Ação não permitida",
        description: "Você não pode excluir sua própria conta.",
        variant: "destructive",
      });
      setUserToDelete(null);
      return;
    }

    try {
      // Delete from profiles (cascade will handle user_roles)
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) throw error;

      toast({
        title: "Usuário removido",
        description: "O usuário foi removido do sistema.",
      });

      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erro ao remover",
        description: (error as Error).message || "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    }
  };

  const openPasswordModal = (user: UserProfile) => {
    setPasswordUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModal(true);
  };

  const handleResetPassword = async () => {
    if (!passwordUser) return;

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A confirmação de senha não corresponde.",
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      // Note: Admin password reset requires service role key
      // For now, we'll send a password reset email instead
      const { error } = await supabase.auth.resetPasswordForEmail(
        passwordUser.email,
        { redirectTo: `${window.location.origin}/auth` }
      );

      if (error) throw error;

      toast({
        title: "Email enviado",
        description: `Um link de redefinição de senha foi enviado para ${passwordUser.email}.`,
      });

      setPasswordModal(false);
      setPasswordUser(null);
    } catch (error) {
      console.error("Error resetting password:", error);
      toast({
        title: "Erro ao redefinir senha",
        description: (error as Error).message || "Não foi possível enviar o email de redefinição.",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Department functions
  const addDepartment = async () => {
    if (!newDeptName.trim()) return;

    setSavingDept(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name: newDeptName.trim() })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Departamento criado",
        description: `${newDeptName} foi adicionado.`,
      });

      setDepartments(prev => [...prev, data]);
      setNewDeptName("");
    } catch (error) {
      console.error("Error creating department:", error);
      toast({
        title: "Erro ao criar departamento",
        description: (error as Error).message || "Não foi possível criar o departamento.",
        variant: "destructive",
      });
    } finally {
      setSavingDept(false);
    }
  };

  const startEditDept = (dept: Department) => {
    setEditingDept(dept.id);
    setEditDeptName(dept.name);
  };

  const saveEditDept = async () => {
    if (!editDeptName.trim() || !editingDept) return;

    try {
      const { error } = await supabase
        .from("departments")
        .update({ name: editDeptName.trim() })
        .eq("id", editingDept);

      if (error) throw error;

      toast({
        title: "Departamento atualizado",
        description: "O nome foi salvo.",
      });

      setDepartments(prev =>
        prev.map(d => d.id === editingDept ? { ...d, name: editDeptName.trim() } : d)
      );
      setEditingDept(null);
      setEditDeptName("");
    } catch (error) {
      console.error("Error updating department:", error);
      toast({
        title: "Erro ao atualizar",
        description: (error as Error).message || "Não foi possível atualizar o departamento.",
        variant: "destructive",
      });
    }
  };

  const deleteDepartment = async () => {
    if (!deptToDelete) return;

    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", deptToDelete.id);

      if (error) throw error;

      toast({
        title: "Departamento removido",
        description: `${deptToDelete.name} foi removido.`,
      });

      setDepartments(prev => prev.filter(d => d.id !== deptToDelete.id));
      setSectors(prev => prev.filter(s => s.department_id !== deptToDelete.id));
      setDeptToDelete(null);
    } catch (error) {
      console.error("Error deleting department:", error);
      toast({
        title: "Erro ao remover",
        description: (error as Error).message || "Não foi possível remover o departamento.",
        variant: "destructive",
      });
    }
  };

  // Sector functions
  const addSector = async () => {
    if (!newSectorName.trim() || !newSectorDept) return;

    setSavingSector(true);
    try {
      const { data, error } = await supabase
        .from("sectors")
        .insert({
          name: newSectorName.trim(),
          department_id: newSectorDept,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Setor criado",
        description: `${newSectorName} foi adicionado.`,
      });

      setSectors(prev => [...prev, data]);
      setNewSectorName("");
      setNewSectorDept("");
    } catch (error) {
      console.error("Error creating sector:", error);
      toast({
        title: "Erro ao criar setor",
        description: (error as Error).message || "Não foi possível criar o setor.",
        variant: "destructive",
      });
    } finally {
      setSavingSector(false);
    }
  };

  const startEditSector = (sector: Sector) => {
    setEditingSector(sector.id);
    setEditSectorData({ ...sector });
  };

  const saveEditSector = async () => {
    if (!editSectorData) return;

    try {
      const { error } = await supabase
        .from("sectors")
        .update({
          name: editSectorData.name,
          department_id: editSectorData.department_id,
        })
        .eq("id", editSectorData.id);

      if (error) throw error;

      toast({
        title: "Setor atualizado",
        description: "As informações foram salvas.",
      });

      setSectors(prev => prev.map(s => s.id === editSectorData.id ? editSectorData : s));
      setEditingSector(null);
      setEditSectorData(null);
    } catch (error) {
      console.error("Error updating sector:", error);
      toast({
        title: "Erro ao atualizar",
        description: (error as Error).message || "Não foi possível atualizar o setor.",
        variant: "destructive",
      });
    }
  };

  const deleteSector = async () => {
    if (!sectorToDelete) return;

    try {
      const { error } = await supabase
        .from("sectors")
        .delete()
        .eq("id", sectorToDelete.id);

      if (error) throw error;

      toast({
        title: "Setor removido",
        description: `${sectorToDelete.name} foi removido.`,
      });

      setSectors(prev => prev.filter(s => s.id !== sectorToDelete.id));
      setSectorToDelete(null);
    } catch (error) {
      console.error("Error deleting sector:", error);
      toast({
        title: "Erro ao remover",
        description: (error as Error).message || "Não foi possível remover o setor.",
        variant: "destructive",
      });
    }
  };

  const getDeptName = (id: string | null) =>
    departments.find(d => d.id === id)?.name || "—";

  const getSectorName = (id: string | null) =>
    sectors.find(s => s.id === id)?.name || "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie usuários, departamentos e setores do sistema
        </p>
      </div>

      {/* Users Section */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Usuários</h2>
              <p className="text-sm text-muted-foreground">
                Gerenciar usuários e permissões
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateUserModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Usuário
          </Button>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              {editingUser === user.id && editUserData ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={editUserData.name}
                        onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={editUserData.email}
                        disabled
                        className="bg-secondary/50 opacity-60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo</Label>
                      <Select
                        value={editUserData.role}
                        onValueChange={(v: AppRole) => setEditUserData({ ...editUserData, role: v })}
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Select
                        value={editUserData.department_id || "_none"}
                        onValueChange={(v) => setEditUserData({ ...editUserData, department_id: v === "_none" ? null : v, sector_id: null })}
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Nenhum</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Setor</Label>
                      <Select
                        value={editUserData.sector_id || "_none"}
                        onValueChange={(v) => setEditUserData({ ...editUserData, sector_id: v === "_none" ? null : v })}
                        disabled={!editUserData.department_id}
                      >
                        <SelectTrigger className="bg-secondary/50">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none">Nenhum</SelectItem>
                          {sectors
                            .filter(s => s.department_id === editUserData.department_id)
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { setEditingUser(null); setEditUserData(null); }}>
                      Cancelar
                    </Button>
                    <Button onClick={saveEditUser}>
                      <Check className="h-4 w-4 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      {user.user_id === currentProfile?.user_id && (
                        <Badge variant="outline" className="text-xs">Você</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {roleLabels[user.role]}
                      </Badge>
                      {user.department_id && (
                        <Badge variant="outline">{getDeptName(user.department_id)}</Badge>
                      )}
                      {user.sector_id && (
                        <Badge variant="outline" className="bg-muted/50">{getSectorName(user.sector_id)}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openPasswordModal(user)} title="Redefinir senha">
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => startEditUser(user)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.user_id !== currentProfile?.user_id && (
                      <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)} title="Remover">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-muted-foreground text-center py-8">Nenhum usuário encontrado.</p>
          )}
        </div>
      </div>

      {/* Departments Section */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-info/10">
            <Building2 className="h-5 w-5 text-info" />
          </div>
          <div>
            <h2 className="font-semibold">Departamentos</h2>
            <p className="text-sm text-muted-foreground">
              Gerenciar departamentos da empresa
            </p>
          </div>
        </div>

        {/* Add Department Form */}
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Nome do departamento"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="bg-secondary/50 flex-1"
            onKeyDown={(e) => e.key === "Enter" && addDepartment()}
          />
          <Button onClick={addDepartment} disabled={!newDeptName.trim() || savingDept}>
            {savingDept ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Adicionar
          </Button>
        </div>

        {/* Departments List */}
        <div className="grid gap-2 md:grid-cols-2">
          {departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              {editingDept === dept.id ? (
                <Input
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="bg-secondary/50 flex-1 mr-2"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && saveEditDept()}
                />
              ) : (
                <span className="font-medium">{dept.name}</span>
              )}
              <div className="flex gap-1">
                {editingDept === dept.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={saveEditDept}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingDept(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => startEditDept(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeptToDelete(dept)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {departments.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Nenhum departamento cadastrado.</p>
        )}
      </div>

      {/* Sectors Section */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-warning/10">
            <Layers className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="font-semibold">Setores</h2>
            <p className="text-sm text-muted-foreground">
              Gerenciar setores dentro dos departamentos
            </p>
          </div>
        </div>

        {/* Add Sector Form */}
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Nome do setor"
            value={newSectorName}
            onChange={(e) => setNewSectorName(e.target.value)}
            className="bg-secondary/50 flex-1"
          />
          <Select value={newSectorDept} onValueChange={setNewSectorDept}>
            <SelectTrigger className="w-48 bg-secondary/50">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addSector} disabled={!newSectorName.trim() || !newSectorDept || savingSector}>
            {savingSector ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Adicionar
          </Button>
        </div>

        {/* Sectors List */}
        <div className="grid gap-2 md:grid-cols-2">
          {sectors.map((sector) => (
            <div key={sector.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              {editingSector === sector.id && editSectorData ? (
                <div className="flex-1 flex gap-2 mr-2">
                  <Input
                    value={editSectorData.name}
                    onChange={(e) => setEditSectorData({ ...editSectorData, name: e.target.value })}
                    className="bg-secondary/50 flex-1"
                    autoFocus
                  />
                  <Select
                    value={editSectorData.department_id}
                    onValueChange={(v) => setEditSectorData({ ...editSectorData, department_id: v })}
                  >
                    <SelectTrigger className="w-32 bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <span className="font-medium">{sector.name}</span>
                  <Badge variant="outline" className="ml-2">{getDeptName(sector.department_id)}</Badge>
                </div>
              )}
              <div className="flex gap-1">
                {editingSector === sector.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={saveEditSector}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingSector(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => startEditSector(sector)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSectorToDelete(sector)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {sectors.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Nenhum setor cadastrado.</p>
        )}
      </div>

      {/* System Section */}
      <div className="stat-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Database className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="font-semibold">Sistema</h2>
            <p className="text-sm text-muted-foreground">
              Informações e manutenção
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-muted-foreground">Total de usuários</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-muted-foreground">Departamentos</p>
            <p className="text-2xl font-bold">{departments.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/30">
            <p className="text-muted-foreground">Setores</p>
            <p className="text-2xl font-bold">{sectors.length}</p>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <Dialog open={passwordModal} onOpenChange={setPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Um email de redefinição de senha será enviado para {passwordUser?.email}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={savingPassword}>
              {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{userToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Department Confirmation */}
      <AlertDialog open={!!deptToDelete} onOpenChange={() => setDeptToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover departamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deptToDelete?.name}</strong>?
              Todos os setores associados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDepartment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sector Confirmation */}
      <AlertDialog open={!!sectorToDelete} onOpenChange={() => setSectorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover setor?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{sectorToDelete?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSector} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Modal */}
      <Dialog open={createUserModal} onOpenChange={setCreateUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select value={newUserRole} onValueChange={(v: AppRole) => setNewUserRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={newUserDept || "_none"}
                onValueChange={(v) => { setNewUserDept(v === "_none" ? "" : v); setNewUserSector(""); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newUserDept && (
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select
                  value={newUserSector || "_none"}
                  onValueChange={(v) => setNewUserSector(v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum</SelectItem>
                    {sectors
                      .filter(s => s.department_id === newUserDept)
                      .map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserModal(false)} disabled={creatingUser}>
              Cancelar
            </Button>
            <Button onClick={createUser} disabled={creatingUser}>
              {creatingUser ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Sidebar } from "./Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, Search, User, LogOut, Settings, Sun, Moon, Shield, Edit2, Upload, Loader2, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth, type Profile } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  coordenador: "Coordenador",
  analista: "Analista",
  operador: "Operador",
};

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
}

function ProfileDialog({ isOpen, onClose, profile }: ProfileDialogProps) {
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Update local state when profile changes or dialog opens
  if (profile && name === "" && !isEditing) {
    setName(profile.name);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setLoading(true);

    try {
      let avatarUrl = profile.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${profile.user_id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(profile?.name || "");
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) cancelEdit();
      onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Meu Perfil</span>
            {!isEditing && (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite suas informações abaixo."
              : "Informações da sua conta de usuário."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={avatarPreview || profile.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {profile.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
            {isEditing && (
              <p className="text-xs text-muted-foreground">Clieque na foto para alterar</p>
            )}
          </div>

          <div className="grid gap-4">
            {isEditing ? (
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-bold text-muted-foreground">Nome:</Label>
                <span className="col-span-3 font-medium">{profile.name}</span>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Email:</Label>
              <span className="col-span-3 text-sm">{profile.email}</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right font-bold text-muted-foreground">Cargo:</Label>
              <span className="col-span-3">
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-500/10">
                  {roleLabels[profile.role] || profile.role}
                </span>
              </span>
            </div>
          </div>
        </div>

        {isEditing && (
          <DialogFooter>
            <Button variant="outline" onClick={cancelEdit} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { profile, isAdmin, signOut, user } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground font-bold">
                3
              </span>
            </Button>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 h-9 w-9">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile?.name || user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {profile?.name || "Usuário"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {profile?.role
                            ? (roleLabels[profile.role] || profile.role)
                            : user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsProfileOpen(true)}
                      disabled={!profile}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Meu Perfil
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/configuracoes")}>
                        <Settings className="h-4 w-4 mr-2" />
                        Configurações
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      <ProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
      />
    </div>
  );
}

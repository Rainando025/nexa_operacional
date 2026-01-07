import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Megaphone, Plus, Trash2, Edit, Check, X, Globe, Building2, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAppStore } from "@/hooks/useAppStore";

interface MuralPost {
  id: string;
  author_id: string;
  department_id: string | null;
  title: string;
  content: string;
  is_global: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  department_name?: string;
}

interface Department {
  id: string;
  name: string;
}

export default function Mural() {
  const { toast } = useToast();
  const { user, profile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<MuralPost[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createModal, setCreateModal] = useState(false);
  const [editingPost, setEditingPost] = useState<MuralPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<MuralPost | null>(null);

  // Form states
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postDepartment, setPostDepartment] = useState<string>("");
  const [postIsGlobal, setPostIsGlobal] = useState(false);
  const [saving, setSaving] = useState(false);

  const canManagePosts = isAdmin || profile?.role === "gerente";



  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [postsRes, deptsRes] = await Promise.all([
        supabase.from("mural_posts").select("*").order("created_at", { ascending: false }),
        supabase.from("departments").select("*").order("name"),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (deptsRes.error) throw deptsRes.error;

      // Fetch author names
      const postsWithAuthors = await Promise.all(
        (postsRes.data || []).map(async (post) => {
          const { data: authorProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("user_id", post.author_id)
            .maybeSingle();

          const dept = (deptsRes.data || []).find((d) => d.id === post.department_id);

          return {
            ...post,
            author_name: authorProfile?.name || "Usuário",
            department_name: dept?.name,
          };
        })
      );

      setPosts(postsWithAuthors);
      setDepartments(deptsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: (error as Error).message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setPostTitle("");
    setPostContent("");
    setPostDepartment(profile?.department_id || "");
    setPostIsGlobal(isAdmin);
    setEditingPost(null);
    setCreateModal(true);
  };

  const openEditModal = (post: MuralPost) => {
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostDepartment(post.department_id || "");
    setPostIsGlobal(post.is_global);
    setEditingPost(post);
    setCreateModal(true);
  };

  const handleSavePost = async () => {
    if (!postTitle.trim() || !postContent.trim() || !user) return;

    setSaving(true);
    try {
      if (editingPost) {
        const { error } = await supabase
          .from("mural_posts")
          .update({
            title: postTitle.trim(),
            content: postContent.trim(),
            department_id: postIsGlobal ? null : (postDepartment || null),
            is_global: postIsGlobal,
          })
          .eq("id", editingPost.id);

        if (error) throw error;

        toast({
          title: "Publicação atualizada",
          description: "A publicação foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase.from("mural_posts").insert({
          author_id: user.id,
          title: postTitle.trim(),
          content: postContent.trim(),
          department_id: postIsGlobal ? null : (postDepartment || null),
          is_global: postIsGlobal,
        });

        if (error) throw error;

        toast({
          title: "Publicação criada",
          description: "A publicação foi adicionada ao mural.",
        });
      }

      setCreateModal(false);
      fetchData();
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Erro ao salvar publicação",
        description: (error as Error).message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const { error } = await supabase
        .from("mural_posts")
        .delete()
        .eq("id", postToDelete.id);

      if (error) throw error;

      toast({
        title: "Publicação removida",
        description: "A publicação foi removida do mural.",
      });

      setPostToDelete(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Erro ao remover publicação",
        description: (error as Error).message || "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Mural
          </h1>
          <p className="text-muted-foreground mt-1">
            Comunicados e informações importantes
          </p>
        </div>
        {canManagePosts && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" /> Nova Publicação
          </Button>
        )}
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="stat-card text-center py-12">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Nenhuma publicação ainda</p>
          <p className="text-muted-foreground">
            {canManagePosts
              ? "Crie a primeira publicação para o mural."
              : "Aguarde novas publicações dos gestores."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    {post.is_global ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" /> Global
                      </Badge>
                    ) : post.department_name ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {post.department_name}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{post.author_name}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(post.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                {(isAdmin || post.author_id === user?.id) && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setPostToDelete(post)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Editar Publicação" : "Nova Publicação"}
            </DialogTitle>
            <DialogDescription>
              {editingPost
                ? "Atualize as informações da publicação."
                : "Crie uma nova publicação para o mural."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Título da publicação"
              />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo *</Label>
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Escreva o conteúdo da publicação..."
                rows={6}
              />
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div>
                  <Label>Publicação Global</Label>
                  <p className="text-sm text-muted-foreground">
                    Visível para todos os departamentos
                  </p>
                </div>
                <Switch checked={postIsGlobal} onCheckedChange={setPostIsGlobal} />
              </div>
            )}
            {!postIsGlobal && (
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={postDepartment || "_none"}
                  onValueChange={(v) => setPostDepartment(v === "_none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Nenhum (apenas você)</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={saving || !postTitle.trim() || !postContent.trim()}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : editingPost ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {editingPost ? "Salvar" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover publicação?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a publicação "{postToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

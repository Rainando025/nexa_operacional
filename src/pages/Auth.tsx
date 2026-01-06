import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      let message = "Erro ao fazer login";
      if (error.message.includes("Invalid login credentials")) {
        message = "Email ou senha incorretos";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Confirme seu email antes de fazer login";
      }
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bem-vindo!",
        description: "Login realizado com sucesso",
      });
      navigate("/");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        {/* Main Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-950" />

        {/* Animated Orbs */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-8">
          <img
            src="https://raw.githubusercontent.com/Rainando025/nexa-assets/refs/heads/main/nexa_logo2.png"
            alt="NEXA Logo"
            className="h-20 mb-6 mx-auto object-contain"
          />
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Gestão <span className="text-primary">Operacional</span>
          </h1>
          <p className="text-blue-200/60 font-medium italic">
            o elo entre tempo e produtividade🕢
          </p>
        </div>

        <div className="bg-secondary/20 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl">
          <Card className="glass-card border-border/50 shadow-card bg-background/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-primary" />
                Acesso ao Sistema
              </CardTitle>
              <CardDescription>
                Entre com suas credenciais para continuar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="seu@email.com"
                              className="pl-10 bg-secondary/30 border-border/50 focus:border-primary/50"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-10 pr-10 bg-secondary/30 border-border/50 focus:border-primary/50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full font-bold shadow-lg hover:shadow-primary/20 transition-all duration-300" disabled={isLoading}>
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

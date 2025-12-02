import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Upload, Eye, EyeOff, Smartphone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/selecionar");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message || "Erro ao fazer login");
        }
      } else {
        toast.success("Login realizado com sucesso!");
        navigate("/selecionar");
      }
    } catch (err) {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-4 animate-pulse-glow">
            <Heart className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
            Resumo Health
          </h1>
          <p className="text-muted-foreground text-lg">Família de Jesus</p>
        </div>

        <Card className="card-elevated border-0 overflow-hidden">
          <div className="h-1 gradient-primary" />
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-serif text-center">
              Entrar
            </CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 transition-opacity text-lg font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => navigate("/upload")}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload de Bioimpedância
              </Button>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-muted-foreground"
                onClick={() => navigate("/instalar")}
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Instalar no Celular
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

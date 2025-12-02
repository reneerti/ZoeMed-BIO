import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Smartphone, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen gradient-bg p-4 md:p-6">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" className="gap-2 mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-coral to-coral-dark rounded-2xl flex items-center justify-center shadow-lg">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gradient mb-2">
            Instalar App
          </h1>
          <p className="text-muted-foreground">
            Adicione o Resumo Health à tela inicial
          </p>
        </div>

        {isInstalled ? (
          <Card className="card-elevated border-0 animate-slide-up">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <Download className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold mb-2">App Instalado!</h2>
              <p className="text-muted-foreground">
                O Resumo Health já está instalado no seu dispositivo.
              </p>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card className="card-elevated border-0 animate-slide-up">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Como instalar no iPhone/iPad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4 text-coral" />
                </div>
                <div>
                  <p className="font-medium">1. Toque em Compartilhar</p>
                  <p className="text-sm text-muted-foreground">
                    Na barra inferior do Safari, toque no ícone de compartilhar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-coral" />
                </div>
                <div>
                  <p className="font-medium">2. Adicionar à Tela de Início</p>
                  <p className="text-sm text-muted-foreground">
                    Role para baixo e toque em "Adicionar à Tela de Início"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-coral" />
                </div>
                <div>
                  <p className="font-medium">3. Confirmar</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Adicionar" no canto superior direito
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card className="card-elevated border-0 animate-slide-up">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-6">
                Instale o app para acessar rapidamente sem precisar do navegador.
              </p>
              <Button 
                onClick={handleInstall} 
                className="w-full gap-2 bg-coral hover:bg-coral-dark text-white"
                size="lg"
              >
                <Download className="w-5 h-5" />
                Instalar Agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="card-elevated border-0 animate-slide-up">
            <CardHeader>
              <CardTitle className="font-serif text-lg">Como instalar no Android</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">⋮</span>
                </div>
                <div>
                  <p className="font-medium">1. Abra o menu do navegador</p>
                  <p className="text-sm text-muted-foreground">
                    Toque nos três pontos no canto superior direito
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 text-coral" />
                </div>
                <div>
                  <p className="font-medium">2. Instalar app</p>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Instalar app" ou "Adicionar à tela inicial"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-coral" />
                </div>
                <div>
                  <p className="font-medium">3. Pronto!</p>
                  <p className="text-sm text-muted-foreground">
                    O app aparecerá na sua tela inicial
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Funciona offline após a primeira visita</p>
        </div>
      </div>
    </div>
  );
};

export default Install;

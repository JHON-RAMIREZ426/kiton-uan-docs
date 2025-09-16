import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import ClientPortal from "@/components/ClientPortal";
import AdminAccess from "@/components/AdminAccess";
import Features from "@/components/Features";
import { Users, Shield } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("client");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Portal de Órdenes de Compra
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Plataforma integral para la gestión de documentos de compra entre 
            <span className="font-semibold"> KITON GROUP SAS</span> y la 
            <span className="font-semibold"> Universidad Antonio Nariño</span>
          </p>
          
          <div className="flex justify-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
              <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm">
                <TabsTrigger 
                  value="client" 
                  className="data-[state=active]:bg-white data-[state=active]:text-primary"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Cliente UAN
                </TabsTrigger>
                <TabsTrigger 
                  value="admin"
                  className="data-[state=active]:bg-white data-[state=active]:text-secondary"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin KITON
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="client" className="mt-0">
              <ClientPortal />
            </TabsContent>
            
            <TabsContent value="admin" className="mt-0">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
                  Portal Administrativo
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Acceso exclusivo para proveedores KITON GROUP para la gestión de documentos
                </p>
              </div>
              <AdminAccess />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Supabase Integration Notice */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto p-8 bg-card border border-border rounded-lg shadow-elegant">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              🚀 ¡Próximo Paso: Integración con Base de Datos!
            </h3>
            <p className="text-muted-foreground mb-6">
              Para habilitar la funcionalidad completa (autenticación de administradores, almacenamiento de archivos, 
              y gestión de órdenes), necesitas conectar este proyecto con Supabase.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-foreground">
                <strong>¿Cómo conectar Supabase?</strong><br />
                Haz clic en el botón verde "Supabase" en la parte superior derecha de la interfaz de Lovable 
                y sigue las instrucciones para conectar tu base de datos.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Una vez conectado, podremos implementar login seguro, almacenamiento de archivos, 
              y todas las funcionalidades avanzadas del portal.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-90">
            © 2024 Portal de Órdenes de Compra - KITON GROUP SAS & Universidad Antonio Nariño
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Upload } from "lucide-react";
import { toast } from "sonner";

const AdminAccess = () => {
  const handleAdminLogin = () => {
    // This will be handled by Supabase authentication
    toast.info("Funcionalidad de login será habilitada con la integración de Supabase");
  };

  return (
    <Card className="max-w-md mx-auto shadow-elegant">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl">Acceso Administrativo</CardTitle>
        <CardDescription>
          Portal exclusivo para proveedores KITON GROUP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Acceso seguro y protegido</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>Gestión de documentos</span>
          </div>
        </div>
        
        <Button 
          onClick={handleAdminLogin}
          className="w-full" 
          variant="corporate"
          size="lg"
        >
          Iniciar Sesión
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          ¿Necesitas acceso? Contacta al administrador del sistema
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminAccess;
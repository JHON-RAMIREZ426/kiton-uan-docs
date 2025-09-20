import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Key, Mail, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SedeTokenInfo {
  id: string;
  sede: string;
  token: string;
  email: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

const SedeManagement = () => {
  const [tokens, setTokens] = useState<SedeTokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSede, setNewSede] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Available sedes list (hardcoded for now)
  const availableSedes = [
    "Bogotá - Sede Principal",
    "Medellín - Sede Norte",
    "Cali - Sede Sur", 
    "Barranquilla - Sede Caribe",
    "Bucaramanga - Sede Oriental",
    "Pereira - Sede Eje Cafetero"
  ];

  useEffect(() => {
    loadSedeTokens();
  }, []);

  const loadSedeTokens = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('sede_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast.error(`Error al cargar tokens: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createSedeToken = async () => {
    if (!newSede || !newEmail) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_sede_token', {
          p_sede: newSede,
          p_email: newEmail
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.is_new) {
          toast.success(`Nuevo código generado para ${newSede}: ${result.token}`);
        } else {
          toast.info(`Código existente para ${newSede}: ${result.token}`);
        }
      }

      setNewSede("");
      setNewEmail("");
      loadSedeTokens();
    } catch (error: any) {
      toast.error(`Error al crear código: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const generateNewToken = async (sede: string, email: string) => {
    try {
      // First deactivate existing tokens for this sede
      const { error: deactivateError } = await supabase
        .from('sede_tokens')
        .update({ is_active: false })
        .eq('sede', sede);

      if (deactivateError) throw deactivateError;

      // Create new token
      const { data, error } = await supabase
        .rpc('get_or_create_sede_token', {
          p_sede: sede,
          p_email: email
        });

      if (error) throw error;

      if (data && data.length > 0) {
        toast.success(`Nuevo código generado para ${sede}: ${data[0].token}`);
        loadSedeTokens();
      }
    } catch (error: any) {
      toast.error(`Error al generar nuevo código: ${error.message}`);
    }
  };

  const toggleTokenStatus = async (tokenId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sede_tokens')
        .update({ is_active: !currentStatus })
        .eq('id', tokenId);

      if (error) throw error;

      toast.success(`Token ${!currentStatus ? 'activado' : 'desactivado'} correctamente`);
      loadSedeTokens();
    } catch (error: any) {
      toast.error(`Error al actualizar token: ${error.message}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Gestión de Sedes y Tokens
        </h2>
        <p className="text-muted-foreground">
          Administra los códigos de acceso para cada sede
        </p>
      </div>

      {/* Create New Token */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Generar Nuevo Código de Acceso
          </CardTitle>
          <CardDescription>
            Crea un código de acceso para una sede específica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sede-select">Sede</Label>
              <select
                id="sede-select"
                value={newSede}
                onChange={(e) => setNewSede(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">Selecciona una sede</option>
                {availableSedes.map((sede) => (
                  <option key={sede} value={sede}>
                    {sede}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-input">Correo Electrónico</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="sede@uan.edu.co"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={createSedeToken}
            className="w-full"
            variant="corporate"
            disabled={isCreating}
          >
            <Key className="h-4 w-4 mr-2" />
            {isCreating ? "Generando..." : "Generar Código"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Tokens */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" />
              Códigos de Acceso Existentes ({tokens.length})
            </CardTitle>
            <CardDescription>
              Lista de todos los códigos de acceso generados
            </CardDescription>
          </div>
          <Button
            onClick={loadSedeTokens}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando códigos...</p>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay códigos generados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-card transition-smooth"
                >
                  <div className="flex items-center space-x-4">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">{token.sede}</h4>
                        <Badge variant={token.is_active ? "default" : "secondary"}>
                          {token.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {token.email}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          Código: <span className="font-mono font-semibold">{token.token}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Creado: {formatDate(token.created_at)}
                        </span>
                        {token.last_used_at && (
                          <span className="flex items-center gap-1">
                            Último uso: {formatDate(token.last_used_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateNewToken(token.sede, token.email)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={token.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleTokenStatus(token.id, token.is_active)}
                    >
                      {token.is_active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SedeManagement;

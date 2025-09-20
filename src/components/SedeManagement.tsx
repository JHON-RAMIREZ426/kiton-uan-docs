import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Key, Mail, Calendar, RefreshCw, Edit, Phone, MapPin, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Sede {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  is_admin_sede: boolean;
  created_at: string;
  updated_at: string;
}

interface SedeTokenInfo {
  id: string;
  sede: string;
  token: string;
  email: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

interface SedeFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  is_admin_sede: boolean;
}

const SedeManagement = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [tokens, setTokens] = useState<SedeTokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [showSedeDialog, setShowSedeDialog] = useState(false);
  const [sedeForm, setSedeForm] = useState<SedeFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    is_admin_sede: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([loadSedes(), loadSedeTokens()]);
    setIsLoading(false);
  };

  const loadSedes = async () => {
    try {
      const { data, error } = await supabase
        .from('sedes')
        .select('*')
        .order('name');

      if (error) throw error;
      setSedes(data || []);
    } catch (error: any) {
      toast.error(`Error al cargar sedes: ${error.message}`);
    }
  };

  const loadSedeTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('sede_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast.error(`Error al cargar tokens: ${error.message}`);
    }
  };

  const handleSedeSubmit = async () => {
    if (!sedeForm.name || !sedeForm.email) {
      toast.error("Por favor completa los campos obligatorios (nombre y correo)");
      return;
    }

    setIsCreating(true);
    try {
      if (editingSede) {
        // Update existing sede
        const { error } = await supabase
          .from('sedes')
          .update({
            name: sedeForm.name,
            email: sedeForm.email,
            phone: sedeForm.phone || null,
            address: sedeForm.address || null,
            is_admin_sede: sedeForm.is_admin_sede
          })
          .eq('id', editingSede.id);

        if (error) throw error;
        toast.success("Sede actualizada correctamente");
      } else {
        // Create new sede
        const { error } = await supabase
          .from('sedes')
          .insert({
            name: sedeForm.name,
            email: sedeForm.email,
            phone: sedeForm.phone || null,
            address: sedeForm.address || null,
            is_admin_sede: sedeForm.is_admin_sede
          });

        if (error) throw error;
        toast.success("Sede creada correctamente");
      }

      resetSedeForm();
      setShowSedeDialog(false);
      loadSedes();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const resetSedeForm = () => {
    setSedeForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      is_admin_sede: false
    });
    setEditingSede(null);
  };

  const handleEditSede = (sede: Sede) => {
    setSedeForm({
      name: sede.name,
      email: sede.email,
      phone: sede.phone || "",
      address: sede.address || "",
      is_admin_sede: sede.is_admin_sede
    });
    setEditingSede(sede);
    setShowSedeDialog(true);
  };

  const toggleSedeStatus = async (sedeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sedes')
        .update({ is_active: !currentStatus })
        .eq('id', sedeId);

      if (error) throw error;

      toast.success(`Sede ${!currentStatus ? 'activada' : 'desactivada'} correctamente`);
      loadSedes();
    } catch (error: any) {
      toast.error(`Error al actualizar sede: ${error.message}`);
    }
  };

  const createSedeToken = async (sede: Sede) => {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_sede_token', {
          p_sede: sede.name,
          p_email: sede.email
        });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.is_new) {
          toast.success(`Nuevo código generado para ${sede.name}: ${result.token}`);
        } else {
          toast.info(`Código existente para ${sede.name}: ${result.token}`);
        }
      }

      loadSedeTokens();
    } catch (error: any) {
      toast.error(`Error al crear código: ${error.message}`);
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

  const getSedeToken = (sedeName: string) => {
    return tokens.find(token => token.sede === sedeName && token.is_active);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Gestión de Sedes y Tokens
        </h2>
        <p className="text-muted-foreground">
          Administra las sedes y sus códigos de acceso
        </p>
      </div>

      {/* Create/Edit Sede Dialog */}
      <Dialog open={showSedeDialog} onOpenChange={setShowSedeDialog}>
        <DialogTrigger asChild>
          <Button 
            onClick={() => {
              resetSedeForm();
              setShowSedeDialog(true);
            }}
            className="w-full"
            variant="corporate"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Sede
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingSede ? 'Editar Sede' : 'Nueva Sede'}
            </DialogTitle>
            <DialogDescription>
              {editingSede ? 'Modifica los datos de la sede' : 'Ingresa los datos de la nueva sede'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                placeholder="Ej: Bogotá - Sede Principal"
                value={sedeForm.name}
                onChange={(e) => setSedeForm(prev => ({...prev, name: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                placeholder="sede@uan.edu.co"
                value={sedeForm.email}
                onChange={(e) => setSedeForm(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+57 1 234 5678"
                value={sedeForm.phone}
                onChange={(e) => setSedeForm(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Calle 123 # 45-67, Ciudad"
                value={sedeForm.address}
                onChange={(e) => setSedeForm(prev => ({...prev, address: e.target.value}))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_admin_sede"
                checked={sedeForm.is_admin_sede}
                onCheckedChange={(checked) => setSedeForm(prev => ({...prev, is_admin_sede: checked}))}
              />
              <Label htmlFor="is_admin_sede" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sede Administradora
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSedeSubmit}
              disabled={isCreating}
              variant="corporate"
            >
              {isCreating ? "Guardando..." : editingSede ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sedes List */}
      <Card className="shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-secondary" />
              Sedes ({sedes.length})
            </CardTitle>
            <CardDescription>
              Lista de todas las sedes registradas
            </CardDescription>
          </div>
          <Button
            onClick={loadData}
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
              <p className="text-muted-foreground">Cargando sedes...</p>
            </div>
          ) : sedes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay sedes registradas aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sedes.map((sede) => {
                const sedeToken = getSedeToken(sede.name);
                return (
                  <div
                    key={sede.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-card transition-smooth"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{sede.name}</h4>
                          <Badge variant={sede.is_active ? "default" : "secondary"}>
                            {sede.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                          {sede.is_admin_sede && (
                            <Badge variant="outline" className="bg-primary/10">
                              <Shield className="h-3 w-3 mr-1" />
                              Administradora
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {sede.email}
                          </p>
                          {sede.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {sede.phone}
                            </p>
                          )}
                          {sede.address && (
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {sede.address}
                            </p>
                          )}
                          {sedeToken && (
                            <p className="flex items-center gap-1">
                              <Key className="h-3 w-3" />
                              Token: <span className="font-mono font-semibold">{sedeToken.token}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Creada: {formatDate(sede.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createSedeToken(sede)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditSede(sede)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={sede.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleSedeStatus(sede.id, sede.is_active)}
                      >
                        {sede.is_active ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tokens Overview */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Tokens de Acceso Activos ({tokens.filter(t => t.is_active).length})
          </CardTitle>
          <CardDescription>
            Resumen de todos los códigos de acceso generados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.filter(t => t.is_active).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay tokens activos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tokens.filter(t => t.is_active).map((token) => (
                <div
                  key={token.id}
                  className="p-4 border border-border rounded-lg bg-gradient-subtle"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="font-mono font-semibold">{token.token}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{token.sede}</p>
                  <p className="text-xs text-muted-foreground">
                    Creado: {formatDate(token.created_at)}
                  </p>
                  {token.last_used_at && (
                    <p className="text-xs text-muted-foreground">
                      Último uso: {formatDate(token.last_used_at)}
                    </p>
                  )}
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
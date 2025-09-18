import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Mail, Phone, MapPin, Key, Edit, Plus, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Sede {
  sede_id: string;
  sede_name: string;
  sede_email: string;
  sede_address: string;
  sede_phone: string;
  sede_is_active: boolean;
  token: string;
  token_last_used: string;
  can_view: boolean;
  can_edit: boolean;
}

const SedeManagement = () => {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    is_active: true
  });

  useEffect(() => {
    loadSedes();
  }, []);

  const loadSedes = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_sedes_with_tokens');
      
      if (error) throw error;
      setSedes(data || []);
    } catch (error: any) {
      toast.error(`Error al cargar sedes: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSede = async () => {
    try {
      if (editingSede) {
        // Update existing sede
        const { error } = await supabase
          .from('sedes')
          .update({
            name: formData.name,
            email: formData.email,
            address: formData.address,
            phone: formData.phone,
            is_active: formData.is_active
          })
          .eq('id', editingSede.sede_id);

        if (error) throw error;
        toast.success("Sede actualizada exitosamente");
      } else {
        // Create new sede
        const { error } = await supabase
          .from('sedes')
          .insert({
            name: formData.name,
            email: formData.email,
            address: formData.address,
            phone: formData.phone,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success("Sede creada exitosamente");
      }

      setIsDialogOpen(false);
      setEditingSede(null);
      resetForm();
      loadSedes();
    } catch (error: any) {
      toast.error(`Error al guardar sede: ${error.message}`);
    }
  };

  const handleGenerateToken = async (sedeId: string, sedeName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sede-token', {
        body: { sede: sedeName }
      });

      if (error) throw error;
      toast.success("Token generado y enviado por correo");
      loadSedes();
    } catch (error: any) {
      toast.error(`Error al generar token: ${error.message}`);
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedToken(token);
      toast.success("Token copiado al portapapeles");
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (error) {
      toast.error("Error al copiar token");
    }
  };

  const handleEditSede = (sede: Sede) => {
    setEditingSede(sede);
    setFormData({
      name: sede.sede_name,
      email: sede.sede_email,
      address: sede.sede_address || "",
      phone: sede.sede_phone || "",
      is_active: sede.sede_is_active
    });
    setIsDialogOpen(true);
  };

  const handleNewSede = () => {
    setEditingSede(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      address: "",
      phone: "",
      is_active: true
    });
  };

  const toggleSedeAccess = async (sedeId: string, currentAccess: boolean) => {
    try {
      if (currentAccess) {
        // Remove access
        const { error } = await supabase
          .from('admin_sede_access')
          .delete()
          .eq('sede_id', sedeId)
          .eq('admin_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) throw error;
      } else {
        // Grant access
        const { error } = await supabase
          .from('admin_sede_access')
          .insert({
            sede_id: sedeId,
            admin_id: (await supabase.auth.getUser()).data.user?.id,
            can_view: true,
            can_edit: false
          });

        if (error) throw error;
      }

      toast.success(currentAccess ? "Acceso removido" : "Acceso otorgado");
      loadSedes();
    } catch (error: any) {
      toast.error(`Error al cambiar acceso: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cargando sedes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Sedes</h2>
          <p className="text-muted-foreground">Administra las sedes y sus tokens de acceso</p>
        </div>
        <Button onClick={handleNewSede} variant="corporate">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Sede
        </Button>
      </div>

      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sedes Registradas
          </CardTitle>
          <CardDescription>
            Lista de todas las sedes con sus tokens y configuraciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sede</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acceso</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sedes.map((sede) => (
                  <TableRow key={sede.sede_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sede.sede_name}</div>
                        {sede.sede_address && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {sede.sede_address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {sede.sede_email}
                        </div>
                        {sede.sede_phone && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {sede.sede_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sede.token ? (
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {sede.token}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyToken(sede.token)}
                          >
                            {copiedToken === sede.token ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="outline">Sin token</Badge>
                      )}
                      {sede.token_last_used && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Último uso: {new Date(sede.token_last_used).toLocaleDateString()}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sede.sede_is_active ? "default" : "secondary"}>
                        {sede.sede_is_active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSedeAccess(sede.sede_id, sede.can_view)}
                        >
                          {sede.can_view ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSede(sede)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateToken(sede.sede_id, sede.sede_name)}
                        >
                          <Key className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create Sede Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSede ? "Editar Sede" : "Nueva Sede"}
            </DialogTitle>
            <DialogDescription>
              {editingSede ? "Modifica la información de la sede" : "Crea una nueva sede"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Sede</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Bogotá - Sede Principal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@kitongroup.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+57 1 234-5678"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Sede activa</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveSede} variant="corporate">
                {editingSede ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SedeManagement;
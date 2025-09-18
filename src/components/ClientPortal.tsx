import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, FileText, Receipt, ArrowLeft, ShoppingCart, Shield, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ClientPortal = () => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedSede, setSelectedSede] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [tokenValidating, setTokenValidating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Search states
  const [orderNumber, setOrderNumber] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'by-order' | 'by-sede'>('by-order');

  const sedes = [
    "Bogotá - Sede Principal",
    "casa brayan",
    "Medellín - Sede Norte", 
    "Cali - Sede Sur",
    "Barranquilla - Sede Caribe",
    "Bucaramanga - Sede Oriental",
    "Pereira - Sede Eje Cafetero"
  ];

  // Authentication functions
  const handleSendToken = async () => {
    if (!selectedSede) {
      toast.error("Por favor selecciona una sede");
      return;
    }

    setSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-sede-token', {
        body: { sede: selectedSede }
      });

      if (error) throw error;

      toast.success(data.message || "Código enviado correctamente");
    } catch (error: any) {
      toast.error(`Error al enviar código: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleValidateToken = async () => {
    if (!selectedSede || !accessToken) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (accessToken.length !== 6 || !/^\d+$/.test(accessToken)) {
      toast.error("El código debe tener 6 dígitos numéricos");
      return;
    }

    setTokenValidating(true);
    
    try {
      const { data: tokenData, error } = await supabase
        .rpc('validate_sede_token', {
          p_sede: selectedSede,
          p_token: accessToken
        });

      if (error) throw error;

      if (!tokenData || tokenData.length === 0) {
        toast.error("El código ingresado no es válido");
        return;
      }

      setIsAuthenticated(true);
      toast.success(`Acceso autorizado para ${selectedSede}`);
    } catch (error: any) {
      toast.error(`Error al validar código: ${error.message}`);
    } finally {
      setTokenValidating(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedSede("");
    setAccessToken("");
    setOrderNumber("");
    setSearchResults([]);
    setAvailableOrders([]);
    setSelectedOrder(null);
    toast.info("Sesión cerrada");
  };

  // Search functions (same as before)
  const handleSearchByOrder = async () => {
    if (!orderNumber) {
      toast.error("Por favor ingresa un número de orden");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: orders, error: poError } = await supabase
        .rpc('validate_order_access', {
          p_order_number: orderNumber,
          p_sede: selectedSede
        });

      if (poError) {
        toast.error("Error al buscar la orden de compra");
        setSearchResults([]);
        return;
      }

      if (!orders || orders.length === 0) {
        toast.error("No se encontraron documentos para esta orden y sede");
        setSearchResults([]);
        return;
      }

      const purchaseOrder = orders[0];

      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('purchase_order_id', purchaseOrder.id);

      if (docsError) throw docsError;

      if (!documents || documents.length === 0) {
        toast.error("No se encontraron documentos para esta orden");
        setSearchResults([]);
        return;
      }

      const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
      };

      const results = documents.map(doc => ({
        id: doc.id,
        type: doc.file_type === 'orden_compra' ? 'Orden de Compra' : 'Remisión',
        filename: doc.original_filename,
        uploadDate: new Date(doc.created_at).toLocaleDateString(),
        size: formatFileSize(doc.file_size),
        file_path: doc.file_path
      }));

      setSearchResults(results);
      toast.success(`Se encontraron ${results.length} documento(s)`);
    } catch (error: any) {
      toast.error(`Error al buscar documentos: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchBySede = async () => {
    setIsLoading(true);
    
    try {
      const { data: orders, error } = await supabase
        .rpc('get_orders_by_sede', {
          p_sede: selectedSede
        });

      if (error) {
        toast.error("Error al buscar órdenes de compra");
        setAvailableOrders([]);
        return;
      }

      if (!orders || orders.length === 0) {
        toast.error("No se encontraron órdenes de compra para esta sede");
        setAvailableOrders([]);
        return;
      }

      setAvailableOrders(orders);
      toast.success(`Se encontraron ${orders.length} orden(es) de compra`);
    } catch (error: any) {
      toast.error(`Error al buscar órdenes: ${error.message}`);
      setAvailableOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOrder = async (order: any) => {
    setSelectedOrder(order);
    setIsLoading(true);

    try {
      const { data: documents, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('purchase_order_id', order.id);

      if (docsError) throw docsError;

      if (!documents || documents.length === 0) {
        toast.error("No se encontraron documentos para esta orden");
        setSearchResults([]);
        return;
      }

      const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
      };

      const results = documents.map(doc => ({
        id: doc.id,
        type: doc.file_type === 'orden_compra' ? 'Orden de Compra' : 'Remisión',
        filename: doc.original_filename,
        uploadDate: new Date(doc.created_at).toLocaleDateString(),
        size: formatFileSize(doc.file_size),
        file_path: doc.file_path
      }));

      setSearchResults(results);
      toast.success(`Se encontraron ${results.length} documento(s) para la orden ${order.order_number}`);
    } catch (error: any) {
      toast.error(`Error al buscar documentos: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('purchase-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Descargando ${doc.filename}...`);
    } catch (error: any) {
      toast.error(`Error al descargar: ${error.message}`);
    }
  };

  const handlePreview = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('purchase-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
      
      toast.info(`Abriendo vista previa de ${doc.filename}...`);
    } catch (error: any) {
      toast.error(`Error al abrir vista previa: ${error.message}`);
    }
  };

  const resetSearch = () => {
    setOrderNumber("");
    setSearchResults([]);
    setAvailableOrders([]);
    setSelectedOrder(null);
  };

  // Authentication UI
  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Acceso Seguro por Sede
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Selecciona tu sede y solicita tu código de acceso para consultar las órdenes de compra
          </p>
        </div>

        <Card className="max-w-md mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Selección de Sede
            </CardTitle>
            <CardDescription>
              Paso 1: Selecciona tu sede de la Universidad Antonio Nariño
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Sede
              </label>
              <Select value={selectedSede} onValueChange={setSelectedSede}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map((sede) => (
                    <SelectItem key={sede} value={sede}>
                      {sede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedSede && (
          <Card className="max-w-md mx-auto shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Código de Acceso
              </CardTitle>
              <CardDescription>
                Paso 2: Solicita y luego ingresa tu código de 6 dígitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSendToken}
                className="w-full"
                variant="outline"
                disabled={sendingEmail}
              >
                {sendingEmail ? "Enviando..." : "Enviar código al correo registrado"}
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Código de Acceso
                </label>
                <Input
                  placeholder="123456"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Ingresa el código de 6 dígitos que recibiste por correo
                </p>
              </div>

              <Button
                onClick={handleValidateToken}
                className="w-full"
                variant="hero"
                disabled={tokenValidating || accessToken.length !== 6}
              >
                {tokenValidating ? "Validando..." : "Acceder al Portal"}
              </Button>

              {accessToken && accessToken.length !== 6 && (
                <p className="text-sm text-destructive text-center">
                  El código debe tener exactamente 6 dígitos
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Authenticated Portal UI (same as before but with logout button)
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Conectado como:</p>
              <p className="font-semibold text-foreground">{selectedSede}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Cerrar Sesión
          </Button>
        </div>
        
        <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Consulta de Órdenes de Compra
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Busca por número de orden específico o explora todas las órdenes disponibles
        </p>
      </div>

      {/* Search Mode Selector */}
      <Card className="max-w-2xl mx-auto shadow-elegant">
        <CardContent className="pt-6">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={searchMode === 'by-order' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => {
                setSearchMode('by-order');
                resetSearch();
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar por Orden
            </Button>
            <Button
              variant={searchMode === 'by-sede' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => {
                setSearchMode('by-sede');
                resetSearch();
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Explorar por Sede
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search by Order Number */}
      {searchMode === 'by-order' && (
        <Card className="max-w-2xl mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar por Número de Orden
            </CardTitle>
            <CardDescription>
              Ingresa el número de orden para encontrar documentos específicos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Número de Orden de Compra
              </label>
              <Input
                placeholder="Ej: OC-2024-001234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleSearchByOrder} 
              className="w-full" 
              variant="hero"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Buscando..." : "Buscar Documentos"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search by Sede */}
      {searchMode === 'by-sede' && !selectedOrder && (
        <Card className="max-w-2xl mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Explorar Órdenes de la Sede
            </CardTitle>
            <CardDescription>
              Ver todas las órdenes de compra disponibles para {selectedSede}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={handleSearchBySede} 
              className="w-full" 
              variant="hero"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Buscando..." : "Buscar Órdenes"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Orders List */}
      {searchMode === 'by-sede' && availableOrders.length > 0 && !selectedOrder && (
        <Card className="max-w-4xl mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-secondary" />
              Órdenes de Compra Disponibles
            </CardTitle>
            <CardDescription>
              Se encontraron {availableOrders.length} orden(es) para {selectedSede}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {availableOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-card transition-smooth cursor-pointer"
                  onClick={() => handleSelectOrder(order)}
                >
                  <div className="flex items-center space-x-4">
                    <Receipt className="h-8 w-8 text-primary" />
                    <div>
                      <h4 className="font-medium text-foreground">{order.order_number}</h4>
                      <p className="text-sm text-muted-foreground">{order.sede}</p>
                      <p className="text-xs text-muted-foreground">
                        Creada: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Documentos
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Back button when viewing selected order */}
      {selectedOrder && (
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedOrder(null);
              setSearchResults([]);
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista de órdenes
          </Button>
        </div>
      )}

      {/* Documents Results */}
      {searchResults.length > 0 && (
        <Card className="max-w-4xl mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Documentos Encontrados
            </CardTitle>
            <CardDescription>
              {selectedOrder 
                ? `Documentos para la orden ${selectedOrder.order_number}`
                : `Se encontraron ${searchResults.length} documento(s) para la orden ${orderNumber}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-card transition-smooth"
                >
                  <div className="flex items-center space-x-4">
                    {doc.type === "Orden de Compra" ? (
                      <Receipt className="h-8 w-8 text-primary" />
                    ) : (
                      <FileText className="h-8 w-8 text-secondary" />
                    )}
                    <div>
                      <h4 className="font-medium text-foreground">{doc.type}</h4>
                      <p className="text-sm text-muted-foreground">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        Subido: {doc.uploadDate} • Tamaño: {doc.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(doc)}
                    >
                      <Eye className="h-4 w-4" />
                      Vista Previa
                    </Button>
                    <Button
                      variant="corporate"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientPortal;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, LogOut, Plus, Download, Trash2, Building2, Settings } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SedeManagement from "@/components/SedeManagement";

interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  purchase_order: {
    order_number: string;
    sede: string;
  };
}

const AdminDashboard = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [selectedSede, setSelectedSede] = useState("");
  const [fileType, setFileType] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [activeTab, setActiveTab] = useState("upload");
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const sedes = [
    "Bogotá - Sede Principal",
    "Medellín - Sede Norte", 
    "Cali - Sede Sur",
    "Barranquilla - Sede Caribe",
    "Bucaramanga - Sede Oriental",
    "Pereira - Sede Eje Cafetero"
  ];

  const fileTypes = [
    { value: "orden_compra", label: "Orden de Compra" },
    { value: "remision", label: "Remisión" }
  ];

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadDocuments();
  }, [user, navigate]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          purchase_order:purchase_orders(order_number, sede)
        `)
        .eq('uploaded_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      toast.error("Error al cargar documentos");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber || !selectedSede || !fileType || !files || files.length === 0) {
      toast.error("Por favor completa todos los campos y selecciona archivos");
      return;
    }

    setIsUploading(true);

    try {
      // Create or get purchase order
      let { data: purchaseOrder, error: poError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('order_number', orderNumber)
        .eq('sede', selectedSede)
        .single();

      if (poError && poError.code !== 'PGRST116') {
        throw poError;
      }

      if (!purchaseOrder) {
        const { data: newPO, error: createError } = await supabase
          .from('purchase_orders')
          .insert({
            order_number: orderNumber,
            sede: selectedSede,
            created_by: user?.id
          })
          .select('id')
          .single();

        if (createError) throw createError;
        purchaseOrder = newPO;
      }

      // Upload files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('purchase-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save document record
        const { error: docError } = await supabase
          .from('documents')
          .insert({
            purchase_order_id: purchaseOrder.id,
            filename: fileName,
            original_filename: file.name,
            file_path: filePath,
            file_type: fileType,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: user?.id
          });

        if (docError) throw docError;
      }

      toast.success(`${files.length} archivo(s) subido(s) exitosamente`);
      setOrderNumber("");
      setSelectedSede("");
      setFileType("");
      setFiles(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      loadDocuments();
    } catch (error: any) {
      toast.error(`Error al subir archivos: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('purchase-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast.error(`Error al descargar: ${error.message}`);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('purchase-documents')
        .remove([doc.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast.success("Documento eliminado exitosamente");
      loadDocuments();
    } catch (error: any) {
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-foreground">Panel Administrativo KITON</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir Documentos
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mis Documentos
            </TabsTrigger>
            <TabsTrigger value="sedes" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Gestión de Sedes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            {/* Upload Section */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Subir Documentos
                </CardTitle>
                <CardDescription>
                  Cargar archivos de órdenes de compra y remisiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="order-number">Número de Orden de Compra</Label>
                      <Input
                        id="order-number"
                        placeholder="Ej: OC-2024-001234"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sede">Sede</Label>
                      <Select value={selectedSede} onValueChange={setSelectedSede} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sede" />
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-type">Tipo de Documento</Label>
                    <Select value={fileType} onValueChange={setFileType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de archivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {fileTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Archivos</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setFiles(e.target.files)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Formatos permitidos: PDF, DOC, DOCX, JPG, PNG. Máximo 10MB por archivo.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    variant="corporate"
                    size="lg"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Subiendo..." : "Subir Documentos"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            {/* Documents List */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Documentos Subidos ({documents.length})
                </CardTitle>
                <CardDescription>
                  Gestiona los documentos que has subido
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingDocs ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Cargando documentos...</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No has subido documentos aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg bg-gradient-subtle hover:shadow-card transition-smooth"
                      >
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h4 className="font-medium text-foreground">
                              {fileTypes.find(t => t.value === doc.file_type)?.label || doc.file_type}
                            </h4>
                            <p className="text-sm text-muted-foreground">{doc.original_filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.purchase_order.order_number} • {doc.purchase_order.sede}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sedes" className="mt-6">
            <SedeManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
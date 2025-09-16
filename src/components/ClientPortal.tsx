import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, FileText, Receipt } from "lucide-react";
import { toast } from "sonner";

const ClientPortal = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [selectedSede, setSelectedSede] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sedes = [
    "Bogotá - Sede Principal",
    "Medellín - Sede Norte",
    "Cali - Sede Sur",
    "Barranquilla - Sede Caribe",
    "Bucaramanga - Sede Oriental",
    "Pereira - Sede Eje Cafetero"
  ];

  const handleSearch = async () => {
    if (!orderNumber || !selectedSede) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - Replace with actual Supabase integration
    setTimeout(() => {
      // Mock data - Replace with real data from Supabase
      const mockResults = [
        {
          id: 1,
          type: "Orden de Compra",
          filename: `OC_${orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`,
          uploadDate: "2024-01-15",
          size: "2.3 MB"
        },
        {
          id: 2,
          type: "Remisión",
          filename: `REM_${orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`,
          uploadDate: "2024-01-16", 
          size: "1.8 MB"
        }
      ];
      
      setSearchResults(mockResults);
      setIsLoading(false);
      toast.success("Documentos encontrados");
    }, 1500);
  };

  const handleDownload = (filename: string) => {
    // Simulate download - Replace with actual file serving from Supabase
    toast.success(`Descargando ${filename}...`);
  };

  const handlePreview = (filename: string) => {
    // Simulate preview - Replace with actual file preview
    toast.info(`Abriendo vista previa de ${filename}...`);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          Consulta de Órdenes de Compra
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Ingresa el número de orden y la sede para acceder a tus documentos de compra y remisiones
        </p>
      </div>

      <Card className="max-w-2xl mx-auto shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Buscar Documentos
          </CardTitle>
          <CardDescription>
            Completa la información para encontrar tus documentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Sede de Compra
              </label>
              <Select value={selectedSede} onValueChange={setSelectedSede}>
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

          <Button 
            onClick={handleSearch} 
            className="w-full" 
            variant="hero"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? "Buscando..." : "Buscar Documentos"}
          </Button>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card className="max-w-4xl mx-auto shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Documentos Encontrados
            </CardTitle>
            <CardDescription>
              Se encontraron {searchResults.length} documento(s) para la orden {orderNumber}
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
                      onClick={() => handlePreview(doc.filename)}
                    >
                      <Eye className="h-4 w-4" />
                      Vista Previa
                    </Button>
                    <Button
                      variant="corporate"
                      size="sm"
                      onClick={() => handleDownload(doc.filename)}
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
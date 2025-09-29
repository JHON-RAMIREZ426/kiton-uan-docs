import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

import { 
  FileSearch, 
  Download, 
  Shield, 
  Clock, 
  CircleCheck as CheckCircle, 
  Users, 
  FileText, 
  Search 
} from "lucide-react";

const Features = () => {
  const clientFeatures = [
    {
      icon: FileSearch,
      title: "Búsqueda Rápida",
      description: "Encuentra tus documentos ingresando el número de orden y sede"
    },
    {
      icon: Download,
      title: "Descarga Instantánea",
      description: "Accede a órdenes de compra y remisiones al instante"
    },
    {
      icon: Clock,
      title: "Disponible 24/7",
      description: "Consulta tus documentos cuando los necesites"
    },
    {
      icon: Shield,
      title: "Acceso Seguro por Código",
      description: "Sistema de autenticación por código único para cada sede"
    },
    {
      icon: CheckCircle,
      title: "Documentos Verificados",
      description: "Todos los documentos están validados y organizados por orden"
    },
    {
      icon: Users,
      title: "Soporte Multisede",
      description: "Accede a documentos de cualquier sede de la Universidad Antonio Nariño"
    }
  ];

  const benefitFeatures = [
    {
      icon: FileText,
      title: "Múltiples Formatos",
      description: "Visualiza y descarga documentos en PDF, Word e imágenes"
    },
    {
      icon: Search,
      title: "Historial Completo",
      description: "Accede al historial completo de órdenes de tu sede"
    },
    {
      icon: Download,
      title: "Sin Límites de Descarga",
      description: "Descarga tus documentos las veces que necesites"
    }
  ];

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            ¿Por qué usar nuestro Portal?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Accede de forma rápida y segura a todos tus documentos de órdenes de compra.
            Diseñado especialmente para las necesidades de la Universidad Antonio Nariño.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Client Features */}
          <div>
            <h3 className="text-2xl font-semibold text-primary mb-6 text-center">
              Funcionalidades Principales
            </h3>
            <div className="space-y-4">
              {clientFeatures.map((feature, index) => (
                <Card key={index} className="shadow-card hover:shadow-elegant transition-smooth">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Benefit Features */}
          <div>
            <h3 className="text-2xl font-semibold text-secondary mb-6 text-center">
              Beneficios Adicionales
            </h3>
            <div className="space-y-4">
              {benefitFeatures.map((feature, index) => (
                <Card key={index} className="shadow-card hover:shadow-elegant transition-smooth">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-secondary" />
                      </div>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-4xl mx-auto shadow-elegant bg-gradient-primary text-white">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Acceso Fácil y Seguro a tus Documentos
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Solo necesitas el número de orden y el código de acceso de tu sede para consultar 
                todos los documentos relacionados con tus compras.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold">1</span>
                  </div>
                  <p className="font-medium">Selecciona tu sede</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold">2</span>
                  </div>
                  <p className="font-medium">Ingresa tu código</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold">3</span>
                  </div>
                  <p className="font-medium">Consulta tus documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;
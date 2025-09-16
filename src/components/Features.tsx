import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSearch, Download, Shield, Clock, CheckCircle, Users } from "lucide-react";

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
    }
  ];

  const providerFeatures = [
    {
      icon: Shield,
      title: "Acceso Seguro",
      description: "Portal administrativo protegido con autenticación"
    },
    {
      icon: CheckCircle,
      title: "Gestión Completa",
      description: "Carga y organiza documentos por sede y número de orden"
    },
    {
      icon: Users,
      title: "Multi-Sede",
      description: "Administra documentos de todas las sedes UAN"
    }
  ];

  return (
    <section className="py-16 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Características del Portal
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Una plataforma integral para la gestión eficiente de órdenes de compra entre
            KITON GROUP SAS y Universidad Antonio Nariño
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Client Features */}
          <div>
            <h3 className="text-xl font-semibold text-primary mb-6 text-center">
              Para Clientes UAN
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

          {/* Provider Features */}
          <div>
            <h3 className="text-xl font-semibold text-secondary mb-6 text-center">
              Para Proveedores KITON
            </h3>
            <div className="space-y-4">
              {providerFeatures.map((feature, index) => (
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
      </div>
    </section>
  );
};

export default Features;
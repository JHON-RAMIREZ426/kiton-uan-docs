import logoUAN from "@/assets/logo-uan.png";
import logoKiton from "@/assets/logo-kiton.webp";

const Header = () => {
  return (
    <header className="bg-gradient-subtle border-b border-border/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <img 
              src={logoKiton} 
              alt="KITON GROUP SAS" 
              className="h-12 w-auto object-contain"
            />
            <div className="hidden md:block text-sm text-muted-foreground">
              Portal de Órdenes de Compra
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <img 
              src={logoUAN} 
              alt="Universidad Antonio Nariño" 
              className="h-14 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
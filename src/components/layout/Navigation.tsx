import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { VoxCardLogo } from "@/components/shared/VoxCardLogo";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
} from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";
import "@burnt-labs/ui/dist/index.css";
import { shortenAddress } from "@/services/utils";

export const Navigation = () => {
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Abstraxion hooks for wallet connection
  const { data: account } = useAbstraxionAccount();
  const { logout } = useAbstraxionSigningClient();
  const [, setShowModal] = useModal();

  useEffect(() => {
    if (!showDisconnect) return;
    function handleClick(event: MouseEvent) {
      if (
        disconnectMenuRef.current &&
        !disconnectMenuRef.current.contains(event.target as Node)
      ) {
        setShowDisconnect(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDisconnect]);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <VoxCardLogo variant="full" size="md" linkTo="/" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/dashboard" className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans">
              Dashboard
            </Link>
            <Link to="/plans" className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans">
              Savings Plans
            </Link>
            <Link to="/community" className="text-vox-secondary whitespace-nowrap hover:text-vox-primary transition-colors font-sans">
              Community
            </Link>
            <Link to="/about" className="text-vox-secondary hover:text-vox-primary whitespace-nowrap transition-colors font-sans">
              About
            </Link>
            <Button 
				fullWidth 
				onClick={() => setShowModal(true)} 
				structure="base"
				className="gradient-bg text-white"
			>
				{account?.bech32Address ? shortenAddress(account?.bech32Address) : "CONNECT"}
			</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button structure="base">
                  <Menu className="h-6 w-6 text-vox-secondary" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <VoxCardLogo variant="full" size="md" linkTo="/" />
                  </div>

                  <nav className="space-y-4">
                    <Link
                      to="/dashboard"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/plans"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Savings Plans
                    </Link>
                    <Link
                      to="/community"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      Community
                    </Link>
                    <Link
                      to="/about"
                      className="block text-vox-secondary hover:text-vox-primary transition-colors font-sans"
                    >
                      About
                    </Link>
                  </nav>

                  {/* Wallet connect button for mobile */}
                  <div className="mt-8">
					<Button 
						fullWidth 
						onClick={() => setShowModal(true)} 
						structure="base"
						className="gradient-bg text-white"
					>
						{account?.bech32Address ? shortenAddress(account?.bech32Address) : "CONNECT"}
					</Button>	
				</div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
	  <Abstraxion onClose={() => setShowModal(false)} />
    </nav>
  );
};

export default Navigation;

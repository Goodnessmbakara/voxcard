import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { useCardano, ConnectWalletList, ConnectWalletButton } from "@cardano-foundation/cardano-connect-with-wallet";
import { toast } from "sonner";
import { Toast } from "@radix-ui/react-toast";
import { useState, useRef, useEffect } from "react";
import { shortenAddress } from "@/services/utils";
import { VoxCardLogo } from "@/components/shared/VoxCardLogo";

export const Navigation = () => {
  const {
    isEnabled,
    isConnected,
    enabledWallet,
    stakeAddress,
    signMessage,
    connect,
    disconnect,
    accountBalance,
    cip45Address, usedAddresses, unusedAddresses,
  } = useCardano();
  
  const [showDisconnect, setShowDisconnect] = useState(false);
  const disconnectMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();


//   console.log(usedAddresses, unusedAddresses); debugging addresses

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

  const onSign = () => {
    // Handle message signing
  };


  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-sm bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <VoxCardLogo variant="full" size="md" linkTo="/" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/dashboard" className="text-vox-secondary hover:text-vox-primary transition-colors font-sans">
              Dashboard
            </Link>
            <Link to="/plans" className="text-vox-secondary hover:text-vox-primary transition-colors font-sans">
              Savings Plans
            </Link>
            <Link to="/community" className="text-vox-secondary hover:text-vox-primary transition-colors font-sans">
              Community
            </Link>
            <Link to="/about" className="text-vox-secondary hover:text-vox-primary transition-colors font-sans">
              About
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:block">
            {!isConnected ? (
              <ConnectWalletButton
                message="Please sign Augusta Ada King, Countess of Lovelace"
                onSignMessage={onSign}
                onConnect={() => {
                  toast.success("Wallet connect successful");
                  navigate("/dashboard");
                }}
            //   className here doesn't need it
              />
            ) : (
              <div className="relative" ref={disconnectMenuRef}>
                <Button
                  onClick={() => setShowDisconnect((prev) => !prev)}
                  variant="outline"
                  className="border-vox-primary text-vox-primary hover:bg-vox-primary/10 transition-all font-sans"
                >
                  <span>{accountBalance} ADA</span>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
                  {/* {stakeAddress?.slice(0, 6)}...{stakeAddress?.slice(-4)} stake address cannot receive payment of ADA */}
				  {stakeAddress ? (
					<span className="ml-2">
					  {usedAddresses.length > 0 ? shortenAddress(usedAddresses[0]) : shortenAddress(unusedAddresses[0])}
					</span>
				  ) : (
					<span className="ml-2">No Address</span>
				  )}
                </Button>

                {showDisconnect && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                    <button
                      onClick={disconnect}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-sans"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-vox-secondary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
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

                  <div className="mt-auto py-6">
                    {!isConnected ? (
                      <ConnectWalletButton
                        message="Please sign Augusta Ada King, Countess of Lovelace"
                        onSignMessage={onSign}
                        onConnect={() => {
                          toast.success("Wallet connect successful");
                          navigate("/dashboard");
                        }}
                        // className="w-full gradient-bg text-white hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full border-vox-primary text-vox-primary hover:bg-vox-primary/10 font-sans"
                        >
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
                          {/* {stakeAddress?.slice(0, 6)}...{stakeAddress?.slice(-4)} */}
						  {stakeAddress ? (
								<span className="ml-2">
								{usedAddresses.length > 0 ? shortenAddress(usedAddresses[0]) : shortenAddress(unusedAddresses[0])}
								</span>
							) : (
								<span className="ml-2">No Address</span>
							)}
                        </Button>
                        <Button
                          onClick={disconnect}
                          variant="ghost"
                          className="w-full text-red-600 font-sans"
                        >
                          Disconnect Wallet
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

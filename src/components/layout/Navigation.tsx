import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Wallet } from "lucide-react";
import { useCardano, ConnectWalletList, ConnectWalletButton } from "@cardano-foundation/cardano-connect-with-wallet";
import { toast } from "sonner";
import { Toast } from "@radix-ui/react-toast";

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
    cip45Address



  } = useCardano();

  // const onConnect = () => alert("Successfully connected!");

  console.log(
    "fkjasdhfahsl",
    isEnabled,
    isConnected,
    stakeAddress,
    stakeAddress,
    cip45Address.current

  );

  const onSign = () => {

  }

  return (
    <nav className="border-b border-gray-100 py-4">
      <div className="container flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-gradient-to-r from-ajo-primary to-ajo-secondary flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="ml-2 font-bold text-xl">VoxCard</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            to="/dashboard"
            className="text-gray-600 hover:text-ajo-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/plans"
            className="text-gray-600 hover:text-ajo-primary transition-colors"
          >
            Browse Plans
          </Link>
          <Link
            to="/create-plan"
            className="text-gray-600 hover:text-ajo-primary transition-colors"
          >
            Create Plan
          </Link>

          {!isConnected ? (
            // <Button
            //   onClick={() =>
            //     connect("yoroi", () => toast.success("Wallet connect successful"))
            //   }
            //   className="btn-primary flex items-center"
            // >
            //   <Wallet size={16} className="mr-2" />
            //   Connect Wallet
            // </Button>

            <ConnectWalletButton
              message="Please sign Augusta Ada King, Countess of Lovelace"
              onSignMessage={onSign}
              onConnect={() => toast.success("Wallet connect successful")}
            />
          ) : (
            <div className="relative group">
              <Button
                variant="outline"
                className="border-ajo-primary text-ajo-primary hover:bg-ajo-primary hover:text-white transition-all"
              >

                <span>{accountBalance} ADA</span>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
                {stakeAddress?.slice(0, 6)}...{stakeAddress?.slice(-4)}
              </Button>

              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md hidden group-hover:block z-10">
                <div className="py-2 px-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500">Connected Address</p>
                  <p className="text-sm font-medium truncate">
                    {stakeAddress}
                  </p>
                </div>
                <button
                  onClick={disconnect}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between py-4 border-b">
                  <div className="font-bold text-xl">Menu</div>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <X size={24} />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </SheetTrigger>
                </div>
                <div className="flex flex-col space-y-4 py-6">
                  <Link to="/dashboard" className="text-lg font-medium">
                    Dashboard
                  </Link>
                  <Link to="/plans" className="text-lg font-medium">
                    Browse Plans
                  </Link>
                  <Link to="/create-plan" className="text-lg font-medium">
                    Create Plan
                  </Link>
                </div>
                <div className="mt-auto py-6">
                  {!isConnected ? (
                    // <Button
                    //   onClick={() =>
                    //     connect("yoroi", () => toast.success("Wallet connect successful"))
                    //   }
                    //   className="w-full btn-primary"
                    // >
                    //   <Wallet size={16} className="mr-2" />
                    //   Connect Wallet
                    // </Button>

                    <ConnectWalletButton
                      message="Please sign Augusta Ada King, Countess of Lovelace"
                      onSignMessage={onSign}
                      onConnect={() => toast.success("Wallet connect successful")}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full border-ajo-primary text-ajo-primary"
                      >
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2"></span>
                        {stakeAddress?.slice(0, 6)}...
                        {stakeAddress?.slice(-4)}
                      </Button>
                      <Button
                        onClick={disconnect}
                        variant="ghost"
                        className="w-full text-red-600"
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
    </nav>
  );
};

export default Navigation;

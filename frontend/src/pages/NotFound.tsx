
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <div className="container py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-[#5ba88e] flex items-center justify-center">
            <span className="text-4xl font-bold text-[#9bf8d9]">404</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Page not found</h1>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-[#5ba88e] text-[#5ba88e] hover:bg-[#5ba88e]/10"
            >
              Go Back
            </Button>
            <Link to="/">
              <Button className="w-full sm:w-auto bg-[#5ba88e] hover:bg-[#10B981] text-white">
                Return Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;

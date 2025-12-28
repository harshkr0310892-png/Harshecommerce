import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DeliveryBoy {
  id: string;
  username: string;
  is_active: boolean;
  is_banned: boolean;
}

export default function AutoLoginDeliveryBoy() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loginStatus, setLoginStatus] = useState<string>("Logging in...");

  useEffect(() => {
    const autoLogin = async () => {
      try {
        // Get the delivery boy ID from URL parameters
        const deliveryBoyId = searchParams.get("id");
        
        if (!deliveryBoyId) {
          setLoginStatus("Invalid login link");
          toast.error("Invalid login link");
          setTimeout(() => navigate("/delivery-boy/login"), 2000);
          return;
        }

        // Fetch delivery boy from database using the ID
        const { data, error } = await supabase
          .from('delivery_boys' as any)
          .select('id, username, is_active, is_banned')
          .eq('id', deliveryBoyId)
          .single();

        if (error || !data) {
          setLoginStatus("Delivery boy not found");
          toast.error("Delivery boy not found");
          setTimeout(() => navigate("/delivery-boy/login"), 2000);
          return;
        }

        const deliveryBoy = data as any as DeliveryBoy;

        // Check if the account is active
        if (!deliveryBoy.is_active) {
          setLoginStatus("Account is inactive");
          toast.error("Account is inactive. Please contact admin.");
          setTimeout(() => navigate("/delivery-boy/login"), 2000);
          return;
        }

        // Check if the account is banned
        if (deliveryBoy.is_banned) {
          setLoginStatus("Account is banned");
          toast.error("Account is banned. Please contact admin.");
          setTimeout(() => navigate("/delivery-boy/login"), 2000);
          return;
        }

        // Store delivery boy session in sessionStorage
        sessionStorage.setItem('delivery_boy_logged_in', 'true');
        sessionStorage.setItem('delivery_boy_id', deliveryBoy.id);
        sessionStorage.setItem('delivery_boy_username', deliveryBoy.username);

        setLoginStatus("Login successful!");
        toast.success("Auto-login successful!");
        
        // Redirect to delivery boy dashboard
        setTimeout(() => navigate('/delivery-boy'), 1000);
      } catch (err) {
        console.error("Auto-login error:", err);
        setLoginStatus("Login failed");
        toast.error("An error occurred during auto-login");
        setTimeout(() => navigate("/delivery-boy/login"), 2000);
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Auto Login</CardTitle>
          <CardDescription>
            Automatically logging you in to your delivery dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{loginStatus}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">{loginStatus}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
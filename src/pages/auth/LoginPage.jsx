import { useState } from "react";
import { Award, Shield, ChevronRight } from "lucide-react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import authService from "@/services/authService";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useSearchParams } from "react-router-dom";

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: "hsl(var(--secondary))" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "hsl(var(--primary))" }} />
    </div>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const handleLogin = () => {
    setLoading(true);
    authService.loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <BackgroundOrbs />

      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="glass-card p-8">
          {/* Logo & Brand */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-glow" style={{ background: "hsl(var(--primary))" }}>
              <Award className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mt-3">CertifyPro</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Certificate Management System</p>
          </div>

          <Separator className="my-6" />

          {/* Welcome */}
          <div className="flex flex-col items-center text-center">
            <h2 className="text-base font-semibold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in with your Google account to continue</p>
          </div>

          <Separator className="my-6" />

          {/* Error */}
          {error === "unauthorized" && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-4">
              <Shield className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">Your account is not authorized. Contact your administrator.</p>
            </div>
          )}

          {/* Google Button */}
          <Button onClick={handleLogin} disabled={loading} variant="outline" className="w-full h-11 gap-3 text-sm font-medium">
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <Icon icon="flat-color-icons:google" className="w-5 h-5" />
                Continue with Google
                <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">Only authorized accounts can access this system.</p>
      </div>
    </div>
  );
}

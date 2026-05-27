import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/services/auth";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { ensurePublicAuthRedirect } from "@/lib/supabase/auth-route";
import { resolvePostAuthDestination, shouldShowSuspendedNotice } from "@/lib/auth/navigation";
import { useAuth } from "@/contexts/auth-provider";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    return ensurePublicAuthRedirect(context, "login");
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      const auth = await refreshAuth();
      await router.invalidate();
      const dest = resolvePostAuthDestination(auth);
      if (shouldShowSuspendedNotice(auth)) {
        toast.info("Sua conta aguarda ativação pelo administrador.");
      } else {
        toast.success("Login realizado com sucesso!");
      }
      navigate({ to: dest.to as "/dashboard" | "/signup" | "/tenants" });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Vote className="h-6 w-6" />
          </div>
          <CardTitle>Strategos CRM</CardTitle>
          <CardDescription>Entre na sua conta de campanha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Criar campanha
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

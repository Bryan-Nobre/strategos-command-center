import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/services/auth";
import { loadAuthContext } from "@/lib/supabase/session";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { ensurePublicAuthRedirect } from "@/lib/supabase/auth-route";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ context }) => {
    return ensurePublicAuthRedirect(context, "login");
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      await router.invalidate();
      const auth = await loadAuthContext();
      if (auth.profile?.platform_role === "super_admin") {
        toast.success("Login realizado com sucesso!");
        navigate({ to: "/admin/tenants" });
        return;
      }
      if (!auth.activeTenant) {
        toast.info("Conclua o cadastro da sua campanha.");
        navigate({ to: "/signup" });
        return;
      }
      if (auth.activeTenant.status !== "active") {
        toast.info("Sua conta aguarda ativação pelo administrador.");
        navigate({ to: "/dashboard" });
        return;
      }
      toast.success("Login realizado com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
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
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Criar campanha</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

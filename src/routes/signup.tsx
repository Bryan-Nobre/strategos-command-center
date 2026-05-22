import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completePoliticianOnboarding, signUpPolitician } from "@/services/auth";
import { SignupPendingEmailError } from "@/lib/supabase/errors";
import { z } from "zod";
import { signupFormSchema } from "@/types/domain";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { setStoredTenantId, loadAuthContext } from "@/lib/supabase/session";
import { ensurePublicAuthRedirect } from "@/lib/supabase/auth-route";
import { toast } from "sonner";

type SignupForm = z.infer<typeof signupFormSchema>;

export const Route = createFileRoute("/signup")({
  beforeLoad: async ({ context }) => {
    return ensurePublicAuthRedirect(context, "signup");
  },
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupForm>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { headline: "Juntos por uma cidade melhor" },
  });

  async function onSubmit(values: SignupForm) {
    try {
      const auth = await loadAuthContext();
      const { tenantId } =
        auth.session && auth.user && !auth.activeTenant
          ? await completePoliticianOnboarding({
              tenantName: values.tenantName,
              slug: values.slug,
              headline: values.headline,
            })
          : await signUpPolitician({
              email: values.email,
              password: values.password,
              fullName: values.fullName,
              tenantName: values.tenantName,
              slug: values.slug,
              headline: values.headline,
            });
      setStoredTenantId(tenantId);
      toast.success(
        "Campanha registrada! Após o pagamento, o administrador ativará seu acesso.",
      );
      await router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = getAuthErrorMessage(err);
      toast.error(message, { duration: err instanceof SignupPendingEmailError ? 8000 : 5000 });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-lg shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Vote className="h-6 w-6" />
          </div>
          <CardTitle>Criar sua campanha</CardTitle>
          <CardDescription>Cadastre-se e configure seu workspace político</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome completo</Label>
              <Input {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>E-mail</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Senha</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Nome da campanha</Label>
              <Input {...register("tenantName")} placeholder="João Silva 2026" />
              {errors.tenantName && <p className="text-xs text-destructive">{errors.tenantName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slug da landing (/p/...)</Label>
              <Input {...register("slug")} placeholder="joao-silva" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Slogan</Label>
              <Input {...register("headline")} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar conta"}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

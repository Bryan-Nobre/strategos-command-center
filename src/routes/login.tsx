import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { signInWithPassword } from "@/services/auth";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { ensurePublicAuthRedirect } from "@/lib/supabase/auth-route";
import { resolvePostAuthDestination, shouldShowSuspendedNotice } from "@/lib/auth/navigation";
import { useAuth } from "@/contexts/auth-provider";
import { toast } from "sonner";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";

const LOGO_DARK = "/brand/strategos-logo-dark.png";

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
  const [showPassword, setShowPassword] = useState(false);
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

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    toast.info("Recuperação de senha estará disponível em breve.");
  }

  return (
    <div className="login-split">
      <LoginBrandPanel />

      <main className="login-split__panel">
        <div className="login-split__panel-inner">
          <header className="login-split__header">
            <img
              src={LOGO_DARK}
              alt="Strategos CRM"
              className="login-split__header-logo"
              width={88}
              height={88}
              decoding="async"
            />
            <h1 className="login-split__title">Bem vindo!</h1>
            <p className="login-split__subtitle">
              Sistema de inteligência política e gestão de campanha.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="login-split__form">
            <div className="login-split__field">
              <div className="login-split__input-wrap">
                <Mail className="login-split__input-icon" aria-hidden />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-split__input"
                  placeholder="Insira seu e-mail"
                  required
                />
              </div>
            </div>

            <div className="login-split__field">
              <div className="login-split__input-wrap">
                <Lock className="login-split__input-icon" aria-hidden />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-split__input login-split__input--password"
                  placeholder="Insira sua senha"
                  required
                />
                <button
                  type="button"
                  className="login-split__toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <div className="login-split__forgot">
              <button type="button" className="login-split__forgot-link" onClick={handleForgotPassword}>
                Esqueci a senha
              </button>
            </div>

            <button type="submit" className="login-split__submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="login-split__signup">
            Ainda não tem uma campanha?{" "}
            <Link to="/signup" className="login-split__signup-link">
              Criar campanha
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

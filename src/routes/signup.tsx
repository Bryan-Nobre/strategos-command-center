import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { ChevronLeft, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { completePoliticianOnboarding, signUpPolitician } from "@/services/auth";
import { SignupPendingEmailError } from "@/lib/supabase/errors";
import { signupFormSchema } from "@/types/domain";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { setStoredTenantId, loadAuthContext } from "@/lib/supabase/session";
import { ensurePublicAuthRedirect } from "@/lib/supabase/auth-route";
import { toast } from "sonner";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";
import type { z } from "zod";

const LOGO_DARK = "/brand/strategos-logo-dark.png";

const STEP1_FIELDS = ["fullName", "email", "password", "confirmPassword"] as const;

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
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { headline: "Juntos por uma cidade melhor" },
    mode: "onTouched",
  });

  async function handleAdvance() {
    const valid = await trigger([...STEP1_FIELDS]);
    if (valid) setStep(2);
  }

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
    <div className="login-split">
      <LoginBrandPanel />

      <main className="login-split__panel login-split__panel--signup">
        <div className="login-split__panel-inner">
          <header className="login-split__header login-split__header--compact">
            <img
              src={LOGO_DARK}
              alt="Strategos CRM"
              className="login-split__header-logo"
              width={88}
              height={88}
              decoding="async"
            />
            <p className="login-split__subtitle login-split__subtitle--lead">
              Cadastre-se e configure seu workspace político
            </p>
            <p className="login-split__steps" aria-live="polite">
              Etapa {step} de 2
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="login-split__form login-split__form--signup">
            {step === 1 ? (
              <>
                <div className="login-split__field">
                  <label htmlFor="fullName" className="login-split__field-label">
                    Nome
                  </label>
                  <div className="login-split__input-wrap">
                    <User className="login-split__input-icon" aria-hidden />
                    <input
                      id="fullName"
                      autoComplete="name"
                      className="login-split__input"
                      placeholder="Seu nome completo"
                      {...register("fullName")}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="login-split__field-error">{errors.fullName.message}</p>
                  )}
                </div>

                <div className="login-split__field">
                  <label htmlFor="email" className="login-split__field-label">
                    E-mail
                  </label>
                  <div className="login-split__input-wrap">
                    <Mail className="login-split__input-icon" aria-hidden />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="login-split__input"
                      placeholder="voce@campanha.com"
                      {...register("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="login-split__field-error">{errors.email.message}</p>
                  )}
                </div>

                <div className="login-split__field">
                  <label htmlFor="password" className="login-split__field-label">
                    Senha
                  </label>
                  <div className="login-split__input-wrap">
                    <Lock className="login-split__input-icon" aria-hidden />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="login-split__input login-split__input--password"
                      placeholder="Mínimo 8 caracteres"
                      {...register("password")}
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
                  {errors.password && (
                    <p className="login-split__field-error">{errors.password.message}</p>
                  )}
                </div>

                <div className="login-split__field">
                  <label htmlFor="confirmPassword" className="login-split__field-label">
                    Confirmação da senha
                  </label>
                  <div className="login-split__input-wrap">
                    <Lock className="login-split__input-icon" aria-hidden />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      className="login-split__input login-split__input--password"
                      placeholder="Repita a senha"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="login-split__toggle-pw"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="login-split__field-error">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <button type="button" className="login-split__submit" onClick={() => void handleAdvance()}>
                  Avançar
                </button>
              </>
            ) : (
              <>
                <div className="login-split__field">
                  <label htmlFor="tenantName" className="login-split__field-label">
                    Nome da campanha
                  </label>
                  <input
                    id="tenantName"
                    className="login-split__input login-split__input--plain"
                    placeholder="João Silva 2026"
                    {...register("tenantName")}
                  />
                  {errors.tenantName && (
                    <p className="login-split__field-error">{errors.tenantName.message}</p>
                  )}
                </div>

                <div className="login-split__field">
                  <label htmlFor="slug" className="login-split__field-label">
                    Slug da landing page
                  </label>
                  <input
                    id="slug"
                    className="login-split__input login-split__input--plain"
                    placeholder="joao-silva"
                    {...register("slug")}
                  />
                  {errors.slug && (
                    <p className="login-split__field-error">{errors.slug.message}</p>
                  )}
                </div>

                <div className="login-split__field">
                  <label htmlFor="headline" className="login-split__field-label">
                    Slogan da campanha
                  </label>
                  <input
                    id="headline"
                    className="login-split__input login-split__input--plain"
                    placeholder="Juntos por uma cidade melhor"
                    {...register("headline")}
                  />
                </div>

                <div className="login-split__actions-row">
                  <button
                    type="button"
                    className="login-split__back"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Voltar
                  </button>
                  <button type="submit" className="login-split__submit login-split__submit--grow" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Criando…
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="login-split__signup">
            Já possui uma campanha?{" "}
            <Link to="/login" className="login-split__signup-link">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

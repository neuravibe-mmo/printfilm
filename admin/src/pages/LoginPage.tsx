import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginAsAdmin } from "@/api/client";
import { useI18n } from "@/i18n";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";

// Admin login — film-lab ops aesthetic
export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [email, setEmail] = useState("hoangkien0705@gmail.com");
  const [password, setPassword] = useState("123456Aa@");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Submit credentials and enter dashboard
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await loginAsAdmin(email.trim(), password);
      toast.success(t("login.success"));
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("login.failed"));
    } finally {
      setLoading(false);
    }
  }

  const sprocketOffsets = ["8%", "22%", "36%", "50%", "64%", "78%", "90%"];

  return (
    <div className="login-shell relative">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitch className="bg-white/10 hover:bg-white/20 text-[#e8f0eb] border border-white/10 rounded-lg px-2.5 py-1.5" />
      </div>

      <section className="login-brand" aria-label="Brand">
        <div className="login-sprocket" aria-hidden>
          {sprocketOffsets.map((top) => (
            <span key={top} style={{ top }} />
          ))}
        </div>
        <div className="login-eyebrow">{t("login.opsConsole")}</div>
        <h1 className="login-title">
          PRINT
          <br />
          FILM
        </h1>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <h2>{t("login.welcome")}</h2>
          <form onSubmit={onSubmit}>
            <div className="login-field">
              <label htmlFor="email">{t("login.email")}</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-field">
              <label htmlFor="password">{t("login.password")}</label>
              <div className="login-password-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? t("login.submitting") : t("login.submit")}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

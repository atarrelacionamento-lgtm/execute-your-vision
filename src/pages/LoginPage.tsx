import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Rocket } from "lucide-react";

type Mode = "login" | "register";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const result =
      mode === "login"
        ? login(email, password)
        : register(name, email, password);

    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Erro inesperado.");
      return;
    }

    navigate("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Fundo estrelado */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => {
          const x = ((i * 137.5) % 100).toFixed(2);
          const y = ((i * 93.7) % 100).toFixed(2);
          const size = i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1;
          const opacity = (0.15 + (i % 6) * 0.1).toFixed(2);
          return (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${x}%`, top: `${y}%`,
                width: size, height: size,
                opacity: Number(opacity),
                animation: i % 7 === 0 ? `twinkle ${2 + (i % 3)}s ease-in-out infinite alternate` : undefined,
              }}
            />
          );
        })}
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/althius.png"
            alt="Althius"
            className="h-12 w-12 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="text-center">
            <span
              className="text-[17px] font-bold tracking-[0.3em] uppercase block"
              style={{
                background: "linear-gradient(90deg, hsl(240 5% 82%) 0%, hsl(240 5% 52%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ALTHIUS
            </span>
            <span className="text-[10px] tracking-widest text-muted-foreground/50 uppercase">
              GTM Engineering B2B
            </span>
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-md border border-border/60 rounded-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <h1 className="text-lg font-semibold text-foreground mb-1">
            {mode === "login" ? "Entrar na plataforma" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? "Acesse seu workspace." : "Comece gratuitamente."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full border border-input bg-background/60 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full border border-input bg-background/60 rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 caracteres"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full border border-input bg-background/60 rounded-md px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Rocket className="h-4 w-4 animate-bounce" />
                  <span>Entrando...</span>
                  <span className="flex gap-0.5 ml-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-primary-foreground/70 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </>
              ) : (
                mode === "login" ? "Entrar" : "Criar conta"
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className="text-primary hover:underline font-medium"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-primary hover:underline font-medium"
                >
                  Entrar
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/30 mt-6 tracking-wider uppercase">
          Althius CRM · GTM Engineering
        </p>
      </div>
    </div>
  );
}

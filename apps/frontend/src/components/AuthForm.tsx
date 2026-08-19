import { useState } from "react";
import { ArrowLeft, Gift, Mail, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, requestPasswordReset, sendVerificationEmail } from "@/lib/auth-client";

type Mode = "signin" | "signup" | "forgot";

interface AuthFormProps {
  onSuccess?: () => void;
  callbackURL?: string;
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

/**
 * DevineDesk auth column: a lime "extra discount" CTA on top of social +
 * email sign-in. Used both inside the AuthModal (with a showcase panel beside
 * it) and on the standalone /login page.
 */
export function AuthForm({ onSuccess, callbackURL }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("signup");
  const [showEmail, setShowEmail] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === "signin"
          ? await signIn.email({ email, password })
          : await signUp.email({ email, password, name: name || email.split("@")[0]! });
      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
      } else if (mode === "signup") {
        setVerifyNotice(`We sent a verification link to ${email}. Check your inbox and click the link to activate your account.`);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    setLoading(true);
    setError(null);
    try {
      const result = await sendVerificationEmail({ email, callbackURL: window.location.origin });
      if (result.error) {
        setError(result.error.message ?? "Could not resend verification email");
      } else {
        setVerifyNotice(`Verification link resent to ${email}. Check your inbox.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    await signIn.social({
      provider: "google",
      callbackURL: callbackURL ?? window.location.origin,
    });
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await requestPasswordReset({ email, redirectTo: window.location.origin + "/reset-password" });
      if (result.error) {
        setError(result.error.message ?? "Could not send reset email");
      } else {
        setNotice("If an account exists for that email, a reset link has been sent.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to DevineDesk</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign up and generate for free</p>
        </div>
      </div>

      {/* Lime "extra discount" CTA */}
      <button
        type="button"
        onClick={() => {
          setMode("signup");
          setShowEmail(true);
          setError(null);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        <Gift className="h-4 w-4" />
        Sign up and get an additional discount
      </button>

      {/* Social */}
      <button
        type="button"
        onClick={handleGoogle}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium transition-colors hover:bg-white/[0.07]"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="relative my-1 text-center text-xs uppercase tracking-widest text-muted-foreground">
        <span className="relative z-10 bg-card px-3">or</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>

      {!showEmail ? (
        <button
          type="button"
          onClick={() => setShowEmail(true)}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium transition-colors hover:bg-white/[0.07]"
        >
          <Mail className="h-4 w-4" />
          Continue with Email
        </button>
      ) : verifyNotice ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <Mail className="mx-auto h-8 w-8 text-primary" />
          <p className="text-sm text-foreground">{verifyNotice}</p>
          <button
            type="button"
            onClick={() => {
              setVerifyNotice(null);
              setMode("signin");
              setError(null);
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </button>
        </div>
      ) : mode === "forgot" ? (
        <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); setNotice(null); }}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </button>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-emerald-400">{notice}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Send reset link"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {error && error.toLowerCase().includes("not verified") && (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={loading}
              className="text-center text-sm text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              Resend verification email
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>

          {mode === "signin" && (
            <button
              type="button"
              className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => { setMode("forgot"); setError(null); setNotice(null); }}
            >
              Forgot password?
            </button>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setPassword("");
              }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </form>
      )}

      {error && !showEmail && <p className="text-sm text-destructive">{error}</p>}

      <p className="mt-1 text-center text-xs leading-5 text-muted-foreground">
        By continuing, I acknowledge the{" "}
        <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a> and agree to the{" "}
        <a href="/terms" className="underline underline-offset-2">Terms of Use</a>. I also confirm that I
        am at least 18 years old.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Github, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      await signIn(email, password);

      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberEmail", email);
      } else {
        localStorage.removeItem("rememberEmail");
      }

      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setError(null);
    setIsLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (err) {
      const message = err instanceof Error ? err.message : `${provider} login failed`;
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-emerald-electric">Arka</h1>
          <p className="text-muted-foreground">Sign in to your energy trading account</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-grid-bg border-grid-border focus:border-emerald-electric"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-grid-bg border-grid-border focus:border-emerald-electric"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-grid-border cursor-pointer"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-electric hover:bg-emerald-dark text-grid-bg font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link href="/auth/forgot-password" className="text-sm text-emerald-electric hover:text-emerald-dark transition-colors">
              Forgot your password?
            </Link>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-grid-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-grid-surface text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleOAuthLogin("google")}
              className="border-grid-border hover:border-emerald-electric/50 hover:bg-emerald-electric/5"
            >
              <Globe className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleOAuthLogin("github")}
              className="border-grid-border hover:border-emerald-electric/50 hover:bg-emerald-electric/5"
            >
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          {/* Signup Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-emerald-electric hover:text-emerald-dark font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="#" className="underline hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

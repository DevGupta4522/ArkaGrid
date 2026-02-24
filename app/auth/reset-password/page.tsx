"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "fair" | "strong">("weak");

  // const token = searchParams.get("code");

  // Check password strength
  useEffect(() => {
    if (password.length < 6) {
      setPasswordStrength("weak");
    } else if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordStrength("fair");
    } else {
      setPasswordStrength("strong");
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!password || !confirmPassword) {
        throw new Error("All fields are required");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await updatePassword(password);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-emerald-electric">Create New Password</h1>
          <p className="text-muted-foreground">Enter your new password below</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6 space-y-6">
          {/* Success Alert */}
          {success && (
            <div className="rounded-lg border border-emerald-electric/50 bg-emerald-electric/10 p-4 flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-electric flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-emerald-electric">Password updated!</p>
                <p className="text-sm text-emerald-electric/80">Redirecting to login...</p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground mb-2 block">
                  New Password
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
                {password && (
                  <div className="mt-2 flex gap-2">
                    <div className={`h-1 flex-1 rounded ${passwordStrength === "weak" ? "bg-rose-500" : "bg-grid-border"}`} />
                    <div
                      className={`h-1 flex-1 rounded ${passwordStrength === "fair" || passwordStrength === "strong" ? "bg-amber-grid" : "bg-grid-border"}`}
                    />
                    <div className={`h-1 flex-1 rounded ${passwordStrength === "strong" ? "bg-emerald-electric" : "bg-grid-border"}`} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {passwordStrength === "weak" && "Weak password"}
                  {passwordStrength === "fair" && "Fair password"}
                  {passwordStrength === "strong" && "Strong password"}
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-grid-bg border-grid-border focus:border-emerald-electric"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className="w-full bg-emerald-electric hover:bg-emerald-dark text-grid-bg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

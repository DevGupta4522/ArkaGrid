"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset email";
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
          <h1 className="text-3xl font-bold text-emerald-electric">Reset Password</h1>
          <p className="text-muted-foreground">Enter your email to receive a reset link</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6 space-y-6">
          {/* Success Alert */}
          {success && (
            <div className="rounded-lg border border-emerald-electric/50 bg-emerald-electric/10 p-4 space-y-3">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-electric flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-emerald-electric">Check your email</p>
                  <p className="text-sm text-emerald-electric/80">
                    We've sent a password reset link to <span className="font-medium">{email}</span>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground ml-8">
                The link will expire in 24 hours. If you don't see the email, check your spam folder.
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {!success ? (
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-electric hover:bg-emerald-dark text-grid-bg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-emerald-electric hover:text-emerald-dark font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          )}

          {/* Back to Login */}
          <Link
            href="/auth/login"
            className="flex items-center justify-center gap-2 text-sm text-emerald-electric hover:text-emerald-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

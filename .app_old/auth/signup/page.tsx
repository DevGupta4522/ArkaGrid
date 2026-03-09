"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Zap, Home, TrendingUp } from "lucide-react";

type UserRole = "consumer" | "prosumer" | "host";

const roles: { id: UserRole; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "consumer",
    label: "Consumer",
    description: "Trade energy and find chargers",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "prosumer",
    label: "Prosumer",
    description: "Trade energy + manage solar generation",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    id: "host",
    label: "Host",
    description: "Manage EV chargers and earn revenue",
    icon: <Home className="h-5 w-5" />,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("consumer");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!fullName || !email || !password || !confirmPassword) {
        throw new Error("All fields are required");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!agreeToTerms) {
        throw new Error("You must agree to the terms and conditions");
      }

      await signUp(email, password, fullName, selectedRole);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-emerald-electric">Create Your Account</h1>
          <p className="text-muted-foreground">Join Arka and start trading energy today</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-8 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>

              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="bg-grid-bg border-grid-border focus:border-emerald-electric"
                />
              </div>

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
                <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
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
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Choose Your Role</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    disabled={isLoading}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole === role.id
                        ? "border-emerald-electric bg-emerald-electric/10 shadow-lg shadow-emerald-electric/20"
                        : "border-emerald-electric/20 bg-emerald-electric/5 hover:border-emerald-electric/40 hover:bg-emerald-electric/10"
                    }`}
                  >
                    <div className={`${selectedRole === role.id ? "text-emerald-electric" : "text-muted-foreground"} mb-2`}>
                      {role.icon}
                    </div>
                    <p className="font-semibold text-foreground text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 rounded border-grid-border cursor-pointer mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                I agree to the{" "}
                <Link href="#" className="text-emerald-electric hover:text-emerald-dark underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-emerald-electric hover:text-emerald-dark underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-electric hover:bg-emerald-dark text-grid-bg font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-electric hover:text-emerald-dark font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

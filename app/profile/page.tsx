"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, signOut, updatePassword, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  // const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRole(profile.role || "");
    }
  }, [profile]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        throw new Error("New password and confirmation are required");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await updatePassword(newPassword);
      setSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update password";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.push("/auth/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to logout";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-grid-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-electric animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-grid-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to access your profile</p>
          <Link href="/auth/login">
            <Button className="bg-emerald-electric hover:bg-emerald-dark text-grid-bg">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-bg">
      {/* Header */}
      <header className="border-b border-grid-border bg-grid-surface/50 backdrop-blur sticky top-0">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard">
            <h1 className="text-xl font-bold text-emerald-electric">Arka</h1>
          </Link>
          <Button variant="ghost" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Page Title */}
          <div>
            <h2 className="text-3xl font-bold text-foreground">Profile Settings</h2>
            <p className="text-muted-foreground mt-1">Manage your account information</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-electric/50 bg-emerald-electric/10 p-4 flex gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-electric flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-electric">{success}</p>
            </div>
          )}

          {/* Personal Information Section */}
          <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                  Email Address
                </Label>
                <Input value={user.email || ""} disabled className="bg-grid-bg border-grid-border" />
                <p className="text-xs text-muted-foreground mt-1">Your email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-grid-bg border-grid-border focus:border-emerald-electric"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">Contact support to change your full name</p>
              </div>

              <div>
                <Label htmlFor="role" className="text-sm font-medium text-foreground mb-2 block">
                  Account Type
                </Label>
                <Input value={role} disabled className="bg-grid-bg border-grid-border capitalize" />
                <p className="text-xs text-muted-foreground mt-1">Your account type determines available features</p>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Change Password</h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword" className="text-sm font-medium text-foreground mb-2 block">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-grid-bg border-grid-border focus:border-emerald-electric pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? "text" : "password"}
                    placeholder="••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-grid-bg border-grid-border focus:border-emerald-electric pr-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="bg-emerald-electric hover:bg-emerald-dark text-grid-bg font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-rose-500">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
            <Button variant="destructive" disabled className="opacity-50 cursor-not-allowed">
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">Contact support to delete your account</p>
          </div>
        </div>
      </main>
    </div>
  );
}

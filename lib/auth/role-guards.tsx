"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles = [] }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grid-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-electric animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    router.push("/auth/login");
    return null;
  }

  if (roles.length > 0 && !roles.includes(profile.role)) {
    router.push("/dashboard");
    return null;
  }

  return <>{children}</>;
}

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 text-emerald-electric animate-spin" />
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      fallback || (
        <div className="rounded-lg border border-amber-grid/30 bg-amber-grid/5 p-4 text-center text-sm text-muted-foreground">
          You don&apos;t have permission to access this feature.
        </div>
      )
    );
  }

  return <>{children}</>;
}

export function useRole() {
  const { profile, isLoading } = useAuth();
  return { role: profile?.role, isLoading };
}

export function useIsAdmin() {
  const { profile } = useAuth();
  return profile?.role === "admin";
}

export function useIsHost() {
  const { profile } = useAuth();
  return ["host", "prosumer"].includes(profile?.role || "");
}

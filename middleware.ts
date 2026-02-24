import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password", "/auth/callback", "/map"];

  // Check if path is public
  if (publicPaths.some((publicPath) => path.startsWith(publicPath))) {
    return NextResponse.next();
  }

  // Protected paths require authentication
  const protectedPaths = ["/dashboard", "/wallet", "/control-room", "/profile", "/host", "/prosumer", "/admin"];

  if (protectedPaths.some((protectedPath) => path.startsWith(protectedPath))) {
    try {
      const supabase = await createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Not authenticated - redirect to login
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      // Check role-based access
      if (path.startsWith("/admin")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role !== "admin") {
          // Not admin - redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      if (path.startsWith("/host") || path.startsWith("/prosumer")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!["host", "prosumer", "admin"].includes(profile?.role || "")) {
          // Not host/prosumer/admin - redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Middleware error:", error);
      // On error, redirect to login to re-authenticate
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Include all paths except static assets and API routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};

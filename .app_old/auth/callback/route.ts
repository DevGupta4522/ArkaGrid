import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth error:", error);
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=${error.message}`);
      }

      if (data.user && !data.user.user_metadata?.full_name) {
        // New user from OAuth - might need to create profile manually
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: data.user.email || "",
            full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "",
            role: "consumer",
            wallet_balance_cents: 0,
            avatar_url: data.user.user_metadata?.avatar_url || null,
          });

        // Create agent mode record
        if (!profileError) {
          await supabase.from("agent_mode").insert({
            user_id: data.user.id,
            mode: "manual",
          });
        }
      }

      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } catch (err) {
      console.error("Callback error:", err);
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=callback_failed`);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`);
}

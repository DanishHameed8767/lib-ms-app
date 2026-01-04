// src/app/auth/callback/route.js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs"; // avoid edge quirks for auth/cookies

export async function GET(request) {
    const url = new URL(request.url);

    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") || "/auth/reset-password";

    // Always build a redirect response (never let this route 500)
    const redirectUrl = new URL(next, url.origin);
    const response = NextResponse.redirect(redirectUrl);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey =
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            // Missing env vars on Vercel = classic reason for 500
            console.error("Missing Supabase env vars on server.");
            const fail = new URL("/login", url.origin);
            fail.searchParams.set("error", "server_config_missing");
            return NextResponse.redirect(fail);
        }

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        });

        if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                console.error("exchangeCodeForSession error:", error.message);

                const fail = new URL("/login", url.origin);
                fail.searchParams.set("error", "auth_callback_failed");
                return NextResponse.redirect(fail);
            }
        } else {
            // No code: just bounce to login
            const fail = new URL("/login", url.origin);
            fail.searchParams.set("error", "missing_code");
            return NextResponse.redirect(fail);
        }

        return response;
    } catch (e) {
        console.error("Auth callback route crashed:", e?.message || e);

        const fail = new URL("/login", url.origin);
        fail.searchParams.set("error", "callback_exception");
        return NextResponse.redirect(fail);
    }
}

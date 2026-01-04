import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function createClient() {
    const cookieStore = cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    // In Server Components, setting cookies can throw.
                    // This is why Supabase recommends the Proxy (next step).
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // ignore
                    }
                },
            },
        }
    );
}

"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLES } from "@/lib/roles";

const AuthContext = React.createContext(null);

// ---- helpers ----
function withTimeout(promise, ms, label = "Operation") {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(
            () => reject(new Error(`${label} timed out`)),
            ms
        );
    });
    return Promise.race([promise, timeout]).finally(() =>
        clearTimeout(timeoutId)
    );
}

async function fetchProfileWithRetry(
    supabase,
    userId,
    { maxAttempts = 5 } = {}
) {
    if (!userId) return null;
    let delay = 250;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { data, error } = await supabase
            .from("profiles")
            .select(
                "id, username, full_name, role, is_active, contact_number, address, created_at"
            )
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            // if RLS blocks or transient issues, keep retrying a bit
            console.warn("fetchProfile attempt error:", error.message);
        }

        if (data) return data;

        if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, delay));
            delay = Math.min(delay * 2, 1500);
        }
    }
    return null;
}

export function AuthProvider({ children }) {
    const supabase = React.useMemo(() => createClient(), []);

    const [loading, setLoading] = React.useState(true);
    const [session, setSession] = React.useState(null);
    const [profile, setProfile] = React.useState(null);
    const [profileLoading, setProfileLoading] = React.useState(false);

    // prevents overlapping profile loads
    const profileLoadSeq = React.useRef(0);

    const loadProfile = React.useCallback(
        async (userId, { force = false } = {}) => {
            if (!userId) return null;

            if (!force && profile?.id === userId) return profile;

            const seq = ++profileLoadSeq.current;
            setProfileLoading(true);

            try {
                const p = await withTimeout(
                    fetchProfileWithRetry(supabase, userId),
                    7000,
                    "Profile fetch"
                );

                if (seq !== profileLoadSeq.current) return null;

                if (p && p.is_active === false) {
                    await supabase.auth.signOut();
                    setSession(null);
                    setProfile(null);
                    return null;
                }

                setProfile(p);
                return p;
            } catch (err) {
                console.warn("Profile load failed:", err?.message || err);
                return null;
            } finally {
                if (seq === profileLoadSeq.current) setProfileLoading(false);
            }
        },
        [supabase, profile]
    );

    const resyncAuth = React.useCallback(async () => {
        try {
            const { data, error } = await withTimeout(
                supabase.auth.getSession(),
                7000,
                "Session fetch"
            );
            if (error) throw error;

            const sess = data?.session ?? null;
            setSession(sess);

            if (sess?.user?.id) {
                await loadProfile(sess.user.id, { force: false });
            } else {
                setProfile(null);
            }
        } catch (err) {
            console.warn("Auth resync failed:", err?.message || err);
        }
    }, [supabase, loadProfile]);

    React.useEffect(() => {
        let mounted = true;

        const init = async () => {
            setLoading(true);
            try {
                const { data, error } = await withTimeout(
                    supabase.auth.getSession(),
                    7000,
                    "Session init"
                );
                if (error) throw error;
                if (!mounted) return;

                const sess = data?.session ?? null;
                setSession(sess);

                if (sess?.user?.id) {
                    await loadProfile(sess.user.id, { force: false });
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.error(
                    "Auth initialization failed:",
                    err?.message || err
                );
                if (!mounted) return;
                setSession(null);
                setProfile(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        init();

        const { data: sub } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                if (!mounted) return;

                setSession(newSession ?? null);

                const userId = newSession?.user?.id;

                if (!userId) {
                    setProfile(null);
                    setProfileLoading(false);
                    return;
                }

                if (event === "TOKEN_REFRESHED" && profile?.id === userId)
                    return;

                await loadProfile(userId, { force: false });
            }
        );

        const onVisible = () => {
            if (document.visibilityState === "visible") resyncAuth();
        };
        const onFocus = () => resyncAuth();

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);

        return () => {
            mounted = false;
            sub?.subscription?.unsubscribe?.();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [supabase, loadProfile, resyncAuth, profile?.id]);

    // ✅ default role: Reader (so nav is stable even if profile not loaded yet)
    const role = profile?.role || ROLES.READER;

    const signOut = React.useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
        setProfileLoading(false);
    }, [supabase]);

    const value = React.useMemo(
        () => ({
            loading,
            session,
            user: session?.user ?? null,
            profile,
            role,
            isActive: profile?.is_active ?? true,
            profileLoading,
            refreshProfile: async () => {
                const userId = session?.user?.id;
                if (!userId) return null;
                return await loadProfile(userId, { force: true });
            },
            resyncAuth,
            signOut,
            supabase,
        }),
        [
            loading,
            session,
            profile,
            role,
            profileLoading,
            loadProfile,
            resyncAuth,
            signOut,
            supabase,
        ]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { useAuth } from "@/context/AuthContext";

function defaultRouteForRole(role) {
    if (role === "Reader") return "/reader/dashboard";
    if (role === "Librarian" || role === "Staff" || role === "Administrator")
        return "/dashboard";
    return "/books";
}

export default function PostLoginPage() {
    const router = useRouter();
    const search = useSearchParams();
    const next = search.get("next");

    const {
        loading,
        user,
        profileLoading,
        profile,
        role,
        isActive,
        signOut,
        refreshProfile,
    } = useAuth();

    // If profile isn't ready yet, try refresh a couple times (handles trigger delay)
    React.useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (cancelled) return;

            // Not logged in → back to login
            if (!loading && !user) {
                router.replace(
                    `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`
                );
                return;
            }

            // If logged in but no profile yet, attempt a refresh a few times
            if (!loading && user && !profileLoading && !profile) {
                for (let i = 0; i < 3; i++) {
                    if (cancelled) return;
                    await refreshProfile();
                    if (cancelled) return;
                    // If profile appears, stop
                    if (profile) break;
                    await new Promise((r) => setTimeout(r, 600));
                }
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [loading, user, profileLoading, profile, refreshProfile, router, next]);

    // Once everything is ready, route
    React.useEffect(() => {
        if (loading) return;
        if (!user) return;

        // If profile is still loading or missing, keep showing spinner
        if (profileLoading || !profile) return;

        // Disabled account: sign out + send to login
        if (isActive === false) {
            (async () => {
                await signOut();
                router.replace("/login?disabled=1");
            })();
            return;
        }

        router.replace(next || defaultRouteForRole(role));
    }, [
        loading,
        user,
        profileLoading,
        profile,
        isActive,
        role,
        router,
        next,
        signOut,
    ]);

    return (
        <Box
            sx={{
                minHeight: "70vh",
                display: "grid",
                placeItems: "center",
                p: 2,
            }}
        >
            <Paper
                variant="outlined"
                sx={{ borderRadius: 4, p: 4, minWidth: 320 }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={22} />
                    <Box>
                        <Typography sx={{ fontWeight: 900 }}>
                            Signing you in…
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Loading your profile and permissions
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

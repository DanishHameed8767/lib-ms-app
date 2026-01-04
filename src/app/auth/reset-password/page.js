// src/app/auth/reset-password/page.js
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Divider,
} from "@mui/material";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import { createClient } from "@/lib/supabase/client";

function parseHashParams() {
    // Supports implicit flow: #access_token=...&refresh_token=...&type=recovery
    if (typeof window === "undefined") return {};
    const hash = window.location.hash?.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash || "";
    const params = new URLSearchParams(hash);
    return Object.fromEntries(params.entries());
}

export default function ResetPasswordPage() {
    const supabase = React.useMemo(() => createClient(), []);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [booting, setBooting] = React.useState(true);
    const [ready, setReady] = React.useState(false);
    const [error, setError] = React.useState("");

    const [password, setPassword] = React.useState("");
    const [confirm, setConfirm] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [success, setSuccess] = React.useState("");

    // 1) Establish a session from the recovery link
    React.useEffect(() => {
        let alive = true;

        (async () => {
            setBooting(true);
            setError("");
            setSuccess("");

            try {
                // PKCE flow: /auth/reset-password?code=xxxxx&type=recovery
                const code = searchParams?.get("code");
                if (code) {
                    const { error: exErr } =
                        await supabase.auth.exchangeCodeForSession(code);
                    if (exErr) throw exErr;

                    if (!alive) return;
                    setReady(true);
                    return;
                }

                // Implicit flow: tokens in URL hash
                const hp = parseHashParams();
                const access_token = hp.access_token;
                const refresh_token = hp.refresh_token;

                if (access_token && refresh_token) {
                    const { error: sErr } = await supabase.auth.setSession({
                        access_token,
                        refresh_token,
                    });
                    if (sErr) throw sErr;

                    // Clean up hash so tokens aren't left in the URL
                    try {
                        window.history.replaceState(
                            {},
                            document.title,
                            window.location.pathname + window.location.search
                        );
                    } catch {}

                    if (!alive) return;
                    setReady(true);
                    return;
                }

                // If we got here, there is no usable recovery context.
                // Show an error and guide user to request again.
                setError(
                    "Reset link is missing or expired. Please request a new password reset email."
                );
                setReady(false);
            } catch (e) {
                console.warn("Reset bootstrap failed:", e?.message || e);
                setError(e?.message || "Could not open reset link.");
                setReady(false);
            } finally {
                if (alive) setBooting(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [supabase, searchParams]);

    // 2) Update password
    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        const p = String(password || "");
        const c = String(confirm || "");

        if (p.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (p !== c) {
            setError("Passwords do not match.");
            return;
        }

        setSaving(true);
        try {
            const { error: uErr } = await supabase.auth.updateUser({
                password: p,
            });
            if (uErr) throw uErr;

            setSuccess(
                "Password updated successfully. Redirecting to sign in…"
            );

            // Optional: sign out to force fresh login
            await supabase.auth.signOut();

            setTimeout(() => {
                router.replace("/login"); // change if you want /reader/dashboard
                router.refresh();
            }, 900);
        } catch (e2) {
            setError(e2?.message || "Failed to update password.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                display: "grid",
                placeItems: "center",
                px: 2,
                background:
                    "radial-gradient(900px 600px at 20% 10%, rgba(255,106,61,0.20) 0%, rgba(0,0,0,0) 60%), radial-gradient(900px 600px at 85% 30%, rgba(52,152,219,0.12) 0%, rgba(0,0,0,0) 55%)",
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 5,
                    overflow: "hidden",
                }}
            >
                <Box sx={{ p: 2.5, display: "flex", gap: 1.25 }}>
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 3,
                            display: "grid",
                            placeItems: "center",
                            backgroundColor: "rgba(255,106,61,0.15)",
                            border: "1px solid rgba(255,106,61,0.25)",
                        }}
                    >
                        <LockResetOutlinedIcon />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                            Reset your password
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Choose a new password for your account.
                        </Typography>
                    </Box>
                </Box>

                <Divider />

                <Box sx={{ p: 2.5 }}>
                    {error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    ) : null}

                    {success ? (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    ) : null}

                    {booting ? (
                        <Box sx={{ display: "flex", gap: 1.25, py: 2 }}>
                            <CircularProgress size={18} />
                            <Typography sx={{ fontWeight: 800 }}>
                                Verifying reset link…
                            </Typography>
                        </Box>
                    ) : !ready ? (
                        <Box>
                            <Typography sx={{ fontWeight: 900 }}>
                                Can’t continue
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                            >
                                Request a new reset email from the sign-in page.
                            </Typography>
                            <Button
                                variant="contained"
                                sx={{ mt: 2, borderRadius: 3 }}
                                onClick={() => router.replace("/login")}
                            >
                                Go to Sign in
                            </Button>
                        </Box>
                    ) : (
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                label="New password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                sx={{ mb: 1.5 }}
                            />
                            <TextField
                                label="Confirm password"
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                fullWidth
                                sx={{ mb: 2 }}
                            />

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                    onClick={() => router.replace("/login")}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ borderRadius: 3 }}
                                    disabled={saving}
                                >
                                    {saving ? "Updating…" : "Update password"}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

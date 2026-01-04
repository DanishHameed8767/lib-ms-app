"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Divider,
    FormControlLabel,
    Checkbox,
    Link as MuiLink,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";

function defaultRouteForRole(role) {
    if (role === "Reader") return "/reader/dashboard";
    if (role === "Librarian" || role === "Staff" || role === "Administrator")
        return "/dashboard";
    return "/books";
}

// Exponential backoff profile fetch (helps when profile trigger replication is slightly delayed)
async function fetchProfileWithRetry(
    supabase,
    userId,
    { maxAttempts = 5 } = {}
) {
    let delay = 250; // ms
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const { data, error } = await supabase
            .from("profiles")
            .select("role, is_active")
            .eq("id", userId)
            .single();

        if (data) return data;

        // If it's a real error (not "no rows"), we can still retry once or twice, but surface later.
        // Supabase PostgREST "no rows" can appear as error depending on .single() semantics.
        if (attempt === maxAttempts) {
            if (error) throw error;
            throw new Error("Profile not found. Please refresh and try again.");
        }

        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(delay * 2, 1500);
    }

    throw new Error("Profile not found. Please refresh and try again.");
}

export default function LoginPage() {
    const supabase = React.useMemo(() => createClient(), []);
    const router = useRouter();
    const search = useSearchParams();
    const next = search.get("next");

    const [mode, setMode] = React.useState("signin"); // signin | signup
    const [remember, setRemember] = React.useState(true); // UI only unless you implement custom storage

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [fullName, setFullName] = React.useState("");
    const [username, setUsername] = React.useState("");

    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState(null); // { type: "success"|"error", text: string }

    // Forgot password dialog state
    const [fpOpen, setFpOpen] = React.useState(false);
    const [fpEmail, setFpEmail] = React.useState("");

    React.useEffect(() => {
        // Keep forgot-password email aligned with typed email
        setFpEmail((prev) => (prev ? prev : email));
    }, [email]);

    const signIn = async () => {
        setMessage(null);
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            router.replace(next || "/post-login");
        } catch (e) {
            setMessage({ type: "error", text: e?.message || "Login failed" });
        } finally {
            setLoading(false);
        }
    };

    const signUp = async () => {
        setMessage(null);
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        username,
                    },
                },
            });
            if (error) throw error;

            // router.replace(next || "/post-login");

            setMessage({
                type: "success",
                text: "Signup successful. If email confirmation is enabled, verify your email then log in.",
            });
            setMode("signin");
        } catch (e) {
            setMessage({ type: "error", text: e?.message || "Signup failed" });
        } finally {
            setLoading(false);
        }
    };

    const sendPasswordReset = async () => {
        setMessage(null);
        setLoading(true);
        try {
            if (!fpEmail) throw new Error("Please enter your email address.");

            // IMPORTANT:
            // You need a page/route that completes the reset flow.
            // Common pattern is: /auth/callback and /auth/reset-password
            // This only sends the email.
            const redirectTo = `${window.location.origin}/auth/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(
                fpEmail,
                {
                    redirectTo,
                }
            );
            if (error) throw error;

            setFpOpen(false);
            setMessage({
                type: "success",
                text: "Password reset email sent. Check your inbox.",
            });
        } catch (e) {
            setMessage({
                type: "error",
                text: e?.message || "Could not send reset email.",
            });
        } finally {
            setLoading(false);
        }
    };

    const isSignup = mode === "signup";

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                background: (t) =>
                    t.palette.mode === "dark"
                        ? "linear-gradient(90deg, #0F1115 0%, #0F1115 55%, #FF6A3D 55%, #FF6A3D 100%)"
                        : "linear-gradient(90deg, #F6F2ED 0%, #F6F2ED 55%, #FF6A3D 55%, #FF6A3D 100%)",
            }}
        >
            {/* Left hero */}
            <Box
                sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    justifyContent: "center",
                    p: 6,
                }}
            >
                <Box sx={{ maxWidth: 560 }}>
                    <Typography
                        variant="h3"
                        sx={{ fontWeight: 900, lineHeight: 1.1 }}
                    >
                        Maintain the Heart of the Library
                    </Typography>
                    <Typography
                        sx={{ mt: 1.5, color: "text.secondary", maxWidth: 460 }}
                    >
                        Handle books, members, payments and operations with
                        ease.
                    </Typography>

                    <Paper
                        sx={{
                            mt: 4,
                            p: 2,
                            borderRadius: 4,
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            width: "fit-content",
                        }}
                    >
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: 3,
                                backgroundColor: "primary.main",
                            }}
                        />
                        <Box>
                            <Typography sx={{ fontWeight: 800 }}>
                                LIBRA
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                Design system ready (Light/Dark)
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Box>

            {/* Right auth card */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                }}
            >
                <Paper
                    sx={{
                        width: "min(460px, 92vw)",
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                    }}
                >
                    <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h5" sx={{ fontWeight: 900 }}>
                            {isSignup ? "Create Account" : "Welcome Back"}
                        </Typography>
                        <Typography sx={{ mt: 0.75, color: "text.secondary" }}>
                            {isSignup
                                ? "Create your reader account to access the library."
                                : "Access your library dashboard and manage with confidence"}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        {message ? (
                            <Alert severity={message.type}>
                                {message.text}
                            </Alert>
                        ) : null}
                    </Box>

                    <Box sx={{ mt: 3, display: "grid", gap: 1.6 }}>
                        {isSignup ? (
                            <>
                                <TextField
                                    label="Full name"
                                    fullWidth
                                    value={fullName}
                                    onChange={(e) =>
                                        setFullName(e.target.value)
                                    }
                                />
                                <TextField
                                    label="Username"
                                    fullWidth
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    helperText="Must be unique."
                                />
                            </>
                        ) : null}

                        <TextField
                            label="Email address"
                            type="email"
                            fullWidth
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={remember}
                                        onChange={(e) =>
                                            setRemember(e.target.checked)
                                        }
                                    />
                                }
                                label="Remember me"
                            />
                            <MuiLink
                                href="#"
                                underline="hover"
                                sx={{ fontWeight: 600 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setFpOpen(true);
                                }}
                            >
                                Forgot Password?
                            </MuiLink>
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            sx={{ py: 1.1, borderRadius: 3 }}
                            disabled={
                                loading ||
                                !email ||
                                !password ||
                                (isSignup && (!fullName || !username))
                            }
                            onClick={isSignup ? signUp : signIn}
                        >
                            {loading
                                ? "Please wait…"
                                : isSignup
                                ? "Create Account"
                                : "Login"}
                        </Button>

                        <Divider />

                        <Typography
                            variant="body2"
                            sx={{
                                textAlign: "center",
                                color: "text.secondary",
                            }}
                        >
                            {isSignup
                                ? "Already have an account?"
                                : "New to Libra?"}{" "}
                            <MuiLink
                                href="#"
                                underline="hover"
                                sx={{ fontWeight: 700, color: "primary.main" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMessage(null);
                                    setMode((m) =>
                                        m === "signin" ? "signup" : "signin"
                                    );
                                }}
                            >
                                {isSignup ? "Sign in" : "Create an Account"}
                            </MuiLink>
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                textAlign: "center",
                                color: "text.secondary",
                            }}
                        >
                            By continuing you agree to our{" "}
                            <MuiLink
                                component={Link}
                                href="/policies"
                                underline="hover"
                            >
                                policies
                            </MuiLink>
                            .
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Forgot Password Dialog */}
            <Dialog
                open={fpOpen}
                onClose={() => setFpOpen(false)}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Reset your password</DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mb: 2 }}
                    >
                        We’ll email you a reset link.
                    </Typography>
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            mt: 1,
                            color: "text.secondary",
                        }}
                    >
                        Note: your app needs a page at{" "}
                        <b>/auth/reset-password</b> to finish the reset.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setFpOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={sendPasswordReset}
                        disabled={loading || !fpEmail}
                    >
                        Send link
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

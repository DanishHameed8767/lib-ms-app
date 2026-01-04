"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Avatar,
    Card,
    CardContent,
    Snackbar,
} from "@mui/material";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";

function initialsFromName(name) {
    const s = String(name || "").trim();
    if (!s) return "U";
    const parts = s.split(/\s+/).filter(Boolean);
    return parts
        .slice(0, 2)
        .map((p) => (p[0] || "").toUpperCase())
        .join("");
}

export default function ProfilePage() {
    const { supabase, user, profile, profileLoading, refreshProfile } =
        useAuth();

    const [form, setForm] = React.useState({
        username: "",
        full_name: "",
        contact_number: "",
        address: "",
    });

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");
    const [dirty, setDirty] = React.useState(false);
    const [toast, setToast] = React.useState({ open: false, msg: "" });

    React.useEffect(() => {
        // When profile arrives / changes, hydrate form
        if (!user) {
            setLoading(false);
            return;
        }
        const p = profile || {};
        setForm({
            username: p.username || "",
            full_name: p.full_name || "",
            contact_number: p.contact_number || "",
            address: p.address || "",
        });
        setDirty(false);
        setLoading(false);
    }, [user, profile]);

    const displayName =
        profile?.full_name || profile?.username || user?.email || "Account";

    const avatarText = initialsFromName(
        profile?.full_name || profile?.username
    );

    function updateField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
        setDirty(true);
    }

    const validate = () => {
        if (!String(form.username || "").trim()) return "Username is required";
        if (String(form.username).length < 3)
            return "Username must be at least 3 characters";
        return "";
    };

    async function handleSave() {
        setError("");
        if (!supabase || !user) {
            setError("Not authenticated");
            return;
        }

        const v = validate();
        if (v) {
            setError(v);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                username: String(form.username).trim(),
                full_name: String(form.full_name || "").trim() || null,
                contact_number:
                    String(form.contact_number || "").trim() || null,
                address: String(form.address || "").trim() || null,
            };

            // Update own profile row
            const { data, error: uErr } = await supabase
                .from("profiles")
                .update(payload)
                .eq("id", user.id)
                .select(
                    "id, username, full_name, role, is_active, contact_number, address, created_at"
                )
                .single();

            if (uErr) throw uErr;

            setDirty(false);
            setToast({ open: true, msg: "Profile saved ✅" });

            // keep AuthContext in sync
            await refreshProfile?.();
        } catch (e) {
            setError(e?.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    }

    async function handleReset() {
        setError("");
        setLoading(true);
        try {
            await refreshProfile?.();
        } finally {
            setLoading(false);
        }
    }

    const isBusy = loading || profileLoading;

    return (
        <AppShell title="Profile">
            <PageHeader
                title="My Profile"
                subtitle="View and update your account details."
                right={
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                            onClick={handleReset}
                            disabled={saving || isBusy}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ borderRadius: 3 }}
                            onClick={handleSave}
                            disabled={saving || isBusy || !dirty}
                        >
                            {saving ? "Saving…" : "Save Changes"}
                        </Button>
                    </Box>
                }
            />

            {error ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            ) : null}

            {isBusy ? (
                <Paper variant="outlined" sx={{ mt: 2, p: 3, borderRadius: 4 }}>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 1.25,
                            alignItems: "center",
                        }}
                    >
                        <CircularProgress size={18} />
                        <Typography sx={{ fontWeight: 900 }}>
                            Loading profile…
                        </Typography>
                    </Box>
                </Paper>
            ) : !user ? (
                <Paper variant="outlined" sx={{ mt: 2, p: 3, borderRadius: 4 }}>
                    <Typography sx={{ fontWeight: 900 }}>
                        You’re not logged in
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                    >
                        Please sign in to view your profile.
                    </Typography>
                </Paper>
            ) : (
                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" },
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    {/* Left: Summary */}
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent
                            sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 58,
                                    height: 58,
                                    fontWeight: 900,
                                }}
                            >
                                {avatarText}
                            </Avatar>

                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    sx={{ fontWeight: 900, fontSize: 18 }}
                                >
                                    {displayName}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary" }}
                                >
                                    {user.email || "—"}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Role: <b>{profile?.role || "Reader"}</b>
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Right: Editable fields */}
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, overflow: "hidden" }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Account details
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Update your information below.
                            </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ p: 2, display: "grid", gap: 1.5 }}>
                            <TextField
                                label="Username"
                                value={form.username}
                                onChange={(e) =>
                                    updateField("username", e.target.value)
                                }
                                required
                                helperText="This is your public handle."
                            />

                            <TextField
                                label="Full name"
                                value={form.full_name}
                                onChange={(e) =>
                                    updateField("full_name", e.target.value)
                                }
                            />

                            <TextField
                                label="Contact number"
                                value={form.contact_number}
                                onChange={(e) =>
                                    updateField(
                                        "contact_number",
                                        e.target.value
                                    )
                                }
                            />

                            <TextField
                                label="Address"
                                value={form.address}
                                onChange={(e) =>
                                    updateField("address", e.target.value)
                                }
                                multiline
                                minRows={3}
                            />

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    pt: 0.5,
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                    onClick={() => {
                                        // reset to last profile values
                                        const p = profile || {};
                                        setForm({
                                            username: p.username || "",
                                            full_name: p.full_name || "",
                                            contact_number:
                                                p.contact_number || "",
                                            address: p.address || "",
                                        });
                                        setDirty(false);
                                    }}
                                    disabled={saving || !dirty}
                                >
                                    Discard changes
                                </Button>
                                <Button
                                    variant="contained"
                                    sx={{ borderRadius: 3 }}
                                    onClick={handleSave}
                                    disabled={saving || !dirty}
                                >
                                    {saving ? "Saving…" : "Save"}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            )}

            <Snackbar
                open={toast.open}
                autoHideDuration={2500}
                onClose={() => setToast({ open: false, msg: "" })}
                message={toast.msg}
            />
        </AppShell>
    );
}

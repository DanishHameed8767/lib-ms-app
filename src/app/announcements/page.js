// src/app/announcements/page.js
"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "@/context/AuthContext";

// ✅ IMPORTANT: use px strings so MUI doesn't multiply by theme.shape.borderRadius (=14)
const R = {
    card: "14px",
    soft: "12px",
    chip: "999px",
};

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function ExpiryChip({ expirationDate }) {
    const label = expirationDate ? `Until ${expirationDate}` : "No expiry";
    const hasExpiry = Boolean(expirationDate);

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                borderRadius: R.chip, // ✅ not multiplied
                fontWeight: 900,
                backgroundColor: hasExpiry
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(46,204,113,0.15)",
                color: hasExpiry ? "text.secondary" : "#2ecc71",
                borderColor: "divider",
            }}
            variant="outlined"
        />
    );
}

export default function AnnouncementsPage() {
    const { supabase } = useAuth();

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const load = React.useCallback(async () => {
        if (!supabase) return;

        setLoading(true);
        setError("");

        try {
            // Readers policy: can SELECT only active (unless staff)
            // We also filter out expired items on the client.
            const { data, error: aErr } = await supabase
                .from("announcements")
                .select(
                    "id,title,description,expiration_date,is_active,created_at"
                )
                .order("created_at", { ascending: false })
                .limit(200);

            if (aErr) throw aErr;

            const today = isoDate();
            const list = (data || []).filter((a) => {
                if (!a?.is_active) return false;
                const exp = a.expiration_date ? String(a.expiration_date) : "";
                return !exp || exp >= today; // keep if no expiry or still valid
            });

            setRows(list);
        } catch (e) {
            setError(e?.message || "Failed to load announcements");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    return (
        <AppShell title="Announcements">
            <Box sx={{ minWidth: 0 }}>
                <PageHeader
                    title="Announcements"
                    subtitle="Latest notices from your library."
                />

                {error ? (
                    <Alert
                        severity="error"
                        sx={{ mt: 2, borderRadius: R.soft }}
                    >
                        {error}
                    </Alert>
                ) : null}

                {/* Summary bar */}
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 2,
                        borderRadius: R.card, // ✅ not multiplied
                        p: 1.25,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                        minWidth: 0,
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                        borderColor: "divider",
                    }}
                >
                    <Typography sx={{ fontWeight: 900 }}>
                        {loading
                            ? "Loading…"
                            : `Showing ${rows.length} announcement${
                                  rows.length === 1 ? "" : "s"
                              }`}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Chip
                        size="small"
                        label="Active"
                        sx={{
                            borderRadius: R.chip,
                            fontWeight: 900,
                            backgroundColor: "rgba(46,204,113,0.15)",
                            color: "#2ecc71",
                        }}
                    />
                </Paper>

                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            borderRadius: R.card, // ✅ not multiplied
                            p: 2.25,
                            minWidth: 0,
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1.25,
                                alignItems: "center",
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography sx={{ fontWeight: 900 }}>
                                Loading announcements…
                            </Typography>
                        </Box>
                    </Paper>
                ) : rows.length === 0 ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            borderRadius: R.card, // ✅ not multiplied
                            p: 3,
                            minWidth: 0,
                            textAlign: "center",
                        }}
                    >
                        <Typography sx={{ fontWeight: 900 }}>
                            No announcements
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                            Nothing new right now.
                        </Typography>
                    </Paper>
                ) : (
                    <Box sx={{ mt: 2, display: "grid", gap: 2, minWidth: 0 }}>
                        {rows.map((a) => (
                            <Paper
                                key={a.id}
                                variant="outlined"
                                sx={{
                                    borderRadius: R.card, // ✅ not multiplied
                                    overflow: "hidden",
                                    minWidth: 0,
                                    background:
                                        "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                                    borderColor: "divider",
                                }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        flexWrap: "wrap",
                                        alignItems: "flex-start",
                                        minWidth: 0,
                                    }}
                                >
                                    <Box sx={{ minWidth: 0 }}>
                                        <Typography
                                            sx={{ fontWeight: 900 }}
                                            noWrap
                                        >
                                            {a.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                mt: 0.25,
                                            }}
                                            noWrap
                                        >
                                            Expires:{" "}
                                            <b>{a.expiration_date || "—"}</b>
                                        </Typography>
                                    </Box>

                                    <ExpiryChip
                                        expirationDate={a.expiration_date}
                                    />
                                </Box>

                                <Divider sx={{ borderColor: "divider" }} />

                                <Box sx={{ p: 2, minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            lineHeight: 1.7,
                                            whiteSpace: "pre-wrap",
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {a.description}
                                    </Typography>
                                </Box>

                                {/* subtle bottom accent */}
                                <Box
                                    aria-hidden
                                    sx={{
                                        height: 2,
                                        background:
                                            "linear-gradient(90deg, rgba(255,106,61,0.9), rgba(255,106,61,0))",
                                    }}
                                />
                            </Paper>
                        ))}
                    </Box>
                )}
            </Box>
        </AppShell>
    );
}

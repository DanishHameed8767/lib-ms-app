// src/app/policies/page.js
"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    TextField,
    InputAdornment,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "@/context/AuthContext";

// Use px strings so MUI doesn't multiply by theme.shape.borderRadius (=14)
const R = {
    card: "14px",
    input: "14px",
    chip: "999px",
    soft: "12px",
};

function formatDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function categoryTone(category = "") {
    const c = String(category).toLowerCase();
    if (c.includes("fine") || c.includes("payment")) return "warn";
    if (c.includes("borrow") || c.includes("loan")) return "ok";
    if (c.includes("membership") || c.includes("plan")) return "info";
    if (c.includes("conduct") || c.includes("discipline")) return "danger";
    return "neutral";
}

function ToneChip({ label, tone = "neutral" }) {
    const map = {
        ok: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        warn: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        danger: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        info: { bg: "rgba(52,152,219,0.15)", fg: "#3498db" },
        neutral: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };
    const s = map[tone] || map.neutral;

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                borderRadius: R.chip, // ✅ important
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

export default function PoliciesPage() {
    const { supabase } = useAuth();

    const [q, setQ] = React.useState("");
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const load = React.useCallback(async () => {
        if (!supabase) return;

        setLoading(true);
        setError("");

        try {
            const { data, error: pErr } = await supabase
                .from("policies")
                .select("id,title,category,value,is_active,created_at")
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(500);

            if (pErr) throw pErr;
            setRows(data || []);
        } catch (e) {
            setError(e?.message || "Failed to load policies");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        return (rows || []).filter((p) => {
            if (!query) return true;
            return (
                String(p.title || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.category || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.value || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [rows, q]);

    return (
        <AppShell title="Policies">
            <Box sx={{ minWidth: 0 }}>
                <PageHeader
                    title="Policies"
                    subtitle="Library rules and guidelines."
                    right={
                        <TextField
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search policies…"
                            sx={{ width: { xs: "100%", sm: 420 }, minWidth: 0 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    }
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
                        borderRadius: R.card, // ✅ string
                        p: 1.25,
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                        flexWrap: "wrap",
                        minWidth: 0,
                        background:
                            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
                        borderColor: "divider",
                    }}
                >
                    <Typography sx={{ fontWeight: 900 }}>
                        Showing {loading ? "…" : filtered.length} polic
                        {loading || filtered.length === 1 ? "y" : "ies"}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <ToneChip
                        label={q.trim() ? "Search active" : "All policies"}
                        tone={q.trim() ? "warn" : "neutral"}
                    />
                </Paper>

                <Box sx={{ display: "grid", gap: 2, mt: 2, minWidth: 0 }}>
                    {loading ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: R.card,
                                p: 4,
                                textAlign: "center",
                                minWidth: 0,
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography sx={{ fontWeight: 900, mt: 1 }}>
                                Loading policies…
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                            >
                                Fetching from Supabase
                            </Typography>
                        </Paper>
                    ) : (
                        <>
                            {filtered.map((p) => {
                                const tone = categoryTone(p.category);
                                return (
                                    <Paper
                                        key={p.id}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: R.card, // ✅ string
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
                                                alignItems: "flex-start",
                                                justifyContent: "space-between",
                                                gap: 2,
                                                flexWrap: "wrap",
                                                minWidth: 0,
                                            }}
                                        >
                                            <Box sx={{ minWidth: 0 }}>
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                    noWrap
                                                >
                                                    {p.title}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        mt: 0.25,
                                                    }}
                                                    noWrap
                                                >
                                                    {p.category || "General"} •
                                                    Updated{" "}
                                                    {formatDateTime(
                                                        p.created_at
                                                    )}
                                                </Typography>
                                            </Box>

                                            <ToneChip
                                                label={p.category || "General"}
                                                tone={tone}
                                            />
                                        </Box>

                                        <Divider
                                            sx={{ borderColor: "divider" }}
                                        />

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
                                                {p.value}
                                            </Typography>
                                        </Box>

                                        {/* Bottom accent strip */}
                                        <Box
                                            aria-hidden
                                            sx={{
                                                height: 2,
                                                background:
                                                    tone === "warn"
                                                        ? "linear-gradient(90deg, rgba(255,106,61,0.9), rgba(255,106,61,0))"
                                                        : tone === "ok"
                                                        ? "linear-gradient(90deg, rgba(46,204,113,0.9), rgba(46,204,113,0))"
                                                        : tone === "danger"
                                                        ? "linear-gradient(90deg, rgba(231,76,60,0.9), rgba(231,76,60,0))"
                                                        : tone === "info"
                                                        ? "linear-gradient(90deg, rgba(52,152,219,0.9), rgba(52,152,219,0))"
                                                        : "linear-gradient(90deg, rgba(160,160,160,0.6), rgba(160,160,160,0))",
                                            }}
                                        />
                                    </Paper>
                                );
                            })}

                            {filtered.length === 0 ? (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: R.card,
                                        p: 4,
                                        textAlign: "center",
                                        minWidth: 0,
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 900 }}>
                                        No policies found
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.5,
                                        }}
                                    >
                                        Try another search query.
                                    </Typography>
                                </Paper>
                            ) : null}
                        </>
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}

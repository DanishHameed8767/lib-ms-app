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

function formatDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
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
            // Readers will only see is_active = true due to RLS policy,
            // but we still filter to keep UI predictable.
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
            const matchesQuery =
                !query ||
                String(p.title || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.category || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.value || "")
                    .toLowerCase()
                    .includes(query);
            return matchesQuery;
        });
    }, [rows, q]);

    return (
        <AppShell title="Policies">
            <PageHeader
                title="Policies"
                subtitle="Library rules and guidelines."
                right={
                    <TextField
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search policies…"
                        sx={{ width: { xs: "100%", sm: 420 } }}
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
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            ) : null}

            <Box sx={{ display: "grid", gap: 2, mt: 2 }}>
                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, p: 4, textAlign: "center" }}
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
                        {filtered.map((p) => (
                            <Paper
                                key={p.id}
                                variant="outlined"
                                sx={{ borderRadius: 4, overflow: "hidden" }}
                            >
                                <Box
                                    sx={{
                                        p: 2,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            {p.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                mt: 0.25,
                                            }}
                                        >
                                            {p.category} • Updated{" "}
                                            {formatDateTime(p.created_at)}
                                        </Typography>
                                    </Box>

                                    <Chip
                                        size="small"
                                        label={p.category || "General"}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 900,
                                        }}
                                    />
                                </Box>

                                <Divider />

                                <Box sx={{ p: 2 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        {p.value}
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}

                        {filtered.length === 0 ? (
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: 4,
                                    p: 4,
                                    textAlign: "center",
                                }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    No policies found
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Try another search query.
                                </Typography>
                            </Paper>
                        ) : null}
                    </>
                )}
            </Box>
        </AppShell>
    );
}

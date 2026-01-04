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

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function ExpiryChip({ expirationDate }) {
    const label = expirationDate ? `Until ${expirationDate}` : "No expiry";
    return (
        <Chip
            size="small"
            label={label}
            sx={{ borderRadius: 2, fontWeight: 900 }}
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
            <PageHeader
                title="Announcements"
                subtitle="Latest notices from your library."
            />

            {error ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            ) : null}

            {loading ? (
                <Paper variant="outlined" sx={{ mt: 2, borderRadius: 4, p: 2 }}>
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
                <Paper variant="outlined" sx={{ mt: 2, borderRadius: 4, p: 3 }}>
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
                <Box sx={{ mt: 2, display: "grid", gap: 2 }}>
                    {rows.map((a) => (
                        <Paper
                            key={a.id}
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
                                        {a.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.25,
                                        }}
                                    >
                                        Expires:{" "}
                                        <b>{a.expiration_date || "—"}</b>
                                    </Typography>
                                </Box>

                                <ExpiryChip
                                    expirationDate={a.expiration_date}
                                />
                            </Box>

                            <Divider />

                            <Box sx={{ p: 2 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary" }}
                                >
                                    {a.description}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}
        </AppShell>
    );
}

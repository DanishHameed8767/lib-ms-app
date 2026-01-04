"use client";

import * as React from "react";
import Link from "next/link";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Chip,
    Button,
    Alert,
} from "@mui/material";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import {
    fetchReaderDashboardStats,
    fetchMySubscriptionSummary,
} from "@/lib/supabase/readerApi";

function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function isoDate(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function ReaderDashboardPage() {
    const { supabase, user } = useAuth();

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [stats, setStats] = React.useState({
        activeBorrows: 0,
        overdueBorrows: 0,
        unpaidFinesCount: 0,
        unpaidTotal: 0,
        pendingApprovals: 0,
    });

    // { sub, plan } or null
    const [subInfo, setSubInfo] = React.useState(null);

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase || !user?.id) return;

            let cancelled = false;
            const cancel = () => {
                cancelled = true;
            };

            if (!silent) setLoading(true);
            setError("");

            try {
                const [s, subscription] = await Promise.all([
                    fetchReaderDashboardStats(supabase, user.id),
                    fetchMySubscriptionSummary(supabase, user.id),
                ]);

                if (cancelled) return cancel;

                setStats(s);
                setSubInfo(subscription);
            } catch (e) {
                if (!cancelled)
                    setError(e?.message || "Failed to load dashboard");
            } finally {
                if (!cancelled && !silent) setLoading(false);
            }

            return cancel;
        },
        [supabase, user?.id]
    );

    React.useEffect(() => {
        let cancel = null;

        (async () => {
            cancel = await load({ silent: false });
        })();

        // Fix tab-switch “hung requests” -> silently resync when visible/focused
        const onVisible = () => {
            if (document.visibilityState === "visible") load({ silent: true });
        };
        const onFocus = () => load({ silent: true });

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);

        return () => {
            if (typeof cancel === "function") cancel();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [load]);

    const today = isoDate();

    const membershipValue = React.useMemo(() => {
        if (!subInfo?.sub) return "None";
        const { status, end_date } = subInfo.sub;

        // treat Active but past end_date as Expired for UI
        if (status === "Active" && end_date && String(end_date) < today)
            return "Expired";
        return status || "—";
    }, [subInfo, today]);

    const membershipSubtitle = React.useMemo(() => {
        if (!subInfo?.sub) return "No membership plan selected.";
        const planName = subInfo.sub.plan_name || subInfo.plan?.name || "—";
        const end = subInfo.sub.end_date ? String(subInfo.sub.end_date) : "—";
        return `Plan: ${planName} • Ends: ${end}`;
    }, [subInfo]);

    const membershipChip = React.useMemo(() => {
        if (!subInfo?.sub)
            return { label: "Pick a plan to borrow", tone: "warn" };

        const end = subInfo.sub.end_date ? String(subInfo.sub.end_date) : "";
        const status = membershipValue;

        if (status === "Active")
            return { label: `Valid until ${end || "—"}`, tone: "ok" };
        if (status === "Pending")
            return { label: "Awaiting approval", tone: "warn" };
        if (status === "Rejected")
            return { label: "Payment rejected", tone: "danger" };
        if (status === "Expired")
            return { label: "Expired — renew to borrow", tone: "danger" };
        return { label: `Status: ${status}`, tone: "warn" };
    }, [subInfo, membershipValue]);

    return (
        <RoleGuard allowedRoles={[ROLES.READER]}>
            <AppShell title="Reader Dashboard">
                <PageHeader
                    title="Reader Dashboard"
                    subtitle="Your activity, borrowings and fine status."
                    right={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                                component={Link}
                                href="/books"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                Browse Books
                            </Button>
                            <Button
                                component={Link}
                                href="/reader/fines"
                                variant="contained"
                                sx={{ borderRadius: 3 }}
                            >
                                View Fines
                            </Button>
                        </Box>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
                        {error}
                    </Alert>
                ) : null}

                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
                        gap: 2,
                    }}
                >
                    <StatCard
                        title="Active Borrowings"
                        value={loading ? "…" : stats.activeBorrows}
                        chips={[
                            {
                                label: `${stats.overdueBorrows} overdue`,
                                tone: stats.overdueBorrows ? "danger" : "ok",
                            },
                        ]}
                        action={{ label: "Open", href: "/reader/borrows" }}
                    />

                    <StatCard
                        title="Unpaid / Pending Fines"
                        value={loading ? "…" : stats.unpaidFinesCount}
                        chips={[
                            {
                                label: `Total ${money(stats.unpaidTotal)}`,
                                tone: stats.unpaidTotal ? "warn" : "ok",
                            },
                            {
                                label: `${stats.pendingApprovals} pending approvals`,
                                tone: stats.pendingApprovals ? "warn" : "ok",
                            },
                        ]}
                        action={{ label: "Pay", href: "/reader/fines" }}
                    />

                    <StatCard
                        title="Membership"
                        value={loading ? "…" : membershipValue}
                        subtitle={membershipSubtitle}
                        chips={[membershipChip]}
                        action={{
                            label: "View Plans",
                            href: "/reader/membership",
                        }}
                    />
                </Box>

                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                        gap: 2,
                    }}
                >
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, overflow: "hidden" }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Quick Actions
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Useful shortcuts
                            </Typography>
                        </Box>
                        <Divider />
                        <Box
                            sx={{
                                p: 2,
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                            }}
                        >
                            <Button
                                component={Link}
                                href="/books"
                                variant="contained"
                                sx={{ borderRadius: 3 }}
                            >
                                Browse Books
                            </Button>
                            <Button
                                component={Link}
                                href="/announcements"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                Announcements
                            </Button>
                            <Button
                                component={Link}
                                href="/reader/borrows"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                My Borrowings
                            </Button>
                            <Button
                                component={Link}
                                href="/reader/fines"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                My Fines
                            </Button>
                        </Box>
                    </Paper>

                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, overflow: "hidden" }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Status
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Overview
                            </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ p: 2, display: "grid", gap: 1 }}>
                            <Chip
                                label={`Active borrows: ${stats.activeBorrows}`}
                                sx={{ borderRadius: 3, fontWeight: 900 }}
                                variant="outlined"
                            />
                            <Chip
                                label={`Overdue: ${stats.overdueBorrows}`}
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 900,
                                    backgroundColor: stats.overdueBorrows
                                        ? "rgba(231,76,60,0.15)"
                                        : "rgba(46,204,113,0.15)",
                                    color: stats.overdueBorrows
                                        ? "#e74c3c"
                                        : "#2ecc71",
                                }}
                            />
                            <Chip
                                label={`Unpaid fines: ${
                                    stats.unpaidFinesCount
                                } (${money(stats.unpaidTotal)})`}
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 900,
                                    backgroundColor: stats.unpaidFinesCount
                                        ? "rgba(255,106,61,0.15)"
                                        : "rgba(46,204,113,0.15)",
                                }}
                            />
                            <Chip
                                label={`Pending receipts: ${stats.pendingApprovals}`}
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 900,
                                    backgroundColor: stats.pendingApprovals
                                        ? "rgba(255,106,61,0.15)"
                                        : "rgba(46,204,113,0.15)",
                                }}
                            />
                        </Box>
                    </Paper>
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

function StatCard({ title, value, subtitle, chips = [], action }) {
    const tones = {
        ok: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        warn: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        danger: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
    };

    return (
        <Paper variant="outlined" sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
                    {subtitle ? (
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: 26 }}>
                    {value}
                </Typography>
            </Box>

            <Divider />

            <Box sx={{ p: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                {chips.map((c) => {
                    const t = tones[c.tone] || tones.ok;
                    return (
                        <Chip
                            key={c.label}
                            label={c.label}
                            sx={{
                                borderRadius: 3,
                                fontWeight: 900,
                                backgroundColor: t.bg,
                                color: t.fg,
                            }}
                        />
                    );
                })}
                <Box sx={{ flex: 1 }} />
                {action ? (
                    <Button
                        component={Link}
                        href={action.href}
                        variant="outlined"
                        sx={{ borderRadius: 3 }}
                    >
                        {action.label}
                    </Button>
                ) : null}
            </Box>
        </Paper>
    );
}

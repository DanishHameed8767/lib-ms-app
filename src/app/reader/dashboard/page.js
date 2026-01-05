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
    Stack,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import {
    fetchReaderDashboardStats,
    fetchMySubscriptionSummary,
} from "@/lib/supabase/readerApi";

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

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
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [stats, setStats] = React.useState({
        activeBorrows: 0,
        overdueBorrows: 0,
        unpaidFinesCount: 0,
        unpaidTotal: 0,
        pendingApprovals: 0,
    });

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

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const surface = {
        borderRadius: R.xl,
        border: `1px solid ${borderSoft}`,
        background: isDark
            ? `linear-gradient(180deg, ${alpha("#FFFFFF", 0.05)} 0%, ${alpha(
                  "#FFFFFF",
                  0.02
              )} 100%)`
            : "#FFFFFF",
        boxShadow: "none",
        overflow: "hidden",
    };

    return (
        <RoleGuard allowedRoles={[ROLES.READER]}>
            <AppShell title="Reader Dashboard">
                <PageHeader
                    title="Reader Dashboard"
                    subtitle="Your activity, borrowings and fine status."
                    right={
                        <Stack
                            direction="row"
                            spacing={1}
                            sx={{ flexWrap: "wrap" }}
                        >
                            <Button
                                component={Link}
                                href="/books"
                                variant="outlined"
                                sx={{
                                    borderRadius: R.xl,
                                    borderColor: borderSoft,
                                    "&:hover": {
                                        borderColor: alpha(
                                            theme.palette.primary.main,
                                            0.45
                                        ),
                                    },
                                }}
                            >
                                Browse Books
                            </Button>
                            <Button
                                component={Link}
                                href="/reader/fines"
                                variant="contained"
                                sx={{
                                    borderRadius: R.xl,
                                    boxShadow: "none",
                                    "&:hover": { boxShadow: "none" },
                                }}
                            >
                                View Fines
                            </Button>
                        </Stack>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: R.lg }}>
                        {error}
                    </Alert>
                ) : null}

                {/* Stat row */}
                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: "repeat(3, 1fr)",
                        },
                        gap: 2,
                    }}
                >
                    <StatCard
                        loading={loading}
                        title="Active Borrowings"
                        value={stats.activeBorrows}
                        chips={[
                            {
                                label: `${stats.overdueBorrows} overdue`,
                                tone: stats.overdueBorrows ? "danger" : "ok",
                            },
                        ]}
                        action={{ label: "Open", href: "/reader/borrows" }}
                    />

                    <StatCard
                        loading={loading}
                        title="Unpaid / Pending Fines"
                        value={stats.unpaidFinesCount}
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
                        loading={loading}
                        title="Membership"
                        value={membershipValue}
                        subtitle={membershipSubtitle}
                        chips={[membershipChip]}
                        action={{
                            label: "View Plans",
                            href: "/reader/membership",
                        }}
                    />
                </Box>

                {/* Lower row */}
                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
                        gap: 2,
                    }}
                >
                    <Paper variant="outlined" sx={surface}>
                        <Box sx={{ p: 2.25 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                Quick Actions
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Useful shortcuts
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: borderSoft }} />

                        <Box sx={{ p: 2.25 }}>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, 1fr)",
                                    },
                                    gap: 1.25,
                                }}
                            >
                                <ActionTile
                                    href="/books"
                                    label="Browse Books"
                                    variant="contained"
                                />
                                <ActionTile
                                    href="/announcements"
                                    label="Announcements"
                                    variant="outlined"
                                />
                                <ActionTile
                                    href="/reader/borrows"
                                    label="My Borrowings"
                                    variant="outlined"
                                />
                                <ActionTile
                                    href="/reader/fines"
                                    label="My Fines"
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                    </Paper>

                    <Paper variant="outlined" sx={surface}>
                        <Box sx={{ p: 2.25 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                Status
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Overview
                            </Typography>
                        </Box>

                        <Divider sx={{ borderColor: borderSoft }} />

                        <Box sx={{ p: 2.25, display: "grid", gap: 1 }}>
                            <StatusPill
                                label={`Active borrows: ${stats.activeBorrows}`}
                                tone="neutral"
                            />
                            <StatusPill
                                label={`Overdue: ${stats.overdueBorrows}`}
                                tone={stats.overdueBorrows ? "danger" : "ok"}
                            />
                            <StatusPill
                                label={`Unpaid fines: ${
                                    stats.unpaidFinesCount
                                } (${money(stats.unpaidTotal)})`}
                                tone={stats.unpaidFinesCount ? "warn" : "ok"}
                            />
                            <StatusPill
                                label={`Pending receipts: ${stats.pendingApprovals}`}
                                tone={stats.pendingApprovals ? "warn" : "ok"}
                            />
                        </Box>
                    </Paper>
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

function ActionTile({ href, label, variant }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );

    return (
        <Button
            component={Link}
            href={href}
            variant={variant}
            fullWidth
            sx={{
                justifyContent: "space-between",
                borderRadius: R.lg,
                py: 1.2,
                px: 1.6,
                boxShadow: "none",
                borderColor: variant === "outlined" ? borderSoft : undefined,
                "&:hover": { boxShadow: "none" },
            }}
        >
            {label}
            <Box component="span" sx={{ opacity: 0.75 }}>
                →
            </Box>
        </Button>
    );
}

function StatusPill({ label, tone = "neutral" }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const map = {
        neutral: {
            bg: alpha(isDark ? "#FFFFFF" : "#0F1115", isDark ? 0.06 : 0.04),
            fg: "text.primary",
            border: alpha(isDark ? "#FFFFFF" : "#0F1115", 0.1),
        },
        ok: {
            bg: alpha(theme.palette.success.main, isDark ? 0.18 : 0.12),
            fg: theme.palette.success.main,
            border: alpha(theme.palette.success.main, 0.28),
        },
        warn: {
            bg: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.1),
            fg: theme.palette.primary.main,
            border: alpha(theme.palette.primary.main, 0.26),
        },
        danger: {
            bg: alpha(theme.palette.error.main, isDark ? 0.18 : 0.12),
            fg: theme.palette.error.main,
            border: alpha(theme.palette.error.main, 0.3),
        },
    };

    const t = map[tone] || map.neutral;

    return (
        <Chip
            label={label}
            sx={{
                height: 34,
                borderRadius: "999px",
                fontWeight: 850,
                bgcolor: t.bg,
                color: t.fg,
                border: `1px solid ${t.border}`,
                justifyContent: "flex-start",
                "& .MuiChip-label": { px: 1.25 },
            }}
            variant="filled"
        />
    );
}

function StatCard({ loading, title, value, subtitle, chips = [], action }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const tones = {
        ok: {
            bg: alpha(theme.palette.success.main, isDark ? 0.18 : 0.12),
            fg: theme.palette.success.main,
            border: alpha(theme.palette.success.main, 0.28),
        },
        warn: {
            bg: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.1),
            fg: theme.palette.primary.main,
            border: alpha(theme.palette.primary.main, 0.26),
        },
        danger: {
            bg: alpha(theme.palette.error.main, isDark ? 0.18 : 0.12),
            fg: theme.palette.error.main,
            border: alpha(theme.palette.error.main, 0.3),
        },
        neutral: {
            bg: alpha(isDark ? "#FFFFFF" : "#0F1115", isDark ? 0.06 : 0.04),
            fg: "text.primary",
            border: alpha(isDark ? "#FFFFFF" : "#0F1115", 0.1),
        },
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: R.xl,
                overflow: "hidden",
                borderColor: borderSoft,
                background: isDark
                    ? `linear-gradient(180deg, ${alpha(
                          "#FFFFFF",
                          0.05
                      )} 0%, ${alpha("#FFFFFF", 0.02)} 100%)`
                    : "#FFFFFF",
                boxShadow: "none",
            }}
        >
            <Box
                sx={{
                    p: 2.25,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        sx={{ fontWeight: 900, letterSpacing: "-0.01em" }}
                        noWrap
                    >
                        {title}
                    </Typography>
                    {subtitle ? (
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                            noWrap
                        >
                            {subtitle}
                        </Typography>
                    ) : null}
                </Box>

                <Typography
                    sx={{
                        fontWeight: 950,
                        fontSize: 30,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {loading ? "…" : value}
                </Typography>
            </Box>

            <Divider sx={{ borderColor: borderSoft }} />

            <Box
                sx={{
                    p: 2.0,
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                {chips.map((c) => {
                    const t = tones[c.tone] || tones.neutral;
                    return (
                        <Chip
                            key={c.label}
                            label={c.label}
                            sx={{
                                height: 30,
                                borderRadius: "999px",
                                fontWeight: 850,
                                bgcolor: t.bg,
                                color: t.fg,
                                border: `1px solid ${t.border}`,
                                "& .MuiChip-label": { px: 1.1 },
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
                        sx={{
                            borderRadius: "999px",
                            px: 1.8,
                            borderColor: alpha(theme.palette.primary.main, 0.4),
                            color: "primary.main",
                            "&:hover": {
                                borderColor: alpha(
                                    theme.palette.primary.main,
                                    0.65
                                ),
                                backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.1 : 0.06
                                ),
                            },
                        }}
                    >
                        {action.label}
                    </Button>
                ) : null}
            </Box>
        </Paper>
    );
}

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
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";

import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";

/** ✅ stop MUI "multiply radius" surprises */
const R = {
    card: "14px",
    soft: "12px",
    btn: "12px",
    chip: "999px",
};

// ---- small helpers ----
function StatCard({ title, value, subtitle, chips = [], actions = [] }) {
    const tones = {
        ok: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        warn: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        danger: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        neutral: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };

    return (
        <Paper
            variant="outlined"
            sx={{ borderRadius: R.card, overflow: "hidden", minWidth: 0 }}
        >
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    minWidth: 0,
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 900 }} noWrap>
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
                        fontWeight: 900,
                        fontSize: 26,
                        whiteSpace: "nowrap",
                    }}
                >
                    {value}
                </Typography>
            </Box>

            <Divider />

            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    alignItems: "center",
                    minWidth: 0,
                }}
            >
                {chips.map((c) => {
                    const t = tones[c.tone] || tones.neutral;
                    return (
                        <Chip
                            key={c.label}
                            label={c.label}
                            sx={{
                                borderRadius: R.chip,
                                fontWeight: 900,
                                backgroundColor: t.bg,
                                color: t.fg,
                            }}
                        />
                    );
                })}

                <Box sx={{ flex: 1, minWidth: 0 }} />

                {actions.map((a) => (
                    <Button
                        key={a.href}
                        component={Link}
                        href={a.href}
                        variant={a.variant || "outlined"}
                        sx={{ borderRadius: R.btn }}
                    >
                        {a.label}
                    </Button>
                ))}
            </Box>
        </Paper>
    );
}

/** ✅ PKR everywhere */
function money(n) {
    const v = Number(n || 0);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "PKR",
        }).format(v);
    } catch {
        return `PKR ${v.toFixed(2)}`;
    }
}

function safeDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

export default function DashboardPage() {
    const { supabase } = useAuth();

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [stats, setStats] = React.useState({
        totalBooks: 0,
        outOfStock: 0,
        activeBorrows: 0,
        overdueBorrows: 0,
        openFinesCount: 0,
        openFinesAmount: 0,
        paymentsPending: 0,
        subsPending: 0,
        membersTotal: 0,
        ordersPending: 0,
        recentPayments: [],
    });

    const load = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        setError("");

        try {
            // ---- BOOKS ----
            const [
                { count: totalBooks, error: e1 },
                { count: outOfStock, error: e2 },
            ] = await Promise.all([
                supabase
                    .from("books")
                    .select("id", { count: "exact", head: true }),
                supabase
                    .from("books")
                    .select("id", { count: "exact", head: true })
                    .eq("stock_available", 0),
            ]);
            if (e1) throw e1;
            if (e2) throw e2;

            // ---- BORROWS ----
            const [
                { count: activeBorrows, error: e3 },
                { count: overdueBorrows, error: e4 },
            ] = await Promise.all([
                supabase
                    .from("borrows")
                    .select("id", { count: "exact", head: true })
                    .in("status", ["Borrowed", "Overdue"]),
                supabase
                    .from("borrows")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "Overdue"),
            ]);
            if (e3) throw e3;
            if (e4) throw e4;

            // ---- FINES ----
            const { data: fines, error: e5 } = await supabase
                .from("fines")
                .select("id, amount, amount_paid, status");
            if (e5) throw e5;

            const openFines = (fines || []).filter((f) =>
                ["Unpaid", "Partially Paid"].includes(f.status)
            );
            const openFinesAmount = openFines.reduce((sum, f) => {
                const due = Math.max(
                    Number(f.amount || 0) - Number(f.amount_paid || 0),
                    0
                );
                return sum + due;
            }, 0);

            // ---- PAYMENTS (receipt inbox) ----
            const [
                { count: paymentsPending, error: e6 },
                { count: subsPending, error: e7 },
            ] = await Promise.all([
                supabase
                    .from("payment_receipts")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "Pending"),
                supabase
                    .from("subscriptions")
                    .select("id", { count: "exact", head: true })
                    .eq("status", "Pending"),
            ]);
            if (e6) throw e6;
            if (e7) throw e7;

            // ---- MEMBERS ----
            const { count: membersTotal, error: e8 } = await supabase
                .from("profiles")
                .select("id", { count: "exact", head: true });
            if (e8) throw e8;

            // ---- ORDERS ----
            const { count: ordersPending, error: e9 } = await supabase
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("status", "Pending");
            if (e9) throw e9;

            // ---- RECENT PAYMENTS (last 5) ----
            const { data: recentPayments, error: e10 } = await supabase
                .from("payment_receipts")
                .select(
                    "id, payer_id, entity_type, entity_id, amount, status, submitted_at"
                )
                .order("submitted_at", { ascending: false })
                .limit(5);
            if (e10) throw e10;

            setStats({
                totalBooks: totalBooks || 0,
                outOfStock: outOfStock || 0,
                activeBorrows: activeBorrows || 0,
                overdueBorrows: overdueBorrows || 0,
                openFinesCount: openFines.length,
                openFinesAmount,
                paymentsPending: paymentsPending || 0,
                subsPending: subsPending || 0,
                membersTotal: membersTotal || 0,
                ordersPending: ordersPending || 0,
                recentPayments: recentPayments || [],
            });
        } catch (err) {
            setError(err?.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AppShell title="Dashboard">
                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                    <PageHeader
                        title="Admin Dashboard"
                        subtitle="High-level operations overview."
                        right={
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Button
                                    component={Link}
                                    href="/payments"
                                    variant="contained"
                                    sx={{ borderRadius: R.btn }}
                                >
                                    Payments Inbox
                                </Button>
                                <Button
                                    component={Link}
                                    href="/orders"
                                    variant="outlined"
                                    sx={{ borderRadius: R.btn }}
                                >
                                    Orders
                                </Button>
                                <Button
                                    component={Link}
                                    href="/admin/branches"
                                    variant="outlined"
                                    sx={{ borderRadius: R.btn }}
                                >
                                    Branches
                                </Button>
                            </Box>
                        }
                    />

                    {loading ? (
                        <Paper
                            variant="outlined"
                            sx={{ borderRadius: R.card, p: 4 }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                }}
                            >
                                <CircularProgress size={22} />
                                <Typography sx={{ fontWeight: 900 }}>
                                    Loading…
                                </Typography>
                            </Box>
                        </Paper>
                    ) : error ? (
                        <Alert severity="error" sx={{ borderRadius: R.soft }}>
                            {error}
                        </Alert>
                    ) : (
                        <>
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        lg: "repeat(3, 1fr)",
                                    },
                                    gap: 2,
                                    minWidth: 0,
                                }}
                            >
                                <StatCard
                                    title="Books"
                                    value={stats.totalBooks}
                                    subtitle="Catalog health"
                                    chips={[
                                        {
                                            label: `${stats.outOfStock} out of stock`,
                                            tone: stats.outOfStock
                                                ? "danger"
                                                : "ok",
                                        },
                                    ]}
                                    actions={[
                                        { label: "Browse", href: "/books" },
                                        {
                                            label: "Manage",
                                            href: "/admin/books",
                                            variant: "contained",
                                        },
                                    ]}
                                />

                                <StatCard
                                    title="Borrowings"
                                    value={stats.activeBorrows}
                                    subtitle="Active + overdue"
                                    chips={[
                                        {
                                            label: `${stats.overdueBorrows} overdue`,
                                            tone: stats.overdueBorrows
                                                ? "danger"
                                                : "ok",
                                        },
                                    ]}
                                    actions={[
                                        {
                                            label: "Desk",
                                            href: "/desk",
                                            variant: "contained",
                                        },
                                    ]}
                                />

                                <StatCard
                                    title="Open Fines"
                                    value={stats.openFinesCount}
                                    subtitle="Unpaid / partial"
                                    chips={[
                                        {
                                            label: `Outstanding ${money(
                                                stats.openFinesAmount
                                            )}`,
                                            tone: stats.openFinesAmount
                                                ? "warn"
                                                : "ok",
                                        },
                                    ]}
                                    actions={[
                                        {
                                            label: "Payments",
                                            href: "/payments",
                                            variant: "contained",
                                        },
                                    ]}
                                />
                            </Box>

                            <Box
                                sx={{
                                    mt: 2,
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        lg: "1fr 420px",
                                    },
                                    gap: 2,
                                    alignItems: "start",
                                    minWidth: 0,
                                }}
                            >
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: R.card,
                                        overflow: "hidden",
                                        minWidth: 0,
                                    }}
                                >
                                    <Box sx={{ p: 2 }}>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            Recent Payments
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                mt: 0.25,
                                            }}
                                        >
                                            Latest receipt submissions
                                        </Typography>
                                    </Box>
                                    <Divider />

                                    <List dense sx={{ minWidth: 0 }}>
                                        {stats.recentPayments.length ? (
                                            stats.recentPayments.map((p) => (
                                                <ListItem
                                                    key={p.id}
                                                    sx={{ minWidth: 0 }}
                                                    secondaryAction={
                                                        <Button
                                                            size="small"
                                                            component={Link}
                                                            href="/payments"
                                                            variant="outlined"
                                                            sx={{
                                                                borderRadius:
                                                                    R.btn,
                                                            }}
                                                        >
                                                            Review
                                                        </Button>
                                                    }
                                                >
                                                    <ListItemText
                                                        sx={{ minWidth: 0 }}
                                                        primary={
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 900,
                                                                }}
                                                                noWrap
                                                            >
                                                                {p.entity_type}{" "}
                                                                •{" "}
                                                                {String(
                                                                    p.entity_id
                                                                ).slice(0, 8)}
                                                                …
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "text.secondary",
                                                                }}
                                                                noWrap
                                                            >
                                                                {money(
                                                                    p.amount
                                                                )}{" "}
                                                                • {p.status} •{" "}
                                                                {safeDateTime(
                                                                    p.submitted_at
                                                                )}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))
                                        ) : (
                                            <Box sx={{ p: 2 }}>
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                >
                                                    No recent payments
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    Receipts will appear here
                                                    once submitted.
                                                </Typography>
                                            </Box>
                                        )}
                                    </List>
                                </Paper>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gap: 2,
                                        minWidth: 0,
                                    }}
                                >
                                    <StatCard
                                        title="Pending Receipt Approvals"
                                        value={stats.paymentsPending}
                                        subtitle="Needs review"
                                        chips={[
                                            {
                                                label: "Go to inbox",
                                                tone: stats.paymentsPending
                                                    ? "warn"
                                                    : "ok",
                                            },
                                        ]}
                                        actions={[
                                            {
                                                label: "Open Inbox",
                                                href: "/payments",
                                                variant: "contained",
                                            },
                                        ]}
                                    />

                                    <StatCard
                                        title="Pending Subscriptions"
                                        value={stats.subsPending}
                                        subtitle="Awaiting approval (payment)"
                                        chips={[
                                            {
                                                label: "Review memberships",
                                                tone: stats.subsPending
                                                    ? "warn"
                                                    : "ok",
                                            },
                                        ]}
                                        actions={[
                                            {
                                                label: "Members",
                                                href: "/members",
                                                variant: "outlined",
                                            },
                                        ]}
                                    />

                                    <StatCard
                                        title="Members"
                                        value={stats.membersTotal}
                                        subtitle="All profiles"
                                        chips={[
                                            {
                                                label: "Manage users",
                                                tone: "neutral",
                                            },
                                        ]}
                                        actions={[
                                            {
                                                label: "Members",
                                                href: "/members",
                                                variant: "contained",
                                            },
                                        ]}
                                    />

                                    <StatCard
                                        title="Orders Pending"
                                        value={stats.ordersPending}
                                        subtitle="Awaiting receiving/cancel"
                                        chips={[
                                            {
                                                label: "Track orders",
                                                tone: stats.ordersPending
                                                    ? "warn"
                                                    : "ok",
                                            },
                                        ]}
                                        actions={[
                                            {
                                                label: "Orders",
                                                href: "/orders",
                                                variant: "contained",
                                            },
                                        ]}
                                    />
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

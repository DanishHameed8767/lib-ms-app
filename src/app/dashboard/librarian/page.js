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

const pillBtnSx = { borderRadius: "999px" }; // ✅ only buttons
const pillChipSx = { borderRadius: 999, fontWeight: 900 }; // ✅ chips like your ref

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
            sx={{ borderRadius: "24px", overflow: "hidden" }}
        >
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

            <Box
                sx={{
                    p: 2,
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
                                ...pillChipSx,
                                backgroundColor: t.bg,
                                color: t.fg,
                            }}
                        />
                    );
                })}
                <Box sx={{ flex: 1 }} />
                {actions.map((a) => (
                    <Button
                        key={a.href}
                        component={Link}
                        href={a.href}
                        variant={a.variant || "outlined"}
                        sx={pillBtnSx}
                    >
                        {a.label}
                    </Button>
                ))}
            </Box>
        </Paper>
    );
}

function formatDateISO(d) {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function LibrarianDashboardPage() {
    const { supabase } = useAuth();

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [stats, setStats] = React.useState({
        activeBorrows: 0,
        overdueBorrows: 0,
        borrowsToday: 0,
        returnsToday: 0,
        paymentsPending: 0,
        ordersPending: 0,
        lowStock: [],
        recentBorrows: [],
    });

    const load = React.useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        setError("");

        try {
            const today = formatDateISO(new Date());

            const [
                { count: activeBorrows, error: e1 },
                { count: overdueBorrows, error: e2 },
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
            if (e1) throw e1;
            if (e2) throw e2;

            const [
                { count: borrowsToday, error: e3 },
                { count: returnsToday, error: e4 },
            ] = await Promise.all([
                supabase
                    .from("borrows")
                    .select("id", { count: "exact", head: true })
                    .eq("start_date", today),
                supabase
                    .from("borrows")
                    .select("id", { count: "exact", head: true })
                    .eq("return_date", today),
            ]);
            if (e3) throw e3;
            if (e4) throw e4;

            const { count: paymentsPending, error: e5 } = await supabase
                .from("payment_receipts")
                .select("id", { count: "exact", head: true })
                .eq("status", "Pending");
            if (e5) throw e5;

            const { count: ordersPending, error: e6 } = await supabase
                .from("orders")
                .select("id", { count: "exact", head: true })
                .eq("status", "Pending");
            if (e6) throw e6;

            const { data: lowStock, error: e7 } = await supabase
                .from("books")
                .select("id, title, stock_available, stock_total")
                .lte("stock_available", 2)
                .order("stock_available", { ascending: true })
                .limit(6);
            if (e7) throw e7;

            const { data: recentBorrows, error: e8 } = await supabase
                .from("borrows")
                .select(
                    `
          id,
          status,
          start_date,
          due_date,
          reader_id,
          books:book_id ( title )
        `
                )
                .order("start_date", { ascending: false })
                .limit(6);
            if (e8) throw e8;

            setStats({
                activeBorrows: activeBorrows || 0,
                overdueBorrows: overdueBorrows || 0,
                borrowsToday: borrowsToday || 0,
                returnsToday: returnsToday || 0,
                paymentsPending: paymentsPending || 0,
                ordersPending: ordersPending || 0,
                lowStock: lowStock || [],
                recentBorrows: recentBorrows || [],
            });
        } catch (err) {
            setError(err?.message || "Failed to load librarian dashboard");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    return (
        <RoleGuard allowedRoles={[ROLES.LIBRARIAN, ROLES.ADMIN]}>
            <AppShell title="Librarian Dashboard">
                <PageHeader
                    title="Librarian Dashboard"
                    subtitle="Daily desk flow: borrows, returns, orders, and approvals."
                    right={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                                component={Link}
                                href="/borrows"
                                variant="contained"
                                sx={pillBtnSx}
                            >
                                Desk
                            </Button>
                            <Button
                                component={Link}
                                href="/payments"
                                variant="outlined"
                                sx={pillBtnSx}
                            >
                                Payments
                            </Button>
                            <Button
                                component={Link}
                                href="/orders"
                                variant="outlined"
                                sx={pillBtnSx}
                            >
                                Orders
                            </Button>
                        </Box>
                    }
                />

                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: "24px", p: 4 }}
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
                    <Alert severity="error" sx={{ borderRadius: "20px" }}>
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
                            }}
                        >
                            <StatCard
                                title="Today"
                                value={`${stats.borrowsToday} / ${stats.returnsToday}`}
                                subtitle="Borrows / Returns"
                                chips={[
                                    {
                                        label: `${stats.overdueBorrows} overdue total`,
                                        tone: stats.overdueBorrows
                                            ? "danger"
                                            : "ok",
                                    },
                                ]}
                                actions={[
                                    {
                                        label: "Open Desk",
                                        href: "/desk",
                                        variant: "contained",
                                    },
                                ]}
                            />

                            <StatCard
                                title="Active Borrowings"
                                value={stats.activeBorrows}
                                subtitle="Borrowed + overdue"
                                chips={[
                                    {
                                        label: `${stats.overdueBorrows} overdue`,
                                        tone: stats.overdueBorrows
                                            ? "danger"
                                            : "ok",
                                    },
                                ]}
                                actions={[
                                    { label: "Members", href: "/members" },
                                ]}
                            />

                            <StatCard
                                title="Approvals"
                                value={stats.paymentsPending}
                                subtitle="Receipts pending review"
                                chips={[
                                    {
                                        label: `${stats.ordersPending} orders pending`,
                                        tone: stats.ordersPending
                                            ? "warn"
                                            : "ok",
                                    },
                                ]}
                                actions={[
                                    {
                                        label: "Payments Inbox",
                                        href: "/payments",
                                        variant: "contained",
                                    },
                                    { label: "Orders", href: "/orders" },
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
                            }}
                        >
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: "24px",
                                    overflow: "hidden",
                                }}
                            >
                                <Box sx={{ p: 2 }}>
                                    <Typography sx={{ fontWeight: 900 }}>
                                        Recent Borrow Activity
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.25,
                                        }}
                                    >
                                        Latest borrow records (title + due date)
                                    </Typography>
                                </Box>
                                <Divider />

                                {stats.recentBorrows?.length ? (
                                    <List dense>
                                        {stats.recentBorrows.map((b) => {
                                            const title =
                                                b?.books?.title || "—";
                                            const chip =
                                                b.status === "Overdue"
                                                    ? {
                                                          bg: "rgba(231,76,60,0.15)",
                                                          fg: "#e74c3c",
                                                      }
                                                    : b.status === "Borrowed"
                                                    ? {
                                                          bg: "rgba(46,204,113,0.15)",
                                                          fg: "#2ecc71",
                                                      }
                                                    : {
                                                          bg: "rgba(160,160,160,0.18)",
                                                          fg: "text.secondary",
                                                      };

                                            return (
                                                <ListItem
                                                    key={b.id}
                                                    secondaryAction={
                                                        <Button
                                                            size="small"
                                                            component={Link}
                                                            href="/desk"
                                                            variant="outlined"
                                                            sx={pillBtnSx}
                                                        >
                                                            Open
                                                        </Button>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: 1,
                                                                    flexWrap:
                                                                        "wrap",
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 900,
                                                                    }}
                                                                    noWrap
                                                                >
                                                                    {title}
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={
                                                                        b.status
                                                                    }
                                                                    sx={{
                                                                        ...pillChipSx,
                                                                        backgroundColor:
                                                                            chip.bg,
                                                                        color: chip.fg,
                                                                    }}
                                                                />
                                                            </Box>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "text.secondary",
                                                                }}
                                                            >
                                                                Borrow #
                                                                {String(
                                                                    b.id
                                                                ).slice(0, 8)}
                                                                … • Start{" "}
                                                                {b.start_date} •
                                                                Due {b.due_date}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                ) : (
                                    <Box sx={{ p: 2 }}>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            No recent borrows
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                mt: 0.5,
                                            }}
                                        >
                                            Borrow activity will appear here.
                                        </Typography>
                                    </Box>
                                )}

                                <Divider />

                                <Box
                                    sx={{
                                        p: 1.5,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        Tip: Use Desk for borrow/return.
                                    </Typography>
                                    <Button
                                        component={Link}
                                        href="/desk"
                                        variant="contained"
                                        sx={pillBtnSx}
                                    >
                                        Go to Desk
                                    </Button>
                                </Box>
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: "24px",
                                    overflow: "hidden",
                                }}
                            >
                                <Box sx={{ p: 2 }}>
                                    <Typography sx={{ fontWeight: 900 }}>
                                        Low Stock Alerts
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.25,
                                        }}
                                    >
                                        Titles with ≤ 2 available
                                    </Typography>
                                </Box>
                                <Divider />

                                {stats.lowStock?.length ? (
                                    <List dense>
                                        {stats.lowStock.map((b) => {
                                            const avail = Number(
                                                b.stock_available || 0
                                            );
                                            const isOut = avail === 0;
                                            return (
                                                <ListItem
                                                    key={b.id}
                                                    secondaryAction={
                                                        <Button
                                                            size="small"
                                                            component={Link}
                                                            href={`/books/${b.id}`}
                                                            variant="outlined"
                                                            sx={pillBtnSx}
                                                        >
                                                            View
                                                        </Button>
                                                    }
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                {b.title}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "text.secondary",
                                                                }}
                                                            >
                                                                Available:{" "}
                                                                {
                                                                    b.stock_available
                                                                }
                                                                /{b.stock_total}
                                                            </Typography>
                                                        }
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            isOut
                                                                ? "Out"
                                                                : "Low"
                                                        }
                                                        sx={{
                                                            ...pillChipSx,
                                                            backgroundColor:
                                                                isOut
                                                                    ? "rgba(231,76,60,0.15)"
                                                                    : "rgba(255,106,61,0.15)",
                                                            color: isOut
                                                                ? "#e74c3c"
                                                                : "primary.main",
                                                            mr: 1,
                                                        }}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                ) : (
                                    <Box sx={{ p: 2 }}>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            All good
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: "text.secondary",
                                                mt: 0.5,
                                            }}
                                        >
                                            No low-stock titles right now.
                                        </Typography>
                                    </Box>
                                )}

                                <Divider />

                                <Box
                                    sx={{
                                        p: 1.5,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        Create an order when stock is low.
                                    </Typography>
                                    <Button
                                        component={Link}
                                        href="/orders"
                                        variant="outlined"
                                        sx={pillBtnSx}
                                    >
                                        Orders
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    </>
                )}
            </AppShell>
        </RoleGuard>
    );
}

"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Paper,
    Divider,
    Chip,
    Button,
    Avatar,
    Tabs,
    Tab,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Alert,
    CircularProgress,
} from "@mui/material";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatMoney(amount) {
    const n = Number(amount || 0);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
        }).format(n);
    } catch {
        return `$${n.toFixed(2)}`;
    }
}

function formatDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function StatusChip({ status }) {
    const map = {
        Borrowed: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        Overdue: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        Returned: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
        Lost: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        Damaged: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
    };
    const s = map[status] || map.Borrowed;
    return (
        <Chip
            size="small"
            label={status}
            sx={{
                borderRadius: "999px",
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

export default function MemberDetailsPage() {
    const { supabase } = useAuth();
    const params = useParams();
    const username = String(params?.username || "");

    const [tab, setTab] = React.useState(0); // 0 Active, 1 History

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [member, setMember] = React.useState(null);

    const [subs, setSubs] = React.useState([]);
    const [activeSub, setActiveSub] = React.useState(null);
    const [activePlan, setActivePlan] = React.useState(null);

    const [borrows, setBorrows] = React.useState([]);
    const [receipts, setReceipts] = React.useState([]);

    const load = React.useCallback(async () => {
        if (!supabase || !username) return;

        setLoading(true);
        setError("");

        try {
            // 1) Profile by username
            const { data: p, error: pErr } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, address, contact_number, role, is_active, created_at"
                )
                .eq("username", username)
                .maybeSingle();

            if (pErr) throw pErr;
            if (!p) throw new Error("Member not found");

            setMember(p);

            // 2) Subscriptions history
            const { data: s, error: sErr } = await supabase
                .from("subscriptions")
                .select(
                    "id, plan_id, plan_name, status, start_date, end_date, amount_paid, created_at"
                )
                .eq("reader_id", p.id)
                .order("end_date", { ascending: false })
                .limit(50);

            if (sErr) throw sErr;
            const subsList = s || [];
            setSubs(subsList);

            const today = isoDate();
            const active = subsList.find(
                (x) =>
                    x.status === "Active" && String(x.end_date || "") >= today
            );
            setActiveSub(active || null);

            // 3) Active plan details (borrow_limit etc.)
            if (active?.plan_id) {
                const { data: mp, error: mpErr } = await supabase
                    .from("membership_plans")
                    .select(
                        "id, name, price, borrow_limit, borrow_duration_days, fine_amount_per_day, grace_period_days, is_active"
                    )
                    .eq("id", active.plan_id)
                    .maybeSingle();

                if (!mpErr) setActivePlan(mp || null);
                else setActivePlan(null);
            } else {
                setActivePlan(null);
            }

            // 4) Borrows (with book + branch)
            const { data: b, error: bErr } = await supabase
                .from("borrows")
                .select(
                    `
                    id,
                    status,
                    start_date,
                    due_date,
                    return_date,
                    renewal_count,
                    book_id,
                    branch_id,
                    books:books ( id, title, isbn ),
                    branches:library_branches ( id, name )
                `
                )
                .eq("reader_id", p.id)
                .order("start_date", { ascending: false })
                .limit(500);

            if (bErr) throw bErr;
            setBorrows(b || []);

            // 5) Receipt payments history for this member
            const { data: r, error: rErr } = await supabase
                .from("payment_receipts")
                .select(
                    "id, entity_type, entity_id, amount, status, submitted_at, reviewed_at, review_note"
                )
                .eq("payer_id", p.id)
                .order("submitted_at", { ascending: false })
                .limit(50);

            if (rErr) throw rErr;
            setReceipts(r || []);
        } catch (e) {
            setError(e?.message || "Failed to load member");
        } finally {
            setLoading(false);
        }
    }, [supabase, username]);

    React.useEffect(() => {
        load();
    }, [load]);

    const activeRows = React.useMemo(() => {
        return (borrows || []).filter(
            (b) =>
                (b.status === "Borrowed" || b.status === "Overdue") &&
                !b.return_date
        );
    }, [borrows]);

    const historyRows = React.useMemo(() => {
        return (borrows || []).filter((b) => !activeRows.includes(b));
    }, [borrows, activeRows]);

    const unpaidFinesHint = React.useMemo(() => {
        // We’re not loading fines here yet (optional), but you can show a hint from receipts:
        const pendingFineReceipts = (receipts || []).filter(
            (x) => x.entity_type === "Fine" && x.status === "Pending"
        ).length;
        return pendingFineReceipts;
    }, [receipts]);

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
            <AppShell title="Member Details">
                <PageHeader
                    title="Member Details"
                    subtitle={member?.username ? `@${member.username}` : "@—"}
                    right={
                        <>
                            <Button
                                component={Link}
                                href="/borrows"
                                variant="outlined"
                                sx={{ borderRadius: "20px" }}
                            >
                                Open Issues
                            </Button>
                            <Button
                                variant="contained"
                                sx={{ borderRadius: "20px" }}
                                onClick={() =>
                                    alert("Edit member: coming next")
                                }
                                disabled
                            >
                                Edit Member
                            </Button>
                        </>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                ) : null}

                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{ mt: 2, p: 3, borderRadius: "24px" }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.25,
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography sx={{ fontWeight: 900 }}>
                                Loading member…
                            </Typography>
                        </Box>
                    </Paper>
                ) : !member ? null : (
                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
                            gap: 2,
                            alignItems: "start",
                        }}
                    >
                        {/* Main column */}
                        <Box sx={{ display: "grid", gap: 2 }}>
                            {/* Profile header */}
                            <Card sx={{ borderRadius: "24px" }}>
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
                                        {String(
                                            member.full_name ||
                                                member.username ||
                                                "U"
                                        )
                                            .split(" ")
                                            .map((x) => x?.[0])
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .join("")}
                                    </Avatar>

                                    <Box sx={{ flex: 1 }}>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 900 }}
                                        >
                                            {member.full_name || "—"}
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            @{member.username} •{" "}
                                            {member.contact_number || "—"}
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1,
                                                flexWrap: "wrap",
                                                mt: 1.25,
                                            }}
                                        >
                                            <Chip
                                                size="small"
                                                label={
                                                    activeSub
                                                        ? `${activeSub.plan_name} Plan`
                                                        : "No active plan"
                                                }
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 900,
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    activeSub
                                                        ? `Expires ${activeSub.end_date}`
                                                        : "Borrowing locked"
                                                }
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 900,
                                                }}
                                            />
                                            <Chip
                                                size="small"
                                                label={`Borrow ${
                                                    activeRows.length
                                                }/${
                                                    activePlan?.borrow_limit ??
                                                    "—"
                                                }`}
                                                sx={{ borderRadius: 2 }}
                                            />
                                            {unpaidFinesHint > 0 ? (
                                                <Chip
                                                    size="small"
                                                    label={`${unpaidFinesHint} pending fine receipt(s)`}
                                                    sx={{
                                                        borderRadius: 2,
                                                        fontWeight: 900,
                                                        backgroundColor:
                                                            "rgba(255,106,61,0.15)",
                                                        color: "primary.main",
                                                    }}
                                                />
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    label="No pending fine receipts"
                                                    sx={{
                                                        borderRadius: 2,
                                                        fontWeight: 900,
                                                        backgroundColor:
                                                            "rgba(46,204,113,0.15)",
                                                        color: "#2ecc71",
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Box>

                                    <Button
                                        variant="outlined"
                                        sx={{ borderRadius: "20px" }}
                                        onClick={() =>
                                            alert(
                                                "Disable/Enable: implement later (admin-only update)"
                                            )
                                        }
                                        disabled
                                    >
                                        {member.is_active === false
                                            ? "Enable"
                                            : "Disable"}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Stats cards */}
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "repeat(3, 1fr)",
                                    },
                                    gap: 2,
                                }}
                            >
                                <StatCard
                                    title="Active Borrows"
                                    value={String(activeRows.length)}
                                    sub="Current loans"
                                />
                                <StatCard
                                    title="Overdue"
                                    value={String(
                                        activeRows.filter(
                                            (x) => x.status === "Overdue"
                                        ).length
                                    )}
                                    sub="Needs attention"
                                />
                                <StatCard
                                    title="Subscriptions"
                                    value={String(subs.length)}
                                    sub="History"
                                />
                            </Box>

                            {/* Borrows table */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    borderRadius: "24px",
                                    overflow: "hidden",
                                }}
                            >
                                <Box sx={{ p: 1.25 }}>
                                    <Tabs
                                        value={tab}
                                        onChange={(_, v) => setTab(v)}
                                        sx={{
                                            minHeight: 40,
                                            "& .MuiTab-root": {
                                                minHeight: 40,
                                                borderRadius: "20px",
                                                textTransform: "none",
                                                fontWeight: 900,
                                            },
                                        }}
                                    >
                                        <Tab label="Borrowed" />
                                        <Tab label="History" />
                                    </Tabs>
                                </Box>

                                <Divider />

                                <Box sx={{ overflowX: "auto" }}>
                                    <Table size="small" sx={{ minWidth: 960 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Borrow ID</TableCell>
                                                <TableCell>Book</TableCell>
                                                <TableCell>Branch</TableCell>
                                                <TableCell>Start</TableCell>
                                                <TableCell>Due</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">
                                                    Actions
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>
                                            {(tab === 0
                                                ? activeRows
                                                : historyRows
                                            ).map((b) => (
                                                <TableRow key={b.id} hover>
                                                    <TableCell
                                                        sx={{ fontWeight: 900 }}
                                                    >
                                                        {String(b.id).slice(
                                                            0,
                                                            8
                                                        )}
                                                        …
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{ fontWeight: 900 }}
                                                    >
                                                        {b.books?.title || "—"}
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                            }}
                                                        >
                                                            ISBN:{" "}
                                                            {b.books?.isbn ||
                                                                "—"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {b.branches?.name ||
                                                            "—"}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {b.start_date || "—"}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {b.due_date || "—"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip
                                                            status={b.status}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                gap: 1,
                                                                justifyContent:
                                                                    "flex-end",
                                                            }}
                                                        >
                                                            {tab === 0 ? (
                                                                <>
                                                                    <Button
                                                                        size="small"
                                                                        variant="contained"
                                                                        sx={{
                                                                            borderRadius:
                                                                                "20px",
                                                                        }}
                                                                        component={
                                                                            Link
                                                                        }
                                                                        href="/borrows"
                                                                    >
                                                                        Return
                                                                        (via
                                                                        Borrows)
                                                                    </Button>
                                                                    <Button
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{
                                                                            borderRadius:
                                                                                "20px",
                                                                        }}
                                                                        component={
                                                                            Link
                                                                        }
                                                                        href="/borrows"
                                                                    >
                                                                        Renew
                                                                        (via
                                                                        Borrows)
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        borderRadius:
                                                                            "20px",
                                                                    }}
                                                                >
                                                                    View
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}

                                            {(tab === 0
                                                ? activeRows
                                                : historyRows
                                            ).length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={7}
                                                        sx={{ py: 6 }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                No records
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "text.secondary",
                                                                    mt: 0.5,
                                                                }}
                                                            >
                                                                Nothing to show
                                                                here.
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ) : null}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Paper>
                        </Box>

                        {/* Right rail */}
                        <Box sx={{ display: "grid", gap: 2 }}>
                            <Card sx={{ borderRadius: "24px" }}>
                                <CardContent>
                                    <Typography sx={{ fontWeight: 900 }}>
                                        Payment History
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.5,
                                        }}
                                    >
                                        Receipt submissions & approvals
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ display: "grid", gap: 1 }}>
                                        {receipts.length === 0 ? (
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                No receipts found.
                                            </Typography>
                                        ) : (
                                            receipts.slice(0, 6).map((p) => (
                                                <Paper
                                                    key={p.id}
                                                    variant="outlined"
                                                    sx={{
                                                        p: 1.25,
                                                        borderRadius: "20px",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: 2,
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography
                                                                sx={{
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                {p.entity_type}{" "}
                                                                •{" "}
                                                                {formatMoney(
                                                                    p.amount
                                                                )}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    color: "text.secondary",
                                                                }}
                                                            >
                                                                {formatDateTime(
                                                                    p.submitted_at
                                                                )}
                                                            </Typography>
                                                            {p.review_note ? (
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: "text.secondary",
                                                                        mt: 0.25,
                                                                    }}
                                                                >
                                                                    Note:{" "}
                                                                    {
                                                                        p.review_note
                                                                    }
                                                                </Typography>
                                                            ) : null}
                                                        </Box>

                                                        <Chip
                                                            size="small"
                                                            label={p.status}
                                                            sx={{
                                                                borderRadius: 2,
                                                                fontWeight: 900,
                                                                backgroundColor:
                                                                    p.status ===
                                                                    "Approved"
                                                                        ? "rgba(46,204,113,0.15)"
                                                                        : p.status ===
                                                                          "Rejected"
                                                                        ? "rgba(231,76,60,0.15)"
                                                                        : "rgba(255,106,61,0.15)",
                                                                color:
                                                                    p.status ===
                                                                    "Approved"
                                                                        ? "#2ecc71"
                                                                        : p.status ===
                                                                          "Rejected"
                                                                        ? "#e74c3c"
                                                                        : "primary.main",
                                                            }}
                                                        />
                                                    </Box>
                                                </Paper>
                                            ))
                                        )}
                                    </Box>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            mt: 2,
                                        }}
                                    >
                                        <Button
                                            component={Link}
                                            href="/payments"
                                            variant="outlined"
                                            sx={{ borderRadius: "20px" }}
                                        >
                                            Open Inbox
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>

                            <Card sx={{ borderRadius: "24px" }}>
                                <CardContent>
                                    <Typography sx={{ fontWeight: 900 }}>
                                        Reservations
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.5,
                                        }}
                                    >
                                        Coming later (not in DB schema yet)
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Box>
                    </Box>
                )}
            </AppShell>
        </RoleGuard>
    );
}

function StatCard({ title, value, sub }) {
    return (
        <Card sx={{ borderRadius: "24px" }}>
            <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {title}
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, mt: 0.5 }}>
                    {value}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.5 }}
                >
                    {sub}
                </Typography>
            </CardContent>
        </Card>
    );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
    Box,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    MenuItem,
    Button,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import RoleGuard from "../../components/RoleGuard";
import { ROLES } from "../../lib/roles";
import { useAuth } from "@/context/AuthContext";

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function RoleChip({ role }) {
    const map = {
        Reader: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        Librarian: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        Staff: { bg: "rgba(52,152,219,0.15)", fg: "#3498db" },
        Administrator: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };
    const s = map[role] || map.Reader;

    return (
        <Chip
            size="small"
            label={role || "Reader"}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

function FineChip({ count }) {
    const danger = Number(count || 0) > 0;
    return (
        <Chip
            size="small"
            label={danger ? `${count} unpaid fine(s)` : "No unpaid fines"}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: danger
                    ? "rgba(231,76,60,0.15)"
                    : "rgba(46,204,113,0.15)",
                color: danger ? "#e74c3c" : "#2ecc71",
            }}
        />
    );
}

export default function MembersPage() {
    const { supabase } = useAuth();

    const [q, setQ] = React.useState("");
    const [plan, setPlan] = React.useState("All");

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const load = React.useCallback(async () => {
        if (!supabase) return;

        setLoading(true);
        setError("");

        try {
            const today = isoDate();

            // 1) Readers (profiles) — "Members" = Readers
            const { data: profiles, error: pErr } = await supabase
                .from("profiles")
                .select(
                    "id, username, full_name, role, contact_number, is_active"
                )
                .eq("role", "Reader")
                .order("created_at", { ascending: false })
                .limit(2000);

            if (pErr) throw pErr;

            const readers = (profiles || []).filter(
                (p) => p.is_active !== false
            );
            const readerIds = readers.map((r) => r.id).filter(Boolean);

            if (!readerIds.length) {
                setRows([]);
                return;
            }

            // 2) Active subscriptions (latest per reader)
            const { data: subs, error: sErr } = await supabase
                .from("subscriptions")
                .select("id, reader_id, plan_id, plan_name, end_date, status")
                .in("reader_id", readerIds)
                .eq("status", "Active")
                .gte("end_date", today)
                .order("end_date", { ascending: false })
                .limit(5000);

            if (sErr) throw sErr;

            const latestSubByReader = new Map();
            for (const s of subs || []) {
                if (!latestSubByReader.has(s.reader_id)) {
                    latestSubByReader.set(s.reader_id, s);
                }
            }

            // 3) Plans (for borrow_limit)
            const planIds = Array.from(
                new Set((subs || []).map((s) => s.plan_id).filter(Boolean))
            );

            const planMap = new Map();
            if (planIds.length) {
                const { data: plans, error: mpErr } = await supabase
                    .from("membership_plans")
                    .select("id, name, borrow_limit")
                    .in("id", planIds);

                if (mpErr) throw mpErr;
                for (const p of plans || []) planMap.set(p.id, p);
            }

            // 4) Active borrows counts
            const { data: borrows, error: bErr } = await supabase
                .from("borrows")
                .select("id, reader_id, status, return_date")
                .in("reader_id", readerIds)
                .in("status", ["Borrowed", "Overdue"])
                .is("return_date", null)
                .limit(5000);

            if (bErr) throw bErr;

            const activeBorrowCountByReader = new Map();
            for (const b of borrows || []) {
                const rid = b.reader_id;
                if (!rid) continue;
                activeBorrowCountByReader.set(
                    rid,
                    (activeBorrowCountByReader.get(rid) || 0) + 1
                );
            }

            // 5) Unpaid fines counts (join to borrows to get reader_id)
            const { data: fines, error: fErr } = await supabase
                .from("fines")
                .select(
                    `
                    id,
                    amount,
                    amount_paid,
                    status,
                    borrow:borrows ( id, reader_id )
                `
                )
                .in("status", ["Unpaid", "Partially Paid"])
                .limit(10000);

            if (fErr) throw fErr;

            const unpaidFinesCountByReader = new Map();
            for (const f of fines || []) {
                const borrow = f.borrow;
                const rid = borrow?.reader_id;
                if (!rid) continue;

                const amount = Number(f.amount || 0);
                const paid = Number(f.amount_paid || 0);
                const outstanding = Math.max(amount - paid, 0);

                if (outstanding > 0) {
                    unpaidFinesCountByReader.set(
                        rid,
                        (unpaidFinesCountByReader.get(rid) || 0) + 1
                    );
                }
            }

            // 6) Build UI rows
            const list = readers.map((r) => {
                const sub = latestSubByReader.get(r.id) || null;
                const planObj = sub?.plan_id ? planMap.get(sub.plan_id) : null;

                const planName = sub?.plan_name || "No plan";
                const planExpires = sub?.end_date || "—";
                const borrowLimit =
                    typeof planObj?.borrow_limit === "number"
                        ? planObj.borrow_limit
                        : planObj?.borrow_limit ?? "—";

                return {
                    id: r.id,
                    fullName: r.full_name || "—",
                    username: r.username || "—",
                    contact: r.contact_number || "—",
                    role: r.role || "Reader",

                    planName,
                    planExpires,
                    borrowLimit,

                    activeBorrows: activeBorrowCountByReader.get(r.id) || 0,
                    unpaidFinesCount: unpaidFinesCountByReader.get(r.id) || 0,
                };
            });

            setRows(list);
        } catch (e) {
            setError(e?.message || "Failed to load members");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    // Plan dropdown options from currently loaded rows
    const plans = React.useMemo(() => {
        const set = new Set(rows.map((r) => r.planName).filter(Boolean));
        return [
            "All",
            ...Array.from(set.values()).sort((a, b) => a.localeCompare(b)),
        ];
    }, [rows]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();

        return rows.filter((r) => {
            const matchesQuery =
                !query ||
                String(r.fullName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(r.username || "")
                    .toLowerCase()
                    .includes(query) ||
                String(r.contact || "")
                    .toLowerCase()
                    .includes(query);

            const matchesPlan = plan === "All" ? true : r.planName === plan;

            return matchesQuery && matchesPlan;
        });
    }, [rows, q, plan]);

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
            <AppShell title="Members">
                <PageHeader
                    title="Members"
                    subtitle="Search members and view membership details."
                    right={
                        <Button
                            variant="contained"
                            startIcon={<PersonAddAltOutlinedIcon />}
                            sx={{ borderRadius: 3 }}
                            onClick={() => alert("Add Member: coming next")}
                        >
                            Add Member
                        </Button>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
                ) : null}

                <Paper
                    variant="outlined"
                    sx={{
                        mt: 2,
                        p: 1.25,
                        borderRadius: 4,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <TextField
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name / username / contact…"
                        sx={{ width: { xs: "100%", sm: 420 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ flex: 1 }} />

                    <TextField
                        select
                        label="Plan"
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                        disabled={loading}
                    >
                        {plans.map((p) => (
                            <MenuItem key={p} value={p}>
                                {p}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 3 }}
                        onClick={() => alert("Export: later")}
                    >
                        Export
                    </Button>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 4, overflow: "hidden" }}
                >
                    <Box
                        sx={{
                            p: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 900 }}>
                                All Members ({loading ? "…" : filtered.length})
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                Live data • Readers only
                            </Typography>
                        </Box>

                        {loading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <CircularProgress size={18} />
                                <Typography sx={{ fontWeight: 800 }}>
                                    Loading…
                                </Typography>
                            </Box>
                        ) : null}
                    </Box>

                    <Divider />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 980 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Member</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Plan</TableCell>
                                    <TableCell>Borrow limit</TableCell>
                                    <TableCell>Active borrows</TableCell>
                                    <TableCell>Fines</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {filtered.map((r) => (
                                    <TableRow key={r.id} hover>
                                        <TableCell>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                {r.fullName}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                @{r.username} • {r.contact}
                                            </Typography>
                                        </TableCell>

                                        <TableCell>
                                            <RoleChip role={r.role} />
                                        </TableCell>

                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={`${r.planName} • exp ${r.planExpires}`}
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 900,
                                                }}
                                            />
                                        </TableCell>

                                        <TableCell>{r.borrowLimit}</TableCell>

                                        <TableCell sx={{ fontWeight: 900 }}>
                                            {r.activeBorrows}
                                        </TableCell>

                                        <TableCell>
                                            <FineChip
                                                count={r.unpaidFinesCount}
                                            />
                                        </TableCell>

                                        <TableCell align="right">
                                            <Button
                                                component={Link}
                                                href={`/members/${r.username}`}
                                                size="small"
                                                variant="contained"
                                                sx={{ borderRadius: 3 }}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {!loading && filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: "center" }}>
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                >
                                                    No members found
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    Try another search query or
                                                    plan filter.
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </Box>
                </Paper>
            </AppShell>
        </RoleGuard>
    );
}

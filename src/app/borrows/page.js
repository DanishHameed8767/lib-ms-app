"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Button,
    TextField,
    InputAdornment,
    MenuItem,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import BorrowCreateDialog from "@/components/BorrowCreateDialog";
import {
    fetchActiveBorrows,
    returnBorrow,
    renewBorrowOnce,
} from "@/lib/supabase/staffBorrowApi";

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
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

export default function StaffBorrowsPage() {
    const { supabase } = useAuth();

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [openCreate, setOpenCreate] = React.useState(false);

    const [q, setQ] = React.useState("");
    const [filter, setFilter] = React.useState("All");

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase) {
                if (!silent) setLoading(false);
                return;
            }
            if (!silent) setLoading(true);
            setError("");
            try {
                const data = await fetchActiveBorrows(supabase, { limit: 200 });
                setRows(data);
            } catch (e) {
                setError(e?.message || "Failed to load borrows");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [supabase]
    );

    React.useEffect(() => {
        let alive = true;

        (async () => {
            if (!alive) return;
            await load({ silent: false });
        })();

        const onVisible = () => {
            if (document.visibilityState === "visible") load({ silent: true });
        };
        const onFocus = () => load({ silent: true });

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);

        return () => {
            alive = false;
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [load]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        return rows.filter((b) => {
            const matchesQuery =
                !query ||
                String(b.id || "")
                    .toLowerCase()
                    .includes(query) ||
                String(b.books?.title || "")
                    .toLowerCase()
                    .includes(query) ||
                String(b.profiles?.username || "")
                    .toLowerCase()
                    .includes(query) ||
                String(b.profiles?.full_name || "")
                    .toLowerCase()
                    .includes(query);

            const matchesFilter = filter === "All" ? true : b.status === filter;
            return matchesQuery && matchesFilter;
        });
    }, [rows, q, filter]);

    async function actReturn(borrowId, branchId, status) {
        try {
            await returnBorrow({ supabase, borrowId, branchId, status });
            await load({ silent: false });
        } catch (e) {
            alert(e?.message || "Action failed");
        }
    }

    async function actRenew(borrowId) {
        try {
            await renewBorrowOnce({ supabase, borrowId });
            await load({ silent: false });
        } catch (e) {
            alert(e?.message || "Renew failed");
        }
    }

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
            <AppShell title="Borrows">
                <PageHeader
                    title="Borrows"
                    subtitle="Borrow/return on behalf of readers (physical library)."
                    right={
                        <Button
                            variant="contained"
                            startIcon={<AddOutlinedIcon />}
                            sx={{ borderRadius: 3 }}
                            onClick={() => setOpenCreate(true)}
                        >
                            Create Borrow
                        </Button>
                    }
                />

                {error ? (
                    <Paper
                        variant="outlined"
                        sx={{ mt: 2, p: 2, borderRadius: 4 }}
                    >
                        <Typography
                            sx={{ fontWeight: 900, color: "error.main" }}
                        >
                            {error}
                        </Typography>
                    </Paper>
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
                        placeholder="Search borrow ID / reader / title…"
                        sx={{ width: { xs: "100%", sm: 520 } }}
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
                        label="Status"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                    >
                        {["All", "Borrowed", "Overdue"].map((s) => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Chip
                        label={`${loading ? "…" : filtered.length} item(s)`}
                        sx={{ borderRadius: 3, fontWeight: 900 }}
                        variant="outlined"
                    />
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 4, overflow: "hidden" }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Active Borrows
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Uses triggers for due date, stock, fines and
                            operating-hours rules.
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 1200 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Borrow ID</TableCell>
                                    <TableCell>Reader</TableCell>
                                    <TableCell>Book</TableCell>
                                    <TableCell>Branch</TableCell>
                                    <TableCell>Start</TableCell>
                                    <TableCell>Due</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Renewals</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {(loading
                                    ? Array.from({ length: 6 })
                                    : filtered
                                ).map((b, idx) => {
                                    if (loading) {
                                        return (
                                            <TableRow key={`sk-${idx}`}>
                                                <TableCell
                                                    colSpan={9}
                                                    sx={{ py: 2 }}
                                                >
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: 3,
                                                            height: 42,
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    const readerLabel = b.profiles
                                        ? `${b.profiles.full_name} (@${b.profiles.username})`
                                        : "—";

                                    return (
                                        <TableRow key={b.id} hover>
                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {b.id}
                                            </TableCell>
                                            <TableCell>{readerLabel}</TableCell>
                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {b.books?.title || "—"}
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    ISBN: {b.books?.isbn || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {b.library_branches?.name ||
                                                    "—"}
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.start_date || "—"}
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.due_date || "—"}
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={b.status} />
                                            </TableCell>
                                            <TableCell>
                                                {b.renewal_count ?? 0}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        justifyContent:
                                                            "flex-end",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 3 }}
                                                        onClick={() =>
                                                            actRenew(b.id)
                                                        }
                                                    >
                                                        Renew
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{ borderRadius: 3 }}
                                                        onClick={() =>
                                                            actReturn(
                                                                b.id,
                                                                b.branch_id,
                                                                "Returned"
                                                            )
                                                        }
                                                    >
                                                        Return
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 3 }}
                                                        onClick={() =>
                                                            actReturn(
                                                                b.id,
                                                                b.branch_id,
                                                                "Lost"
                                                            )
                                                        }
                                                    >
                                                        Lost
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 3 }}
                                                        onClick={() =>
                                                            actReturn(
                                                                b.id,
                                                                b.branch_id,
                                                                "Damaged"
                                                            )
                                                        }
                                                    >
                                                        Damaged
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {!loading && filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: "center" }}>
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                >
                                                    No results
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    Try another search or
                                                    filter.
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </TableBody>
                        </Table>
                    </Box>
                </Paper>

                <BorrowCreateDialog
                    open={openCreate}
                    onClose={() => setOpenCreate(false)}
                    supabase={supabase}
                    onCreated={() => load({ silent: false })}
                />
            </AppShell>
        </RoleGuard>
    );
}

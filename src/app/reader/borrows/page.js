"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchMyBorrows } from "@/lib/supabase/readerApi";
import {
    Box,
    Paper,
    Typography,
    Divider,
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
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";

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

export default function ReaderBorrowsPage() {
    const { supabase, user } = useAuth();
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const mapBorrowToUi = React.useCallback((b) => {
        return {
            id: b.id,
            status: b.status,
            startDate: b.start_date || "",
            dueDate: b.due_date || "",
            returnDate: b.return_date || null,
            bookTitle: b.books?.title || "—",
            branchName: b.branches?.name || "",
            _raw: b,
        };
    }, []);

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase || !user?.id) {
                if (!silent) setLoading(false);
                return;
            }

            if (!silent) setLoading(true);
            setError("");

            try {
                const data = await fetchMyBorrows(supabase, user.id);
                setRows((data || []).map(mapBorrowToUi));
            } catch (e) {
                setError(e?.message || "Failed to load borrows");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [supabase, user?.id, mapBorrowToUi]
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

    const [q, setQ] = React.useState("");
    const [filter, setFilter] = React.useState("All");

    const filtered = rows.filter((b) => {
        const query = q.trim().toLowerCase();
        const matchesQuery =
            !query ||
            String(b.bookTitle || "")
                .toLowerCase()
                .includes(query) ||
            String(b.id || "")
                .toLowerCase()
                .includes(query);
        const matchesFilter = filter === "All" ? true : b.status === filter;
        return matchesQuery && matchesFilter;
    });

    return (
        <RoleGuard allowedRoles={[ROLES.READER]}>
            <AppShell title="My Borrowings">
                <PageHeader
                    title="My Borrowings"
                    subtitle="Track what you borrowed and due dates."
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
                        placeholder="Search borrow ID / title…"
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
                        label="Status"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                    >
                        {[
                            "All",
                            "Borrowed",
                            "Overdue",
                            "Returned",
                            "Lost",
                            "Damaged",
                        ].map((s) => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </TextField>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 4, overflow: "hidden" }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Borrowings ({loading ? "…" : filtered.length})
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Live via `borrows` (RLS: reader can view own)
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 960 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Borrow ID</TableCell>
                                    <TableCell>Book</TableCell>
                                    <TableCell>Start</TableCell>
                                    <TableCell>Due</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Returned</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {(loading
                                    ? Array.from({ length: 6 })
                                    : filtered
                                ).map((b, idx) =>
                                    loading ? (
                                        <TableRow key={`sk-${idx}`}>
                                            <TableCell
                                                colSpan={6}
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
                                    ) : (
                                        <TableRow key={b.id} hover>
                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {b.id}
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {b.bookTitle}
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.startDate}
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.dueDate}
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={b.status} />
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.returnDate || "—"}
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}

                                {!loading && filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ py: 6 }}>
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
            </AppShell>
        </RoleGuard>
    );
}

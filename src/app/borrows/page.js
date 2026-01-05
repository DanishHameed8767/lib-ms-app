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

/** ✅ consistent radius (no MUI multiplier surprises) */
const R = {
    card: "14px",
    soft: "12px",
    btn: "12px",
    chip: "999px",
};

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
            label={status || "—"}
            sx={{
                borderRadius: R.chip,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

function MonoId({ value }) {
    const v = String(value || "");
    if (!v) return "—";
    return (
        <Typography
            component="span"
            sx={{
                fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontWeight: 800,
                display: "inline-block",
                maxWidth: 260,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "bottom",
            }}
            title={v}
        >
            {v}
        </Typography>
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
                setRows(Array.isArray(data) ? data : []);
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
        return (rows || []).filter((b) => {
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
            window.alert(e?.message || "Action failed");
        }
    }

    async function actRenew(borrowId) {
        try {
            await renewBorrowOnce({ supabase, borrowId });
            await load({ silent: false });
        } catch (e) {
            window.alert(e?.message || "Renew failed");
        }
    }

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
            <AppShell title="Borrows">
                {/* ✅ prevent page-level overflow */}
                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                    <PageHeader
                        title="Borrows"
                        subtitle="Borrow/return on behalf of readers (physical library)."
                        right={
                            <Button
                                variant="contained"
                                startIcon={<AddOutlinedIcon />}
                                sx={{ borderRadius: R.btn }}
                                onClick={() => setOpenCreate(true)}
                            >
                                Create Borrow
                            </Button>
                        }
                    />

                    {error ? (
                        <Paper
                            variant="outlined"
                            sx={{ mt: 2, p: 2, borderRadius: R.card }}
                        >
                            <Typography
                                sx={{ fontWeight: 900, color: "error.main" }}
                            >
                                {error}
                            </Typography>
                        </Paper>
                    ) : null}

                    {/* Filters */}
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            p: 1.25,
                            borderRadius: R.card,
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            alignItems: "center",
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search borrow ID / reader / title…"
                            sx={{ width: { xs: "100%", md: 520 }, minWidth: 0 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ flex: 1, minWidth: 0 }} />

                        <TextField
                            select
                            label="Status"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            sx={{ width: { xs: "100%", sm: 220 }, minWidth: 0 }}
                        >
                            {["All", "Borrowed", "Overdue"].map((s) => (
                                <MenuItem key={s} value={s}>
                                    {s}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Chip
                            label={`${loading ? "…" : filtered.length} item(s)`}
                            sx={{ borderRadius: R.chip, fontWeight: 900 }}
                            variant="outlined"
                        />
                    </Paper>

                    {/* Table */}
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            borderRadius: R.card,
                            overflow: "hidden",
                            minWidth: 0,
                        }}
                    >
                        <Box sx={{ p: 2, minWidth: 0 }}>
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

                        {/* ✅ contain wide tables without pushing page */}
                        <Box sx={{ width: "100%", overflowX: "auto" }}>
                            <Table
                                size="small"
                                sx={{
                                    minWidth: 1100,
                                    "& th": {
                                        whiteSpace: "nowrap",
                                        fontWeight: 900,
                                    },
                                    "& td": { verticalAlign: "top" },
                                }}
                            >
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
                                        <TableCell align="right">
                                            Actions
                                        </TableCell>
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
                                                                borderRadius:
                                                                    R.soft,
                                                                height: 42,
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        }

                                        const fullName =
                                            b.profiles?.full_name || "";
                                        const uname =
                                            b.profiles?.username || "";
                                        const readerLabel =
                                            fullName && uname
                                                ? `${fullName} (@${uname})`
                                                : fullName ||
                                                  (uname ? `@${uname}` : "—");

                                        return (
                                            <TableRow key={b.id} hover>
                                                <TableCell>
                                                    <MonoId value={b.id} />
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        minWidth: 220,
                                                        maxWidth: 320,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 800,
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                        title={readerLabel}
                                                    >
                                                        {readerLabel}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        minWidth: 260,
                                                        maxWidth: 420,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 900,
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                        title={
                                                            b.books?.title ||
                                                            "—"
                                                        }
                                                    >
                                                        {b.books?.title || "—"}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                        title={
                                                            b.books?.isbn || ""
                                                        }
                                                    >
                                                        ISBN:{" "}
                                                        {b.books?.isbn || "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell
                                                    sx={{ minWidth: 180 }}
                                                >
                                                    <Typography
                                                        sx={{
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                        title={
                                                            b.library_branches
                                                                ?.name || "—"
                                                        }
                                                    >
                                                        {b.library_branches
                                                            ?.name || "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {b.start_date || "—"}
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {b.due_date || "—"}
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip
                                                        status={b.status}
                                                    />
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
                                                            sx={{
                                                                borderRadius:
                                                                    R.btn,
                                                            }}
                                                            onClick={() =>
                                                                actRenew(b.id)
                                                            }
                                                        >
                                                            Renew
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            sx={{
                                                                borderRadius:
                                                                    R.btn,
                                                            }}
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
                                                            sx={{
                                                                borderRadius:
                                                                    R.btn,
                                                            }}
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
                                                            sx={{
                                                                borderRadius:
                                                                    R.btn,
                                                            }}
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
                                            <TableCell
                                                colSpan={9}
                                                sx={{ py: 6 }}
                                            >
                                                <Box
                                                    sx={{ textAlign: "center" }}
                                                >
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
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

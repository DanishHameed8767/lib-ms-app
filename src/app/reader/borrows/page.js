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
    Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

function StatusChip({ status }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const map = {
        Borrowed: { c: theme.palette.success.main },
        Overdue: { c: theme.palette.error.main },
        Returned: { c: theme.palette.text.secondary },
        Lost: { c: theme.palette.error.main },
        Damaged: { c: theme.palette.error.main },
    };

    const color = map[status]?.c ?? theme.palette.primary.main;

    return (
        <Chip
            size="small"
            label={status || "—"}
            sx={{
                height: 28,
                borderRadius: "999px",
                fontWeight: 850,
                bgcolor: alpha(color, isDark ? 0.18 : 0.12),
                color: status === "Returned" ? "text.secondary" : color,
                border: `1px solid ${alpha(color, 0.28)}`,
                "& .MuiChip-label": { px: 1.1 },
            }}
        />
    );
}

export default function ReaderBorrowsPage() {
    const { supabase, user } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const hoverBg = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.04 : 0.035
    );

    const surfaceCard = {
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

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const mapBorrowToUi = React.useCallback((b) => {
        return {
            id: shortId(b.id),
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
                        sx={{ mt: 2, ...surfaceCard, p: 2.25 }}
                    >
                        <Typography
                            sx={{ fontWeight: 950, color: "error.main" }}
                        >
                            {error}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                            Try refreshing the page.
                        </Typography>
                    </Paper>
                ) : null}

                {/* Filter Bar (capsule style like /books) */}
                <Paper
                    variant="outlined"
                    sx={{
                        mt: 2,
                        p: 1,
                        borderRadius: "999px",
                        borderColor: borderSoft,
                        background: alpha(
                            isDark ? "#0F1115" : "#FFFFFF",
                            isDark ? 0.35 : 0.65
                        ),
                        backdropFilter: "blur(10px)",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
                        gap: 1,
                        alignItems: "center",
                    }}
                >
                    <TextField
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search borrow ID / title…"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "999px",
                                backgroundColor: alpha(
                                    isDark ? "#FFFFFF" : "#0F1115",
                                    isDark ? 0.04 : 0.03
                                ),
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: borderSoft,
                            },
                        }}
                    />

                    <TextField
                        select
                        label="Status"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{
                            width: { xs: "100%", md: 220 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "999px",
                            },
                        }}
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

                {/* Table */}
                <Paper variant="outlined" sx={{ mt: 2, ...surfaceCard }}>
                    <Box
                        sx={{
                            p: 2.25,
                            display: "flex",
                            alignItems: "baseline",
                            gap: 1,
                            flexWrap: "wrap",
                        }}
                    >
                        <Typography
                            sx={{ fontWeight: 950, letterSpacing: "-0.01em" }}
                        >
                            Borrowings ({loading ? "…" : filtered.length})
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Live from <code>borrows</code>
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <Chip
                            size="small"
                            label={
                                filter === "All"
                                    ? "All statuses"
                                    : `Status: ${filter}`
                            }
                            sx={{
                                height: 28,
                                borderRadius: "999px",
                                fontWeight: 850,
                                bgcolor: alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.14 : 0.1
                                ),
                                color: "primary.main",
                                border: `1px solid ${alpha(
                                    theme.palette.primary.main,
                                    0.22
                                )}`,
                            }}
                        />
                    </Box>

                    <Divider sx={{ borderColor: borderSoft }} />

                    <Box
                        sx={{
                            width: "100%",
                            maxWidth: "100%",
                            overflowX: "auto",
                        }}
                    >
                        <Table
                            size="small"
                            sx={{
                                width: "100%",
                                tableLayout: "fixed",
                                minWidth: 760, // small enough for most screens
                            }}
                        >
                            <TableHead>
                                <TableRow
                                    sx={{
                                        "& th": {
                                            fontWeight: 900,
                                            color: "text.secondary",
                                        },
                                    }}
                                >
                                    <TableCell sx={{ width: 240 }}>
                                        Borrow ID
                                    </TableCell>
                                    <TableCell sx={{ width: 260 }}>
                                        Book
                                    </TableCell>
                                    <TableCell sx={{ width: 200 }}>
                                        Branch
                                    </TableCell>
                                    <TableCell sx={{ width: 120 }}>
                                        Start
                                    </TableCell>
                                    <TableCell sx={{ width: 120 }}>
                                        Due
                                    </TableCell>
                                    <TableCell sx={{ width: 120 }}>
                                        Status
                                    </TableCell>
                                    <TableCell sx={{ width: 140 }}>
                                        Returned
                                    </TableCell>
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
                                                colSpan={7}
                                                sx={{ py: 1.6 }}
                                            >
                                                <Paper
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: R.lg,
                                                        height: 44,
                                                        borderColor: borderSoft,
                                                        background: alpha(
                                                            isDark
                                                                ? "#FFFFFF"
                                                                : "#0F1115",
                                                            isDark ? 0.03 : 0.02
                                                        ),
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow
                                            key={b.id}
                                            hover
                                            sx={{
                                                "&:hover": {
                                                    backgroundColor: hoverBg,
                                                },
                                                "& td": {
                                                    borderColor: borderSoft,
                                                },
                                            }}
                                        >
                                            <TableCell
                                                sx={{
                                                    fontWeight: 950,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                <Tooltip title={b.id} arrow>
                                                    {shortId(b.id)}
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 900,
                                                    minWidth: 280,
                                                }}
                                            >
                                                {b.bookTitle}
                                            </TableCell>
                                            <TableCell
                                                sx={{ color: "text.secondary" }}
                                            >
                                                {b.branchName || "—"}
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.startDate || "—"}
                                            </TableCell>
                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.dueDate || "—"}
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
                                        <TableCell colSpan={7} sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: "center" }}>
                                                <Typography
                                                    sx={{ fontWeight: 950 }}
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

function shortId(id) {
    const s = String(id || "");
    if (s.length <= 14) return s;
    return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

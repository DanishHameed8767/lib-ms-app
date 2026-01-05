"use client";

import * as React from "react";
import { useAuth } from "@/context/AuthContext";
import {
    fetchMyFines,
    fetchMyFineReceipts,
    attachLatestReceiptToFines,
    uploadReceiptAndCreatePayment,
} from "@/lib/supabase/readerApi";
import Link from "next/link";
import {
    Box,
    Paper,
    Typography,
    Divider,
    TextField,
    InputAdornment,
    MenuItem,
    Button,
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
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import UploadReceiptDialog from "../../../components/UploadReceiptDialog";

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

function moneyPKR(n) {
    const v = Number(n || 0);
    // PKR formatting (works even if locale isn't Pakistan)
    return v.toLocaleString(undefined, { style: "currency", currency: "PKR" });
}

function shortId(id) {
    const s = String(id || "");
    if (s.length <= 14) return s;
    return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function PillChip({ label, tone = "neutral" }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const tones = {
        neutral: {
            c: alpha(isDark ? "#FFFFFF" : "#0F1115", isDark ? 0.75 : 0.65),
        },
        warn: { c: theme.palette.primary.main },
        ok: { c: theme.palette.success.main },
        danger: { c: theme.palette.error.main },
    };

    const c = tones[tone]?.c || theme.palette.primary.main;

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                height: 28,
                borderRadius: "999px",
                fontWeight: 850,
                bgcolor: alpha(c, isDark ? 0.18 : 0.12),
                color: tone === "neutral" ? "text.secondary" : c,
                border: `1px solid ${alpha(c, 0.28)}`,
                "& .MuiChip-label": { px: 1.1 },
            }}
        />
    );
}

function FineStatusChip({ status }) {
    if (!status) return <PillChip label="—" tone="neutral" />;

    if (status === "Paid") return <PillChip label="Paid" tone="ok" />;
    if (status === "Waived") return <PillChip label="Waived" tone="neutral" />;
    if (status === "Partially Paid")
        return <PillChip label="Partially Paid" tone="warn" />;
    return <PillChip label="Unpaid" tone="warn" />;
}

function ApprovalChip({ status }) {
    if (!status) return <PillChip label="—" tone="neutral" />;

    if (status === "Approved") return <PillChip label="Approved" tone="ok" />;
    if (status === "Rejected")
        return <PillChip label="Rejected" tone="danger" />;
    if (status === "Cancelled")
        return <PillChip label="Cancelled" tone="neutral" />;
    return <PillChip label="Pending" tone="warn" />;
}

export default function ReaderFinesPage() {
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
        minWidth: 0,
    };

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const mapFineRowToUi = React.useCallback((f) => {
        const latest = f.latestReceipt || null;
        const receiptFileName = latest?.receipt_path
            ? latest.receipt_path.split("/").pop()
            : "";

        return {
            id: f.id,
            borrowId: f.borrow_id,
            fineType: f.fine_type,
            amount: Number(f.amount || 0),
            amountPaid: Number(f.amount_paid || 0),
            dueDate: f.due_date,
            status: f.status,

            payment: latest
                ? {
                      receiptFileName,
                      approvalStatus: latest.status,
                      reviewerNote: latest.review_note || "",
                      receiptPath: latest.receipt_path,
                  }
                : null,

            latestReceipt: latest,
            _raw: f,
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
                const [fines, receipts] = await Promise.all([
                    fetchMyFines(supabase, user.id),
                    fetchMyFineReceipts(supabase, user.id),
                ]);

                const merged = attachLatestReceiptToFines(fines, receipts);
                setRows(merged.map(mapFineRowToUi));
            } catch (e) {
                setError(e?.message || "Failed to load fines");
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [supabase, user?.id, mapFineRowToUi]
    );

    React.useEffect(() => {
        (async () => {
            await load({ silent: false });
        })();

        const onVisible = () => {
            if (document.visibilityState === "visible") load({ silent: true });
        };
        const onFocus = () => load({ silent: true });

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);

        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [load]);

    const [q, setQ] = React.useState("");
    const [filter, setFilter] = React.useState("All");

    const [openUpload, setOpenUpload] = React.useState(false);
    const [selectedFine, setSelectedFine] = React.useState(null);

    const filtered = rows.filter((f) => {
        const query = q.trim().toLowerCase();
        const matchesQuery =
            !query ||
            String(f.id || "")
                .toLowerCase()
                .includes(query) ||
            String(f.borrowId || "")
                .toLowerCase()
                .includes(query);

        const matchesFilter =
            filter === "All"
                ? true
                : filter === "Needs Payment"
                ? f.status !== "Paid" && f.status !== "Waived"
                : filter === "Pending Approval"
                ? f.payment?.approvalStatus === "Pending"
                : filter === "Rejected"
                ? f.payment?.approvalStatus === "Rejected"
                : filter === "Paid"
                ? f.status === "Paid"
                : true;

        return matchesQuery && matchesFilter;
    });

    const unpaidTotal = rows
        .filter((f) => f.status !== "Paid" && f.status !== "Waived")
        .reduce(
            (sum, f) =>
                sum +
                Math.max(Number(f.amount || 0) - Number(f.amountPaid || 0), 0),
            0
        );

    const openPay = (fine) => {
        setSelectedFine(fine);
        setOpenUpload(true);
    };

    async function handleSubmitReceipt({ fine, file }) {
        const outstanding = Math.max(
            Number(fine.amount || 0) - Number(fine.amountPaid || 0),
            0
        );
        if (outstanding <= 0)
            throw new Error("Nothing outstanding for this fine.");

        if (
            fine.latestReceipt?.status === "Pending" ||
            fine.payment?.approvalStatus === "Pending"
        ) {
            throw new Error("Your last receipt is still pending review.");
        }

        await uploadReceiptAndCreatePayment({
            supabase,
            userId: user.id,
            entityType: "Fine",
            entityId: fine.id,
            amount: outstanding,
            file,
        });

        await load({ silent: false });
    }

    return (
        <RoleGuard allowedRoles={[ROLES.READER]}>
            <AppShell title="My Fines">
                <PageHeader
                    title="My Fines"
                    subtitle="Upload a receipt and wait for approval to clear fines."
                    right={
                        <PillChip
                            label={`Unpaid total: ${moneyPKR(unpaidTotal)}`}
                            tone={unpaidTotal ? "warn" : "ok"}
                        />
                    }
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

                {/* Filter Bar (capsule style) */}
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
                        gridTemplateColumns: { xs: "1fr", lg: "1fr auto auto" },
                        gap: 1,
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    <TextField
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search fine ID / borrow ID…"
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
                        label="Filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{
                            width: { xs: "100%", lg: 260 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "999px",
                            },
                        }}
                    >
                        {[
                            "All",
                            "Needs Payment",
                            "Pending Approval",
                            "Rejected",
                            "Paid",
                        ].map((s) => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        component={Link}
                        href="/policies"
                        variant="outlined"
                        sx={{
                            borderRadius: "999px",
                            px: 2.1,
                            height: 44,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Payment Policy
                    </Button>
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
                            Fines ({loading ? "…" : filtered.length})
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Live from <code>fines</code> +{" "}
                            <code>payment_receipts</code>
                        </Typography>
                        <Box sx={{ flex: 1 }} />
                        <PillChip
                            label={
                                filter === "All"
                                    ? "All filters"
                                    : `Filter: ${filter}`
                            }
                            tone="neutral"
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
                                minWidth: 980, // keeps it compact; scroll stays inside this box
                            }}
                        >
                            <TableHead>
                                <TableRow
                                    sx={{
                                        backgroundColor: alpha(
                                            isDark ? "#FFFFFF" : "#0F1115",
                                            isDark ? 0.03 : 0.02
                                        ),
                                        "& th": {
                                            fontWeight: 900,
                                            color: "text.secondary",
                                        },
                                    }}
                                >
                                    <TableCell sx={{ width: 200 }}>
                                        Fine
                                    </TableCell>
                                    <TableCell sx={{ width: 220 }}>
                                        Borrow
                                    </TableCell>
                                    <TableCell sx={{ width: 160 }}>
                                        Type
                                    </TableCell>
                                    <TableCell sx={{ width: 140 }}>
                                        Amount
                                    </TableCell>
                                    <TableCell sx={{ width: 120 }}>
                                        Due
                                    </TableCell>
                                    <TableCell sx={{ width: 140 }}>
                                        Status
                                    </TableCell>
                                    <TableCell sx={{ width: 220 }}>
                                        Receipt
                                    </TableCell>
                                    <TableCell sx={{ width: 160 }}>
                                        Approval
                                    </TableCell>
                                    <TableCell
                                        sx={{ width: 220 }}
                                        align="right"
                                    >
                                        Action
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {(loading
                                    ? Array.from({ length: 6 })
                                    : filtered
                                ).map((f, idx) => {
                                    if (loading) {
                                        return (
                                            <TableRow key={`sk-${idx}`}>
                                                <TableCell
                                                    colSpan={9}
                                                    sx={{ py: 1.6 }}
                                                >
                                                    <Paper
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: R.lg,
                                                            height: 44,
                                                            borderColor:
                                                                borderSoft,
                                                            background: alpha(
                                                                isDark
                                                                    ? "#FFFFFF"
                                                                    : "#0F1115",
                                                                isDark
                                                                    ? 0.03
                                                                    : 0.02
                                                            ),
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }

                                    const hasPayment = Boolean(
                                        f.payment?.receiptFileName
                                    );
                                    const approval =
                                        f.payment?.approvalStatus || null;

                                    const canUpload =
                                        f.status !== "Paid" &&
                                        f.status !== "Waived" &&
                                        approval !== "Pending";

                                    const outstanding = Math.max(
                                        (f.amount || 0) - (f.amountPaid || 0),
                                        0
                                    );

                                    return (
                                        <TableRow
                                            key={f.id}
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
                                                <Tooltip title={f.id} arrow>
                                                    <span>{shortId(f.id)}</span>
                                                </Tooltip>
                                            </TableCell>

                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                <Tooltip
                                                    title={f.borrowId || ""}
                                                    arrow
                                                >
                                                    <span
                                                        style={{
                                                            fontFamily:
                                                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                                        }}
                                                    >
                                                        {shortId(f.borrowId)}
                                                    </span>
                                                </Tooltip>
                                            </TableCell>

                                            <TableCell
                                                sx={{ color: "text.secondary" }}
                                            >
                                                {f.fineType || "—"}
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    fontWeight: 950,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {moneyPKR(f.amount)}
                                                {outstanding > 0 ? (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            display: "block",
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Due:{" "}
                                                        {moneyPKR(outstanding)}
                                                    </Typography>
                                                ) : null}
                                            </TableCell>

                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {f.dueDate || "—"}
                                            </TableCell>

                                            <TableCell>
                                                <FineStatusChip
                                                    status={f.status}
                                                />
                                            </TableCell>

                                            <TableCell
                                                sx={{ color: "text.secondary" }}
                                            >
                                                {hasPayment ? (
                                                    <Tooltip
                                                        title={
                                                            f.payment
                                                                .receiptFileName
                                                        }
                                                        arrow
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                maxWidth: 190,
                                                                overflow:
                                                                    "hidden",
                                                                textOverflow:
                                                                    "ellipsis",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            {
                                                                f.payment
                                                                    .receiptFileName
                                                            }
                                                        </span>
                                                    </Tooltip>
                                                ) : (
                                                    "—"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <ApprovalChip
                                                    status={approval}
                                                />
                                            </TableCell>

                                            <TableCell align="right">
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "flex-end",
                                                        gap: 1,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {approval === "Rejected" ? (
                                                        <Tooltip
                                                            title={
                                                                f.payment
                                                                    ?.reviewerNote ||
                                                                "—"
                                                            }
                                                            arrow
                                                        >
                                                            <Chip
                                                                icon={
                                                                    <InfoOutlinedIcon />
                                                                }
                                                                label="Note"
                                                                size="small"
                                                                sx={{
                                                                    height: 32,
                                                                    borderRadius:
                                                                        "999px",
                                                                    fontWeight: 850,
                                                                    bgcolor:
                                                                        alpha(
                                                                            theme
                                                                                .palette
                                                                                .error
                                                                                .main,
                                                                            isDark
                                                                                ? 0.16
                                                                                : 0.1
                                                                        ),
                                                                    border: `1px solid ${alpha(
                                                                        theme
                                                                            .palette
                                                                            .error
                                                                            .main,
                                                                        0.25
                                                                    )}`,
                                                                    color: theme
                                                                        .palette
                                                                        .error
                                                                        .main,
                                                                }}
                                                            />
                                                        </Tooltip>
                                                    ) : null}

                                                    <Button
                                                        size="small"
                                                        variant={
                                                            canUpload
                                                                ? "contained"
                                                                : "outlined"
                                                        }
                                                        startIcon={
                                                            <UploadOutlinedIcon />
                                                        }
                                                        sx={{
                                                            borderRadius:
                                                                "999px",
                                                            px: 1.6,
                                                        }}
                                                        disabled={!canUpload}
                                                        onClick={() =>
                                                            openPay(f)
                                                        }
                                                    >
                                                        {approval === "Rejected"
                                                            ? "Re-upload"
                                                            : "Upload receipt"}
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

                <UploadReceiptDialog
                    open={openUpload}
                    onClose={() => setOpenUpload(false)}
                    title={`Upload receipt — ${
                        selectedFine?.id ? shortId(selectedFine.id) : ""
                    }`}
                    amountLabel={
                        selectedFine
                            ? `Outstanding: ${moneyPKR(
                                  Math.max(
                                      (selectedFine.amount || 0) -
                                          (selectedFine.amountPaid || 0),
                                      0
                                  )
                              )}`
                            : ""
                    }
                    onSubmit={async (payload) => {
                        if (!selectedFine) return;
                        await handleSubmitReceipt({
                            fine: selectedFine,
                            file: payload.file,
                        });
                    }}
                />
            </AppShell>
        </RoleGuard>
    );
}

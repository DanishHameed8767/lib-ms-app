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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import UploadReceiptDialog from "../../../components/UploadReceiptDialog";

function money(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function FineStatusChip({ status }) {
    const map = {
        Unpaid: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        "Partially Paid": { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        Paid: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        Waived: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };
    const s = map[status] || map.Unpaid;
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

function ApprovalChip({ status }) {
    if (!status)
        return <Chip size="small" label="—" sx={{ borderRadius: 2 }} />;
    const map = {
        Pending: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        Approved: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        Rejected: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        Cancelled: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };
    const s = map[status] || map.Pending;
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

export default function ReaderFinesPage() {
    const { supabase, user } = useAuth();

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

        // Block if there is already a pending receipt
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
            amount: outstanding, // pay full outstanding by default
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
                        <Chip
                            label={`Unpaid total: ${money(unpaidTotal)}`}
                            sx={{
                                borderRadius: 3,
                                fontWeight: 900,
                                backgroundColor: unpaidTotal
                                    ? "rgba(255,106,61,0.15)"
                                    : "rgba(46,204,113,0.15)",
                            }}
                        />
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
                        placeholder="Search fine ID / borrow ID…"
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
                        label="Filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 260 } }}
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
                        sx={{ borderRadius: 3 }}
                    >
                        Payment Policy
                    </Button>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 4, overflow: "hidden" }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Fines ({loading ? "…" : filtered.length})
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Live via `fines` + `payment_receipts` + Storage
                            bucket `receipts`
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 1100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fine ID</TableCell>
                                    <TableCell>Borrow ID</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Due</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Receipt</TableCell>
                                    <TableCell>Approval</TableCell>
                                    <TableCell align="right">Action</TableCell>
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

                                    const hasPayment = Boolean(
                                        f.payment?.receiptFileName
                                    );
                                    const approval =
                                        f.payment?.approvalStatus || null;
                                    const canUpload =
                                        f.status !== "Paid" &&
                                        f.status !== "Waived" &&
                                        approval !== "Pending";

                                    return (
                                        <TableRow key={f.id} hover>
                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {f.id}
                                            </TableCell>
                                            <TableCell
                                                sx={{ fontFamily: "monospace" }}
                                            >
                                                {f.borrowId}
                                            </TableCell>
                                            <TableCell>{f.fineType}</TableCell>
                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {money(f.amount)}
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
                                            <TableCell>
                                                {hasPayment
                                                    ? f.payment.receiptFileName
                                                    : "—"}
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
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderRadius: 3,
                                                            }}
                                                            onClick={() =>
                                                                alert(
                                                                    `Reviewer note: ${
                                                                        f
                                                                            .payment
                                                                            ?.reviewerNote ||
                                                                        "—"
                                                                    }`
                                                                )
                                                            }
                                                        >
                                                            View note
                                                        </Button>
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
                                                        sx={{ borderRadius: 3 }}
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

                <UploadReceiptDialog
                    open={openUpload}
                    onClose={() => setOpenUpload(false)}
                    title={`Upload receipt — ${selectedFine?.id || ""}`}
                    amountLabel={
                        selectedFine
                            ? `Amount: ${money(selectedFine.amount)}`
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

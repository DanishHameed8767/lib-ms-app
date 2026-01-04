"use client";

import * as React from "react";
import {
    Drawer,
    Box,
    Typography,
    Divider,
    IconButton,
    Chip,
    TextField,
    Button,
    Stack,
    Paper,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ReceiptPreview from "./ReceiptPreview";

/** ---------- formatting helpers ---------- */
function formatMoney(amount) {
    const n = Number(amount || 0);
    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD", // change if needed
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

export default function PaymentReviewDrawer({
    open,
    onClose,
    payment,
    onApprove,
    onReject,
}) {
    const [note, setNote] = React.useState("");
    const [error, setError] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setNote(payment?.note || "");
        setError("");
        setSaving(false);
    }, [payment?.id, payment?.note]);

    if (!payment) return null;

    const canAct = payment.status === "Pending";

    const handleApprove = async () => {
        setError("");
        setSaving(true);
        try {
            await onApprove?.(payment.id, note);
            onClose?.();
        } catch (e) {
            setError(e?.message || "Failed to approve payment.");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!note.trim()) {
            setError("Please add a note when rejecting (required).");
            return;
        }
        setError("");
        setSaving(true);
        try {
            await onReject?.(payment.id, note);
            onClose?.();
        } catch (e) {
            setError(e?.message || "Failed to reject payment.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 520 },
                    borderTopLeftRadius: { xs: 0, sm: 24 },
                    borderBottomLeftRadius: { xs: 0, sm: 24 },
                },
            }}
        >
            <Box
                sx={{
                    p: 2.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Review Payment
                    </Typography>
                    <StatusChip status={payment.status} />
                </Box>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseOutlinedIcon />
                </IconButton>
            </Box>

            <Divider />

            <Box sx={{ p: 2.25, display: "grid", gap: 2 }}>
                {/* Prefer signed URL from Supabase; fallback to path */}
                <ReceiptPreview
                    receiptUrl={payment.receiptUrl || ""}
                    receiptPath={payment.receiptPath || ""}
                />

                <Paper variant="outlined" sx={{ borderRadius: 4, p: 2 }}>
                    <Typography sx={{ fontWeight: 900, mb: 1 }}>
                        Details
                    </Typography>

                    <Stack spacing={1}>
                        <Row
                            label="Entity"
                            value={`${payment.entityType} • ${payment.entityRef}`}
                        />
                        <Row
                            label="Payer"
                            value={`${payment.payerName} (@${payment.payerUsername})`}
                        />
                        <Row
                            label="Amount"
                            value={`${formatMoney(payment.amount)} • ${
                                payment.method || "—"
                            }`}
                        />
                        <Row
                            label="Submitted"
                            value={formatDateTime(payment.submittedAt)}
                        />
                        {payment.reviewedAt ? (
                            <Row
                                label="Reviewed"
                                value={formatDateTime(payment.reviewedAt)}
                            />
                        ) : null}
                        {payment.reviewedBy ? (
                            <Row label="Reviewer" value={payment.reviewedBy} />
                        ) : null}
                    </Stack>
                </Paper>

                <TextField
                    label="Reviewer note"
                    placeholder="Add a note (required on reject)…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    error={Boolean(error)}
                    helperText={error || " "}
                    disabled={!canAct && payment.status !== "Rejected"} // still allow reading note; you can tweak
                />

                <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
                >
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        sx={{ borderRadius: 3 }}
                        disabled={saving}
                    >
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleApprove}
                        sx={{ borderRadius: 3 }}
                        disabled={!canAct || saving}
                    >
                        {saving ? "Saving…" : "Approve"}
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={handleReject}
                        sx={{ borderRadius: 3 }}
                        disabled={!canAct || saving}
                    >
                        {saving ? "Saving…" : "Reject"}
                    </Button>
                </Box>

                {!canAct ? (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                    >
                        This payment is already{" "}
                        {String(payment.status || "").toLowerCase()}. Actions
                        are disabled.
                    </Typography>
                ) : null}
            </Box>
        </Drawer>
    );
}

function Row({ label, value }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{ fontWeight: 800, textAlign: "right" }}
            >
                {value}
            </Typography>
        </Box>
    );
}

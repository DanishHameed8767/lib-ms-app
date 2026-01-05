"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Chip,
    Button,
    TextField,
    Alert,
    CircularProgress,
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";

import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";
import ReceiptPreview from "../../../components/ReceiptPreview";

/** ---------- formatting helpers ---------- */
function money(amount) {
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

function fmtDateTime(ts) {
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
            label={status || "—"}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

async function signedReceiptUrl(supabase, receiptPath) {
    if (!receiptPath) return "";
    const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receiptPath, 60 * 60); // 60 min

    if (error) {
        console.warn("createSignedUrl failed:", error.message);
        return "";
    }
    return data?.signedUrl || "";
}

export default function PaymentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { supabase } = useAuth();

    const idRaw = params?.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw; // safe for Next params

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [payment, setPayment] = React.useState(null);
    const [reviewerNote, setReviewerNote] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!supabase || !id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1) receipt row + payer profile
            const { data: r, error: rErr } = await supabase
                .from("payment_receipts")
                .select(
                    `
          id,
          payer_id,
          entity_type,
          entity_id,
          amount,
          receipt_path,
          status,
          submitted_at,
          review_note,
          reviewed_at,
          reviewed_by,
          payer:profiles!payment_receipts_payer_id_fkey ( id, username, full_name )
        `
                )
                .eq("id", id)
                .single();

            if (rErr) throw rErr;

            // 2) entity ref (fine/subscription)
            let entityRef = r.entity_id
                ? String(r.entity_id).slice(0, 8) + "…"
                : "—";

            if (r.entity_type === "Fine" && r.entity_id) {
                const { data: f, error: fErr } = await supabase
                    .from("fines")
                    .select("id, borrow_id, fine_type, due_date")
                    .eq("id", r.entity_id)
                    .maybeSingle();
                if (fErr) throw fErr;

                entityRef = f?.borrow_id
                    ? `Fine • Borrow ${String(f.borrow_id).slice(0, 8)}…`
                    : `Fine • ${String(r.entity_id).slice(0, 8)}…`;
            }

            if (r.entity_type === "Subscription" && r.entity_id) {
                const { data: s, error: sErr } = await supabase
                    .from("subscriptions")
                    .select("id, plan_name, reader_username")
                    .eq("id", r.entity_id)
                    .maybeSingle();
                if (sErr) throw sErr;

                entityRef = s?.plan_name
                    ? `Sub • ${s.plan_name}`
                    : `Sub • ${String(r.entity_id).slice(0, 8)}…`;
            }

            // 3) signed preview url
            const receiptUrl = await signedReceiptUrl(supabase, r.receipt_path);

            const normalized = {
                id: r.id,
                status: r.status,
                type: r.entity_type, // Fine | Subscription
                entityId: r.entity_id,
                entityRef,
                amount: r.amount,
                method: "Receipt", // schema doesn't store method
                submittedAt: r.submitted_at,
                receiptPath: r.receipt_path,
                receiptUrl,
                memberName: r.payer?.full_name || "—",
                memberUsername: r.payer?.username || "—",
                reviewerNote: r.review_note || "",
                reviewedAt: r.reviewed_at || null,
            };

            setPayment(normalized);
            setReviewerNote(normalized.reviewerNote);
        } catch (e) {
            setError(e?.message || "Failed to load payment");
            setPayment(null);
        } finally {
            setLoading(false);
        }
    }, [supabase, id]);

    React.useEffect(() => {
        load();
    }, [load]);

    const canReview = payment?.status === "Pending";

    const approve = async () => {
        if (!supabase || !payment?.id) return;

        setSaving(true);
        setError("");
        try {
            const { error: uErr } = await supabase
                .from("payment_receipts")
                .update({
                    status: "Approved",
                    review_note: String(reviewerNote || "").trim() || null,
                })
                .eq("id", payment.id);

            if (uErr) throw uErr;

            router.push("/payments");
        } catch (e) {
            setError(e?.message || "Failed to approve payment");
        } finally {
            setSaving(false);
        }
    };

    const reject = async () => {
        if (!supabase || !payment?.id) return;

        if (!String(reviewerNote || "").trim()) {
            setError("Please add a rejection note (required).");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const { error: uErr } = await supabase
                .from("payment_receipts")
                .update({
                    status: "Rejected",
                    review_note: String(reviewerNote || "").trim(),
                })
                .eq("id", payment.id);

            if (uErr) throw uErr;

            router.push("/payments");
        } catch (e) {
            setError(e?.message || "Failed to reject payment");
        } finally {
            setSaving(false);
        }
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF]}>
            <AppShell title="Payment Review">
                <PageHeader
                    title="Review Payment"
                    subtitle={
                        payment ? `${payment.id} • ${payment.type}` : "Payment"
                    }
                    right={
                        <Button
                            component={Link}
                            href="/payments"
                            variant="outlined"
                            startIcon={<ArrowBackOutlinedIcon />}
                            sx={{ borderRadius: 3 }} // ✅ matches your reference
                            disabled={saving}
                        >
                            Back
                        </Button>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
                        {error}
                    </Alert>
                ) : null}

                {loading ? (
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, p: 4, mt: 2 }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography sx={{ fontWeight: 900 }}>
                                Loading…
                            </Typography>
                        </Box>
                    </Paper>
                ) : !payment ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            borderRadius: 4,
                            p: 4,
                            mt: 2,
                            textAlign: "center",
                        }}
                    >
                        <Typography sx={{ fontWeight: 900 }}>
                            Payment not found
                        </Typography>
                        <Button
                            component={Link}
                            href="/payments"
                            variant="contained"
                            sx={{ borderRadius: 3, mt: 2 }} // ✅ matches reference
                        >
                            Back to Inbox
                        </Button>
                    </Paper>
                ) : (
                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "1fr 380px" },
                            gap: 2,
                        }}
                    >
                        {/* Left: receipt + details */}
                        <Paper
                            variant="outlined"
                            sx={{ borderRadius: 4, overflow: "hidden" }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 2,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 900 }}>
                                        Receipt
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.25,
                                        }}
                                    >
                                        Storage path:{" "}
                                        {payment.receiptPath || "—"}
                                    </Typography>
                                </Box>

                                <StatusChip status={payment.status} />
                            </Box>

                            <Divider />

                            {/* Real preview */}
                            <Box sx={{ p: 2 }}>
                                <ReceiptPreview
                                    receiptUrl={payment.receiptUrl || ""}
                                    receiptPath={payment.receiptPath || ""}
                                />
                            </Box>

                            <Divider />

                            <Box sx={{ p: 2, display: "grid", gap: 1 }}>
                                <Row label="Type" value={payment.type} />
                                <Row
                                    label="Entity ID"
                                    value={payment.entityId || "—"}
                                />
                                <Row
                                    label="Amount"
                                    value={money(payment.amount)}
                                />
                                <Row label="Method" value={payment.method} />
                                <Row
                                    label="Submitted"
                                    value={fmtDateTime(payment.submittedAt)}
                                />
                                <Row
                                    label="Member"
                                    value={`${payment.memberName} (@${payment.memberUsername})`}
                                />
                            </Box>
                        </Paper>

                        {/* Right: notes + actions */}
                        <Box sx={{ display: "grid", gap: 2 }}>
                            <Paper
                                variant="outlined"
                                sx={{ borderRadius: 4, p: 2 }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    Reviewer Note
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Add a note (required for rejection).
                                </Typography>

                                <TextField
                                    value={reviewerNote}
                                    onChange={(e) =>
                                        setReviewerNote(e.target.value)
                                    }
                                    placeholder="Write a review note…"
                                    multiline
                                    minRows={4}
                                    fullWidth
                                    sx={{ mt: 1.5 }}
                                    InputProps={{ readOnly: !canReview }}
                                />

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        justifyContent: "flex-end",
                                        mt: 2,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<HighlightOffOutlinedIcon />}
                                        sx={{ borderRadius: 3 }} // ✅ keep your button shape
                                        disabled={!canReview || saving}
                                        onClick={reject}
                                    >
                                        Reject
                                    </Button>

                                    <Button
                                        variant="contained"
                                        startIcon={
                                            <CheckCircleOutlineOutlinedIcon />
                                        }
                                        sx={{ borderRadius: 3 }} // ✅ keep your button shape
                                        disabled={!canReview || saving}
                                        onClick={approve}
                                    >
                                        {saving ? "Saving…" : "Approve"}
                                    </Button>
                                </Box>

                                {!canReview ? (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            display: "block",
                                            mt: 1,
                                        }}
                                    >
                                        This payment is already{" "}
                                        {String(
                                            payment.status || ""
                                        ).toLowerCase()}
                                        .
                                    </Typography>
                                ) : null}
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{ borderRadius: 4, p: 2 }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    Quick Links
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        mt: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Button
                                        component={Link}
                                        href="/members"
                                        variant="outlined"
                                        sx={{ borderRadius: 3 }} // ✅
                                    >
                                        Members List
                                    </Button>
                                    <Button
                                        component={Link}
                                        href="/payments"
                                        variant="outlined"
                                        sx={{ borderRadius: 3 }} // ✅
                                    >
                                        Payments Inbox
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                )}
            </AppShell>
        </RoleGuard>
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
                sx={{ fontWeight: 900, textAlign: "right" }}
            >
                {value}
            </Typography>
        </Box>
    );
}

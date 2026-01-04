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
} from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import {
    mockPaymentInbox,
    fmtDateTime,
    money,
} from "../../../lib/mock/payments";

function StatusChip({ status }) {
    const map = {
        Pending: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        Approved: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        Rejected: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
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

export default function PaymentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;

    const payment = mockPaymentInbox.find((p) => p.id === id);

    const [reviewerNote, setReviewerNote] = React.useState(
        payment?.reviewerNote || ""
    );

    if (!payment) {
        return (
            <RoleGuard
                allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF]}
            >
                <AppShell title="Payment">
                    <PageHeader title="Payment" subtitle="Not found" />
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, p: 4, textAlign: "center" }}
                    >
                        <Typography sx={{ fontWeight: 900 }}>
                            Payment not found
                        </Typography>
                        <Button
                            component={Link}
                            href="/payments"
                            variant="contained"
                            sx={{ borderRadius: 3, mt: 2 }}
                        >
                            Back to Inbox
                        </Button>
                    </Paper>
                </AppShell>
            </RoleGuard>
        );
    }

    const canReview = payment.status === "Pending";

    const approve = () => {
        alert(
            `Approve (UI only): ${payment.id}\nNote: ${
                reviewerNote || "(none)"
            }`
        );
        router.push("/payments");
    };

    const reject = () => {
        if (!reviewerNote.trim()) {
            alert("Please add a rejection note (UI only).");
            return;
        }
        alert(`Reject (UI only): ${payment.id}\nNote: ${reviewerNote}`);
        router.push("/payments");
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF]}>
            <AppShell title="Payment Review">
                <PageHeader
                    title="Review Payment"
                    subtitle={`${payment.id} • ${payment.type}`}
                    right={
                        <Button
                            component={Link}
                            href="/payments"
                            variant="outlined"
                            startIcon={<ArrowBackOutlinedIcon />}
                            sx={{ borderRadius: 3 }}
                        >
                            Back
                        </Button>
                    }
                />

                <Box
                    sx={{
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
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Storage path (placeholder):{" "}
                                    {payment.receiptPath}
                                </Typography>
                            </Box>

                            <StatusChip status={payment.status} />
                        </Box>

                        <Divider />

                        {/* Receipt preview placeholder */}
                        <Box
                            sx={{
                                height: 420,
                                backgroundColor: "action.hover",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    color: "text.secondary",
                                }}
                            >
                                Receipt preview (UI-only)
                            </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ p: 2, display: "grid", gap: 1 }}>
                            <Row label="Type" value={payment.type} />
                            <Row label="Entity ID" value={payment.entityId} />
                            <Row label="Amount" value={money(payment.amount)} />
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

                    {/* Right: actions + notes */}
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <Paper
                            variant="outlined"
                            sx={{ borderRadius: 4, p: 2 }}
                        >
                            <Typography sx={{ fontWeight: 900 }}>
                                User Note
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                            >
                                {payment.noteFromUser || "—"}
                            </Typography>
                        </Paper>

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
                                    sx={{ borderRadius: 3 }}
                                    disabled={!canReview}
                                    onClick={reject}
                                >
                                    Reject
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={
                                        <CheckCircleOutlineOutlinedIcon />
                                    }
                                    sx={{ borderRadius: 3 }}
                                    disabled={!canReview}
                                    onClick={approve}
                                >
                                    Approve
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
                                    {payment.status.toLowerCase()}.
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
                                    href={`/members/${payment.memberUsername}`}
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                >
                                    Member
                                </Button>
                                <Button
                                    component={Link}
                                    href="/members"
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                >
                                    Members List
                                </Button>
                                <Button
                                    component={Link}
                                    href="/reader/fines"
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                >
                                    (Mock) Fines
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                </Box>
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

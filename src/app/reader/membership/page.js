// src/app/reader/membership/page.js
"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Button,
    Chip,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Drawer,
    IconButton,
    Stack,
    TextField,
    MenuItem,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import UploadOutlinedIcon from "@mui/icons-material/UploadOutlined";
import UpgradeOutlinedIcon from "@mui/icons-material/UpgradeOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";
import { uploadReceiptAndCreatePayment } from "@/lib/supabase/readerApi";

/** ✅ Stop "weird rounding": use px strings so MUI doesn't multiply by theme.shape.borderRadius */
const R = {
    card: "14px",
    soft: "12px",
    btn: "12px",
    drawer: "16px",
    chip: "999px",
};

/** ✅ PKR everywhere */
function moneyPKR(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { style: "currency", currency: "PKR" });
}

function PillChip({ label, tone = "neutral", sx, variant }) {
    const map = {
        ok: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        warn: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        danger: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        neutral: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };
    const s = map[tone] || map.neutral;

    return (
        <Chip
            size="small"
            label={label}
            variant={variant}
            sx={{
                borderRadius: R.chip,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
                borderColor: "divider",
                ...sx,
            }}
        />
    );
}

function StatusChip({ status }) {
    if (status === "Active") return <PillChip label="Active" tone="ok" />;
    if (status === "Pending") return <PillChip label="Pending" tone="warn" />;
    if (status === "Rejected")
        return <PillChip label="Rejected" tone="danger" />;
    if (status === "Expired")
        return <PillChip label="Expired" tone="neutral" />;
    if (status === "Cancelled")
        return <PillChip label="Cancelled" tone="neutral" />;
    return <PillChip label={status || "—"} tone="neutral" />;
}

function ReceiptChip({ status }) {
    if (!status) return <PillChip label="—" tone="neutral" />;
    if (status === "Approved") return <PillChip label="Approved" tone="ok" />;
    if (status === "Rejected")
        return <PillChip label="Rejected" tone="danger" />;
    if (status === "Pending") return <PillChip label="Pending" tone="warn" />;
    return <PillChip label={status} tone="neutral" />;
}

function addDaysISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 0));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function ReaderMembershipPage() {
    const { supabase, user } = useAuth();

    const [plans, setPlans] = React.useState([]);
    const [subs, setSubs] = React.useState([]);

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    // Drawer (new / upgrade / reupload)
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [drawerMode, setDrawerMode] = React.useState("new"); // "new" | "upgrade" | "reupload"
    const [selectedPlanId, setSelectedPlanId] = React.useState("");
    const [targetSubscription, setTargetSubscription] = React.useState(null);

    const [file, setFile] = React.useState(null);
    const [fileName, setFileName] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    // TEMP: subscription length (schema has no plan duration)
    const DEFAULT_MEMBERSHIP_DAYS = 30;

    const loadSeqRef = React.useRef(0);

    const load = React.useCallback(async () => {
        if (!supabase || !user) return;

        const seq = ++loadSeqRef.current;
        setLoading(true);
        setError("");

        try {
            const { data: planRows, error: pErr } = await supabase
                .from("membership_plans")
                .select(
                    "id,name,price,borrow_limit,borrow_duration_days,fine_amount_per_day,grace_period_days,description,is_active"
                )
                .eq("is_active", true)
                .order("price", { ascending: true });

            if (pErr) throw pErr;

            const { data: subRows, error: sErr } = await supabase
                .from("subscriptions")
                .select(
                    "id,plan_id,plan_name,status,start_date,end_date,amount_paid,created_at"
                )
                .eq("reader_id", user.id)
                .order("created_at", { ascending: false });

            if (sErr) throw sErr;

            const ids = (subRows || []).map((x) => x.id).filter(Boolean);

            const latestByEntity = {};
            if (ids.length) {
                const { data: rRows, error: rErr } = await supabase
                    .from("payment_receipts")
                    .select(
                        "id,entity_id,entity_type,amount,receipt_path,status,submitted_at,reviewed_at,review_note"
                    )
                    .eq("entity_type", "Subscription")
                    .in("entity_id", ids)
                    .order("submitted_at", { ascending: false });

                if (rErr) throw rErr;

                for (const r of rRows || []) {
                    if (!latestByEntity[r.entity_id])
                        latestByEntity[r.entity_id] = r;
                }
            }

            if (seq !== loadSeqRef.current) return;

            setPlans(planRows || []);
            setSubs(
                (subRows || []).map((s) => ({
                    ...s,
                    latestReceipt: latestByEntity[s.id] || null,
                }))
            );
        } catch (e) {
            if (seq !== loadSeqRef.current) return;
            setError(e?.message || "Failed to load membership");
        } finally {
            if (seq === loadSeqRef.current) setLoading(false);
        }
    }, [supabase, user]);

    React.useEffect(() => {
        load();
    }, [load]);

    const activeSub = React.useMemo(() => {
        const today = new Date();
        const actives = subs
            .filter((s) => s.status === "Active" && s.end_date)
            .filter((s) => new Date(s.end_date) >= today)
            .sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
        return actives[0] || null;
    }, [subs]);

    const selectedPlan = React.useMemo(() => {
        return plans.find((p) => p.id === selectedPlanId) || null;
    }, [plans, selectedPlanId]);

    const closeDrawer = () => setDrawerOpen(false);

    const openDrawerForNewOrUpgrade = (planId = "") => {
        setDrawerMode(activeSub ? "upgrade" : "new");
        setTargetSubscription(null);
        setSelectedPlanId(planId);
        setFile(null);
        setFileName("");
        setError("");
        setDrawerOpen(true);
    };

    const openDrawerForReupload = (subscription) => {
        setDrawerMode("reupload");
        setTargetSubscription(subscription);
        setSelectedPlanId(subscription?.plan_id || "");
        setFile(null);
        setFileName("");
        setError("");
        setDrawerOpen(true);
    };

    const endDate = React.useMemo(
        () => addDaysISO(DEFAULT_MEMBERSHIP_DAYS),
        [drawerOpen]
    );

    const computeDueAmount = React.useCallback(
        (subRow) => {
            const plan =
                plans.find(
                    (p) => p.id === (subRow?.plan_id || selectedPlanId)
                ) ||
                selectedPlan ||
                null;

            const price = Number(plan?.price || 0);
            const paid = Number(subRow?.amount_paid || 0);
            const remaining = Math.max(price - paid, 0);

            return { plan, price, remaining };
        },
        [plans, selectedPlanId, selectedPlan]
    );

    const canSubmit = React.useMemo(() => {
        if (submitting) return false;
        if (!file) return false;
        if (drawerMode === "reupload") return Boolean(targetSubscription?.id);
        return Boolean(selectedPlanId);
    }, [submitting, file, drawerMode, selectedPlanId, targetSubscription]);

    const submit = async () => {
        if (!supabase || !user || !file) return;

        setSubmitting(true);
        setError("");

        try {
            // Re-upload receipt for an existing subscription
            if (drawerMode === "reupload") {
                const subRow = targetSubscription;
                if (!subRow?.id) throw new Error("Missing subscription.");

                if (subRow.latestReceipt?.status === "Pending") {
                    throw new Error(
                        "Your last receipt is still pending review."
                    );
                }

                const { remaining, plan } = computeDueAmount(subRow);
                if (!plan)
                    throw new Error("Plan not found for this subscription.");
                if (remaining <= 0)
                    throw new Error("This subscription is already fully paid.");

                await uploadReceiptAndCreatePayment({
                    supabase,
                    userId: user.id,
                    entityType: "Subscription",
                    entityId: subRow.id,
                    amount: remaining,
                    file,
                });

                closeDrawer();
                await load();
                return;
            }

            // New / Upgrade request => create a new Pending subscription, then upload receipt
            if (!selectedPlanId) throw new Error("Select a plan first.");
            if (!selectedPlan) throw new Error("Plan not found.");

            const { data: created, error: insErr } = await supabase
                .from("subscriptions")
                .insert([
                    {
                        reader_id: user.id,
                        plan_id: selectedPlan.id,
                        status: "Pending",
                        end_date: endDate, // required by schema
                    },
                ])
                .select("id")
                .single();

            if (insErr) throw insErr;
            if (!created?.id) throw new Error("Failed to create subscription.");

            await uploadReceiptAndCreatePayment({
                supabase,
                userId: user.id,
                entityType: "Subscription",
                entityId: created.id,
                amount: Number(selectedPlan.price || 0),
                file,
            });

            closeDrawer();
            await load();
        } catch (e) {
            setError(e?.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RoleGuard allowedRoles={[ROLES.READER]}>
            <AppShell title="Membership">
                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                    <PageHeader
                        title="Membership"
                        subtitle="Choose a plan, upload a receipt, and wait for approval."
                        right={
                            <Button
                                variant="contained"
                                startIcon={<UpgradeOutlinedIcon />}
                                sx={{ borderRadius: R.btn }}
                                onClick={() => openDrawerForNewOrUpgrade("")}
                                disabled={loading || !user}
                            >
                                {activeSub ? "Upgrade plan" : "Request plan"}
                            </Button>
                        }
                    />

                    {error ? (
                        <Alert
                            severity="error"
                            sx={{ mt: 2, borderRadius: R.soft }}
                        >
                            {error}
                        </Alert>
                    ) : null}

                    {/* Top cards */}
                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                            gap: 2,
                            minWidth: 0,
                        }}
                    >
                        <Card sx={{ borderRadius: R.card, minWidth: 0 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Current status
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Borrowing requires an Active plan.
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {loading ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1.25,
                                            alignItems: "center",
                                        }}
                                    >
                                        <CircularProgress size={18} />
                                        <Typography sx={{ fontWeight: 800 }}>
                                            Loading…
                                        </Typography>
                                    </Box>
                                ) : activeSub ? (
                                    <Box sx={{ display: "grid", gap: 1 }}>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 2,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                                noWrap
                                            >
                                                {activeSub.plan_name || "Plan"}
                                            </Typography>
                                            <StatusChip
                                                status={activeSub.status}
                                            />
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            Valid: {activeSub.start_date || "—"}{" "}
                                            → {activeSub.end_date || "—"}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box sx={{ display: "grid", gap: 1 }}>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            No active membership
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            You won’t be able to borrow books
                                            until staff approves your payment.
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <PillChip
                                                label="Pick a plan below to get started"
                                                tone="warn"
                                            />
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: R.card, minWidth: 0 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    My requests
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Latest subscription requests and receipt
                                    status.
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {loading ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1.25,
                                            alignItems: "center",
                                        }}
                                    >
                                        <CircularProgress size={18} />
                                        <Typography sx={{ fontWeight: 800 }}>
                                            Loading…
                                        </Typography>
                                    </Box>
                                ) : subs.length ? (
                                    <Stack spacing={1}>
                                        {subs.slice(0, 5).map((s) => {
                                            const receipt = s.latestReceipt;
                                            const isPendingReceipt =
                                                receipt?.status === "Pending";
                                            const canReupload =
                                                s.status === "Rejected" ||
                                                receipt?.status === "Rejected";

                                            return (
                                                <Paper
                                                    key={s.id}
                                                    variant="outlined"
                                                    sx={{
                                                        borderRadius: R.card,
                                                        p: 1.25,
                                                        display: "grid",
                                                        gap: 0.9,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "space-between",
                                                            alignItems:
                                                                "center",
                                                            gap: 1,
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 900,
                                                            }}
                                                            noWrap
                                                        >
                                                            {s.plan_name ||
                                                                "Plan"}
                                                        </Typography>
                                                        <StatusChip
                                                            status={s.status}
                                                        />
                                                    </Box>

                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 1,
                                                            flexWrap: "wrap",
                                                            alignItems:
                                                                "center",
                                                            minWidth: 0,
                                                        }}
                                                    >
                                                        <PillChip
                                                            label={`Paid: ${moneyPKR(
                                                                s.amount_paid
                                                            )}`}
                                                            tone="neutral"
                                                            variant="outlined"
                                                        />
                                                        <ReceiptChip
                                                            status={
                                                                receipt?.status ||
                                                                null
                                                            }
                                                        />
                                                        <Box
                                                            sx={{
                                                                flex: 1,
                                                                minWidth: 0,
                                                            }}
                                                        />

                                                        {receipt?.status ===
                                                        "Rejected" ? (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    borderRadius:
                                                                        R.btn,
                                                                }}
                                                                onClick={() =>
                                                                    window.alert(
                                                                        `Reviewer note: ${
                                                                            receipt?.review_note ||
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
                                                                canReupload
                                                                    ? "contained"
                                                                    : "outlined"
                                                            }
                                                            startIcon={
                                                                <UploadOutlinedIcon />
                                                            }
                                                            sx={{
                                                                borderRadius:
                                                                    R.btn,
                                                            }}
                                                            disabled={
                                                                isPendingReceipt ||
                                                                !canReupload
                                                            }
                                                            onClick={() =>
                                                                openDrawerForReupload(
                                                                    s
                                                                )
                                                            }
                                                        >
                                                            {canReupload
                                                                ? "Re-upload"
                                                                : "Upload"}
                                                        </Button>
                                                    </Box>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        No subscription requests yet.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Plans */}
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            borderRadius: R.card,
                            overflow: "hidden",
                            minWidth: 0,
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Available plans
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Pick a plan and upload a payment receipt.
                            </Typography>
                        </Box>

                        <Divider />

                        <Box
                            sx={{
                                p: 2,
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "repeat(2, 1fr)",
                                    xl: "repeat(3, 1fr)",
                                },
                                gap: 2,
                                minWidth: 0,
                            }}
                        >
                            {(loading ? Array.from({ length: 6 }) : plans).map(
                                (p, idx) =>
                                    loading ? (
                                        <Paper
                                            key={`sk-${idx}`}
                                            variant="outlined"
                                            sx={{
                                                borderRadius: R.card,
                                                height: 190,
                                            }}
                                        />
                                    ) : (
                                        <Card
                                            key={p.id}
                                            sx={{
                                                borderRadius: R.card,
                                                minWidth: 0,
                                            }}
                                        >
                                            <CardContent>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        gap: 2,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 900,
                                                                fontSize: 18,
                                                            }}
                                                            noWrap
                                                        >
                                                            {p.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                                mt: 0.25,
                                                            }}
                                                            noWrap
                                                        >
                                                            {p.description ||
                                                                "—"}
                                                        </Typography>
                                                    </Box>

                                                    <PillChip
                                                        label={moneyPKR(
                                                            p.price
                                                        )}
                                                        tone="warn"
                                                    />
                                                </Box>

                                                <Divider sx={{ my: 2 }} />

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <Chip
                                                        size="small"
                                                        label={`Limit: ${p.borrow_limit}`}
                                                        sx={{
                                                            borderRadius:
                                                                R.soft,
                                                            fontWeight: 900,
                                                        }}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`Borrow: ${p.borrow_duration_days}d`}
                                                        sx={{
                                                            borderRadius:
                                                                R.soft,
                                                            fontWeight: 900,
                                                        }}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`Fine/day: ${moneyPKR(
                                                            p.fine_amount_per_day
                                                        )}`}
                                                        sx={{
                                                            borderRadius:
                                                                R.soft,
                                                            fontWeight: 900,
                                                        }}
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={`Grace: ${p.grace_period_days}d`}
                                                        sx={{
                                                            borderRadius:
                                                                R.soft,
                                                            fontWeight: 900,
                                                        }}
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "flex-end",
                                                        mt: 2,
                                                    }}
                                                >
                                                    <Button
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: R.btn,
                                                        }}
                                                        onClick={() =>
                                                            openDrawerForNewOrUpgrade(
                                                                p.id
                                                            )
                                                        }
                                                    >
                                                        Select
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    )
                            )}
                        </Box>
                    </Paper>

                    {/* Drawer */}
                    <Drawer
                        anchor="right"
                        open={drawerOpen}
                        onClose={closeDrawer}
                        PaperProps={{
                            sx: {
                                width: { xs: "100%", sm: 520 },
                                maxWidth: "100vw",
                                minWidth: 0,
                                overflowX: "hidden",
                                borderTopLeftRadius: {
                                    xs: "0px",
                                    sm: R.drawer,
                                },
                                borderBottomLeftRadius: {
                                    xs: "0px",
                                    sm: R.drawer,
                                },
                            },
                        }}
                    >
                        <Box
                            sx={{
                                p: 2.25,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                                minWidth: 0,
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 900 }}
                                noWrap
                            >
                                {drawerMode === "reupload"
                                    ? "Re-upload receipt"
                                    : drawerMode === "upgrade"
                                    ? "Upgrade membership"
                                    : "Request membership"}
                            </Typography>
                            <IconButton
                                onClick={closeDrawer}
                                aria-label="close"
                            >
                                <CloseOutlinedIcon />
                            </IconButton>
                        </Box>

                        <Divider />

                        <Box
                            sx={{
                                p: 2.25,
                                display: "grid",
                                gap: 2,
                                minWidth: 0,
                            }}
                        >
                            {drawerMode !== "reupload" ? (
                                <TextField
                                    select
                                    label="Plan"
                                    value={selectedPlanId}
                                    onChange={(e) =>
                                        setSelectedPlanId(e.target.value)
                                    }
                                    fullWidth
                                >
                                    <MenuItem value="" disabled>
                                        Select a plan…
                                    </MenuItem>
                                    {plans.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name} — {moneyPKR(p.price)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            ) : (
                                <Paper
                                    variant="outlined"
                                    sx={{ borderRadius: R.card, p: 2 }}
                                >
                                    <Typography sx={{ fontWeight: 900 }} noWrap>
                                        {targetSubscription?.plan_name ||
                                            "Plan"}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.25,
                                        }}
                                        noWrap
                                    >
                                        Subscription: {targetSubscription?.id}
                                    </Typography>
                                </Paper>
                            )}

                            <Paper
                                variant="outlined"
                                sx={{ borderRadius: R.card, p: 2 }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    Validity (temporary rule)
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Your schema doesn’t store plan duration yet,
                                    so we create subscriptions for{" "}
                                    <b>{DEFAULT_MEMBERSHIP_DAYS} days</b>.
                                </Typography>
                                <Divider sx={{ my: 1.5 }} />
                                <Chip
                                    label={`End date: ${endDate}`}
                                    sx={{
                                        borderRadius: R.chip,
                                        fontWeight: 900,
                                    }}
                                    variant="outlined"
                                />
                            </Paper>

                            <Paper
                                variant="outlined"
                                sx={{ borderRadius: R.card, p: 2 }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    Receipt upload
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Upload a receipt. Staff will approve it.
                                </Typography>

                                <Divider sx={{ my: 1.5 }} />

                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        display: "block",
                                        mb: 1,
                                        wordBreak: "break-word",
                                    }}
                                >
                                    {fileName || "No file selected"}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Button
                                        component="label"
                                        variant="contained"
                                        startIcon={<UploadOutlinedIcon />}
                                        sx={{ borderRadius: R.btn }}
                                        disabled={submitting}
                                    >
                                        Choose file
                                        <input
                                            hidden
                                            type="file"
                                            accept=".png,.jpg,.jpeg,.webp,.pdf"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (!f) return;
                                                setFile(f);
                                                setFileName(f.name);
                                            }}
                                        />
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        sx={{ borderRadius: R.btn }}
                                        onClick={() => {
                                            setFile(null);
                                            setFileName("");
                                        }}
                                        disabled={submitting}
                                    >
                                        Clear
                                    </Button>
                                </Box>
                            </Paper>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    justifyContent: "flex-end",
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    sx={{ borderRadius: R.btn }}
                                    onClick={closeDrawer}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    sx={{ borderRadius: R.btn }}
                                    onClick={submit}
                                    disabled={!canSubmit}
                                >
                                    {submitting
                                        ? "Submitting…"
                                        : "Submit request"}
                                </Button>
                            </Box>
                        </Box>
                    </Drawer>
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

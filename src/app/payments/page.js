"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    TextField,
    MenuItem,
    InputAdornment,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Typography,
    Chip,
    Button,
    Divider,
    IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import PaymentReviewDrawer from "../../components/PaymentReviewDrawer";
import RoleGuard from "../../components/RoleGuard";
import { ROLES } from "../../lib/roles";
import { useAuth } from "@/context/AuthContext";

/**
 * FIX: stop “weirdly round” UI.
 * MUI numeric borderRadius uses theme spacing (e.g. 4 => 16px).
 * Use explicit px strings instead.
 */
const R = {
    paper: "10px",
    field: "10px",
    tab: "10px",
    btn: "10px",
    chip: "10px",
    pill: "999px",
};

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
                borderRadius: R.chip,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

/** ---------- data helpers ---------- */
async function signedReceiptUrl(supabase, receiptPath) {
    if (!receiptPath) return "";
    const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(receiptPath, 60 * 60);

    if (error) {
        console.warn("createSignedUrl failed:", error.message);
        return "";
    }
    return data?.signedUrl || "";
}

function fileNameFromPath(p) {
    if (!p) return "";
    const parts = String(p).split("/");
    return parts[parts.length - 1] || p;
}

export default function PaymentsPage() {
    const { supabase, user } = useAuth();

    const [tab, setTab] = React.useState(0); // 0 Fine, 1 Subscription
    const [status, setStatus] = React.useState("Pending");
    const [q, setQ] = React.useState("");

    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState(null);

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const entityType = tab === 0 ? "Fine" : "Subscription";

    const load = React.useCallback(async () => {
        if (!supabase || !user) return;

        setLoading(true);
        setError("");

        try {
            const { data: receipts, error: rErr } = await supabase
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
          reviewed_by,
          reviewed_at,
          review_note,
          payer:profiles!payment_receipts_payer_id_fkey (
            id, username, full_name
          ),
          reviewer:profiles!payment_receipts_reviewed_by_fkey (
            id, username, full_name
          )
        `
                )
                .order("submitted_at", { ascending: false })
                .limit(500);

            if (rErr) throw rErr;

            const list = receipts || [];

            const fineIds = list
                .filter((x) => x.entity_type === "Fine")
                .map((x) => x.entity_id)
                .filter(Boolean);

            const subIds = list
                .filter((x) => x.entity_type === "Subscription")
                .map((x) => x.entity_id)
                .filter(Boolean);

            const [fineMap, subMap] = await Promise.all([
                (async () => {
                    if (!fineIds.length) return new Map();
                    const { data, error: fErr } = await supabase
                        .from("fines")
                        .select(
                            "id, borrow_id, fine_type, amount, amount_paid, status, due_date"
                        )
                        .in("id", fineIds);
                    if (fErr) throw fErr;
                    return new Map((data || []).map((f) => [f.id, f]));
                })(),
                (async () => {
                    if (!subIds.length) return new Map();
                    const { data, error: sErr } = await supabase
                        .from("subscriptions")
                        .select(
                            "id, plan_name, reader_username, status, start_date, end_date, amount_paid"
                        )
                        .in("id", subIds);
                    if (sErr) throw sErr;
                    return new Map((data || []).map((s) => [s.id, s]));
                })(),
            ]);

            const withUrls = await Promise.all(
                list.map(async (r) => {
                    const receiptUrl = await signedReceiptUrl(
                        supabase,
                        r.receipt_path
                    );

                    let entityRef = r.entity_id;
                    if (r.entity_type === "Fine") {
                        const f = fineMap.get(r.entity_id);
                        entityRef = f?.borrow_id
                            ? `Fine • Borrow ${String(f.borrow_id).slice(
                                  0,
                                  8
                              )}…`
                            : `Fine • ${String(r.entity_id).slice(0, 8)}…`;
                    } else if (r.entity_type === "Subscription") {
                        const s = subMap.get(r.entity_id);
                        entityRef = s?.plan_name
                            ? `Sub • ${s.plan_name}`
                            : `Sub • ${String(r.entity_id).slice(0, 8)}…`;
                    }

                    return {
                        id: r.id,
                        entityType: r.entity_type,
                        entityId: r.entity_id,
                        entityRef,

                        amount: r.amount,
                        method: "Receipt",
                        status: r.status,

                        submittedAt: r.submitted_at,

                        payerName: r.payer?.full_name || "—",
                        payerUsername: r.payer?.username || "—",
                        payerId: r.payer_id,

                        receiptPath: r.receipt_path,
                        receiptFileName: fileNameFromPath(r.receipt_path),
                        receiptUrl,

                        reviewedAt: r.reviewed_at,
                        reviewedBy:
                            r.reviewer?.full_name || (r.reviewed_by ? "—" : ""),
                        reviewerUsername: r.reviewer?.username || "",
                        note: r.review_note || "",
                    };
                })
            );

            setRows(withUrls);
        } catch (e) {
            setError(e?.message || "Failed to load payments");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [supabase, user]);

    React.useEffect(() => {
        load();
    }, [load]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        return rows.filter((r) => {
            const matchesType = r.entityType === entityType;
            const matchesStatus = status === "All" ? true : r.status === status;

            const matchesQuery =
                !query ||
                String(r.payerName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(r.payerUsername || "")
                    .toLowerCase()
                    .includes(query) ||
                String(r.entityRef || "")
                    .toLowerCase()
                    .includes(query);

            return matchesType && matchesStatus && matchesQuery;
        });
    }, [rows, entityType, status, q]);

    const handleReview = async (payment) => {
        if (payment && payment.receiptPath && !payment.receiptUrl) {
            const url = await signedReceiptUrl(supabase, payment.receiptPath);
            payment = { ...payment, receiptUrl: url };
        }
        setSelected(payment);
        setOpen(true);
    };

    const handleApprove = async (id, note) => {
        const { error: uErr } = await supabase
            .from("payment_receipts")
            .update({ status: "Approved", review_note: note || null })
            .eq("id", id);

        if (uErr) throw uErr;
        await load();
    };

    const handleReject = async (id, note) => {
        const { error: uErr } = await supabase
            .from("payment_receipts")
            .update({ status: "Rejected", review_note: note || null })
            .eq("id", id);

        if (uErr) throw uErr;
        await load();
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF]}>
            <AppShell title="Payments">
                <PageHeader
                    title="Payments Inbox"
                    subtitle="Review uploaded receipts and approve or reject payments."
                    right={
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<TuneOutlinedIcon />}
                                sx={{ borderRadius: R.btn }}
                            >
                                Filters
                            </Button>
                            <Button
                                variant="contained"
                                sx={{ borderRadius: R.btn }}
                            >
                                Export
                            </Button>
                        </>
                    }
                />

                {error ? (
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: R.paper, p: 2, mb: 2 }}
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
                        p: 1.25,
                        borderRadius: R.paper,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            minHeight: 40,
                            "& .MuiTabs-flexContainer": { gap: 0.75 },
                            "& .MuiTab-root": {
                                minHeight: 40,
                                borderRadius: R.tab,
                                textTransform: "none",
                                fontWeight: 900,
                                px: 1.5,
                            },
                        }}
                    >
                        <Tab label="Fine Payments" />
                        <Tab label="Subscription Payments" />
                    </Tabs>

                    <Box sx={{ flex: 1, minWidth: 0 }} />

                    <TextField
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search payer / username / entity…"
                        sx={{
                            width: { xs: "100%", sm: 360 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: R.field,
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        sx={{
                            width: { xs: "100%", sm: 220 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: R.field,
                            },
                        }}
                        label="Status"
                    >
                        {[
                            "Pending",
                            "Approved",
                            "Rejected",
                            "Cancelled",
                            "All",
                        ].map((s) => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </TextField>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: R.paper, overflow: "hidden" }}
                >
                    <Box
                        sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            minWidth: 0,
                        }}
                    >
                        <Typography sx={{ fontWeight: 900 }}>
                            {entityType} Payments ({filtered.length})
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Showing: <b>{status}</b>
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table
                            size="small"
                            sx={{
                                minWidth: 860,
                                "& th": { fontWeight: 900 },
                                "& td": { verticalAlign: "middle" },
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell>Submitted</TableCell>
                                    <TableCell>Payer</TableCell>
                                    <TableCell>Entity</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: "center" }}>
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                >
                                                    Loading…
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    Fetching receipts from
                                                    Supabase
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {filtered.map((r) => (
                                            <TableRow key={r.id} hover>
                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {formatDateTime(
                                                        r.submittedAt
                                                    )}
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 900,
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {r.payerName}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        @{r.payerUsername}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 900,
                                                            lineHeight: 1.2,
                                                        }}
                                                    >
                                                        {r.entityRef}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        {r.entityType}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <Typography
                                                        sx={{ fontWeight: 900 }}
                                                    >
                                                        {formatMoney(r.amount)}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        {r.method}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip
                                                        status={r.status}
                                                    />
                                                </TableCell>

                                                <TableCell align="right">
                                                    <IconButton
                                                        onClick={() =>
                                                            handleReview(r)
                                                        }
                                                        aria-label="review"
                                                        sx={{
                                                            borderRadius: R.btn,
                                                        }}
                                                    >
                                                        <VisibilityOutlinedIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {filtered.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    sx={{ py: 6 }}
                                                >
                                                    <Box
                                                        sx={{
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 900,
                                                            }}
                                                        >
                                                            No payments found
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            Try changing filters
                                                            or search query.
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ) : null}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    <Divider />

                    <Box
                        sx={{
                            p: 1.5,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Live data • Pagination coming later
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                                variant="outlined"
                                sx={{ borderRadius: R.btn }}
                                disabled
                            >
                                Prev
                            </Button>
                            <Button
                                variant="outlined"
                                sx={{ borderRadius: R.btn }}
                                disabled
                            >
                                Next
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                <PaymentReviewDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    payment={selected}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            </AppShell>
        </RoleGuard>
    );
}

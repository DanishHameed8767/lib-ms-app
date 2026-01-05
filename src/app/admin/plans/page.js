"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    TextField,
    Button,
    Chip,
    Alert,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Switch,
    CircularProgress,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";
import PlanEditDrawer from "../../../components/PlanEditDrawer";

const R = {
    paper: 14,
    soft: 12,
    btn: 12,
    chip: 999,
    chipSoft: 10,
};

function normalizePlan(p) {
    return {
        id: p?.id || "",
        name: p?.name || "",
        price: Number(p?.price ?? 0),
        borrow_limit: Number(p?.borrow_limit ?? 0),
        borrow_duration_days: Number(p?.borrow_duration_days ?? 14),
        fine_amount_per_day: Number(p?.fine_amount_per_day ?? 0),
        grace_period_days: Number(p?.grace_period_days ?? 0),
        description: p?.description || "",
        is_active: Boolean(p?.is_active ?? true),
    };
}

export default function AdminPlansPage() {
    const { supabase } = useAuth();

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [q, setQ] = React.useState("");

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);

    const [drawerError, setDrawerError] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    const load = React.useCallback(async () => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        let alive = true;
        try {
            const { data, error: qErr } = await supabase
                .from("membership_plans")
                .select(
                    "id, name, price, borrow_limit, borrow_duration_days, fine_amount_per_day, grace_period_days, description, is_active"
                )
                .order("name", { ascending: true });

            if (qErr) throw qErr;
            if (!alive) return;

            setRows((data || []).map(normalizePlan));
        } catch (e) {
            setError(e?.message || "Failed to load plans");
        } finally {
            if (alive) setLoading(false);
        }

        return () => {
            alive = false;
        };
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return rows;
        return rows.filter((p) => {
            return (
                String(p.name || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.description || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.id || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [rows, q]);

    const openCreate = () => {
        setDrawerError("");
        setEditing(
            normalizePlan({
                name: "",
                price: 0,
                borrow_limit: 2,
                borrow_duration_days: 14,
                fine_amount_per_day: 0,
                grace_period_days: 0,
                description: "",
                is_active: true,
            })
        );
        setOpen(true);
    };

    const openEdit = (p) => {
        setDrawerError("");
        setEditing(normalizePlan(p));
        setOpen(true);
    };

    const save = async () => {
        if (!supabase || !editing) return;

        setSaving(true);
        setDrawerError("");

        try {
            const payload = {
                name: String(editing.name || "").trim(),
                price: Number(editing.price ?? 0),
                borrow_limit: Number(editing.borrow_limit ?? 0),
                borrow_duration_days: Number(editing.borrow_duration_days ?? 1),
                fine_amount_per_day: Number(editing.fine_amount_per_day ?? 0),
                grace_period_days: Number(editing.grace_period_days ?? 0),
                description: String(editing.description || "").trim() || null,
                is_active: Boolean(editing.is_active),
            };

            if (!payload.name) throw new Error("Name is required.");

            if (editing.id) {
                const { data, error: uErr } = await supabase
                    .from("membership_plans")
                    .update(payload)
                    .eq("id", editing.id)
                    .select(
                        "id, name, price, borrow_limit, borrow_duration_days, fine_amount_per_day, grace_period_days, description, is_active"
                    )
                    .single();

                if (uErr) throw uErr;

                setRows((prev) =>
                    prev.map((x) =>
                        x.id === data.id ? normalizePlan(data) : x
                    )
                );
            } else {
                const { data, error: iErr } = await supabase
                    .from("membership_plans")
                    .insert([payload])
                    .select(
                        "id, name, price, borrow_limit, borrow_duration_days, fine_amount_per_day, grace_period_days, description, is_active"
                    )
                    .single();

                if (iErr) throw iErr;

                setRows((prev) => [normalizePlan(data), ...prev]);
            }

            setOpen(false);
        } catch (e) {
            setDrawerError(e?.message || "Failed to save plan");
        } finally {
            setSaving(false);
        }
    };

    const deactivate = async () => {
        if (!supabase || !editing?.id) return;

        const ok = window.confirm("Deactivate this plan?");
        if (!ok) return;

        setSaving(true);
        setDrawerError("");

        try {
            const { data, error: uErr } = await supabase
                .from("membership_plans")
                .update({ is_active: false })
                .eq("id", editing.id)
                .select(
                    "id, name, price, borrow_limit, borrow_duration_days, fine_amount_per_day, grace_period_days, description, is_active"
                )
                .single();

            if (uErr) throw uErr;

            setRows((prev) =>
                prev.map((x) => (x.id === data.id ? normalizePlan(data) : x))
            );
            setEditing((prev) => (prev ? { ...prev, is_active: false } : prev));
            setOpen(false);
        } catch (e) {
            setDrawerError(e?.message || "Failed to deactivate plan");
        } finally {
            setSaving(false);
        }
    };

    const toggleActiveInline = async (plan) => {
        if (!supabase) return;

        const nextActive = !plan.is_active;

        // Optimistic UI
        setRows((prev) =>
            prev.map((x) =>
                x.id === plan.id ? { ...x, is_active: nextActive } : x
            )
        );

        const { error: uErr } = await supabase
            .from("membership_plans")
            .update({ is_active: nextActive })
            .eq("id", plan.id);

        if (uErr) {
            // revert
            setRows((prev) =>
                prev.map((x) =>
                    x.id === plan.id ? { ...x, is_active: plan.is_active } : x
                )
            );
            alert(uErr.message || "Failed to update active state");
        }
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AppShell title="Membership Plans">
                <PageHeader
                    title="Membership Plans"
                    subtitle="Create and manage membership rules (limits, duration, fines)."
                    right={
                        <Button
                            variant="contained"
                            startIcon={<AddOutlinedIcon />}
                            sx={{ borderRadius: `${R.btn}px` }}
                            onClick={openCreate}
                            disabled={loading}
                        >
                            New Plan
                        </Button>
                    }
                />

                {error ? (
                    <Alert
                        severity="error"
                        sx={{ mt: 2, borderRadius: `${R.soft}px` }}
                    >
                        {error}
                    </Alert>
                ) : null}

                <Paper
                    variant="outlined"
                    sx={{
                        mt: 2,
                        p: 1.25,
                        borderRadius: `${R.paper}px`,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    <TextField
                        label="Search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Name / description / id…"
                        sx={{
                            width: { xs: "100%", sm: 520 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: `${R.soft}px`,
                            },
                        }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }} />
                    <Chip
                        label={`${filtered.length} plan(s)`}
                        sx={{ borderRadius: `${R.chip}px`, fontWeight: 900 }}
                        variant="outlined"
                    />
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{
                        mt: 2,
                        borderRadius: `${R.paper}px`,
                        overflow: "hidden",
                        minWidth: 0,
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 900 }}>Plans</Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Backed by `membership_plans`
                        </Typography>
                    </Box>

                    <Divider />

                    {loading ? (
                        <Box
                            sx={{
                                p: 2,
                                display: "flex",
                                gap: 1.25,
                                alignItems: "center",
                            }}
                        >
                            <CircularProgress size={18} />
                            <Typography sx={{ fontWeight: 800 }}>
                                Loading plans…
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{ overflowX: "auto" }}>
                            <Table
                                size="small"
                                sx={{
                                    minWidth: 1100,
                                    "& th": { fontWeight: 900 },
                                    "& td": { verticalAlign: "middle" },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Price</TableCell>
                                        <TableCell>Borrow limit</TableCell>
                                        <TableCell>Duration</TableCell>
                                        <TableCell>Fine/day</TableCell>
                                        <TableCell>Grace</TableCell>
                                        <TableCell>Active</TableCell>
                                        <TableCell align="right">
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.map((p) => (
                                        <TableRow key={p.id} hover>
                                            <TableCell>
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                >
                                                    {p.name}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                    }}
                                                    noWrap
                                                >
                                                    {p.description || p.id}
                                                </Typography>
                                            </TableCell>

                                            <TableCell sx={{ fontWeight: 900 }}>
                                                {Number(p.price).toFixed(2)}
                                            </TableCell>

                                            <TableCell>
                                                {p.borrow_limit}
                                            </TableCell>

                                            <TableCell>
                                                {p.borrow_duration_days} days
                                            </TableCell>

                                            <TableCell>
                                                {Number(
                                                    p.fine_amount_per_day
                                                ).toFixed(2)}
                                            </TableCell>

                                            <TableCell>
                                                {p.grace_period_days} days
                                            </TableCell>

                                            <TableCell>
                                                <Switch
                                                    checked={Boolean(
                                                        p.is_active
                                                    )}
                                                    onChange={() =>
                                                        toggleActiveInline(p)
                                                    }
                                                />
                                            </TableCell>

                                            <TableCell align="right">
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    sx={{
                                                        borderRadius: `${R.btn}px`,
                                                    }}
                                                    onClick={() => openEdit(p)}
                                                >
                                                    Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                sx={{ py: 6 }}
                                            >
                                                <Box
                                                    sx={{ textAlign: "center" }}
                                                >
                                                    <Typography
                                                        sx={{ fontWeight: 900 }}
                                                    >
                                                        No plans found
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        Try another search.
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </TableBody>
                            </Table>
                        </Box>
                    )}
                </Paper>

                <PlanEditDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    value={editing || {}}
                    onChange={setEditing}
                    onSave={save}
                    onDeactivate={deactivate}
                    saving={saving}
                    error={drawerError}
                    showDeactivate={Boolean(editing?.id)}
                />
            </AppShell>
        </RoleGuard>
    );
}

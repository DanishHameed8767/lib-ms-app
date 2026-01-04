"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    TextField,
    InputAdornment,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Alert,
    CircularProgress,
    MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import AdminEditDrawer from "../../../components/AdminEditDrawer";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";

function formatDateTime(ts) {
    if (!ts) return "—";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
}

function StatusChip({ isActive }) {
    const label = isActive ? "Active" : "Archived";
    return (
        <Chip
            size="small"
            label={label}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: isActive
                    ? "rgba(46,204,113,0.15)"
                    : "rgba(160,160,160,0.18)",
                color: isActive ? "#2ecc71" : "text.secondary",
            }}
        />
    );
}

export default function AdminPoliciesPage() {
    const { supabase } = useAuth();

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [q, setQ] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("Active"); // Active | Archived | All

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);

    const load = React.useCallback(async () => {
        if (!supabase) return;

        setLoading(true);
        setError("");

        try {
            const { data, error: pErr } = await supabase
                .from("policies")
                .select(
                    "id,title,category,value,is_active,archived_at,created_at"
                )
                .order("created_at", { ascending: false })
                .limit(500);

            if (pErr) throw pErr;
            setRows(data || []);
        } catch (e) {
            setError(e?.message || "Failed to load policies");
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        load();
    }, [load]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();

        return rows.filter((p) => {
            const matchesQuery =
                !query ||
                String(p.title || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.category || "")
                    .toLowerCase()
                    .includes(query) ||
                String(p.value || "")
                    .toLowerCase()
                    .includes(query);

            const matchesStatus =
                statusFilter === "All"
                    ? true
                    : statusFilter === "Active"
                    ? Boolean(p.is_active)
                    : !Boolean(p.is_active);

            return matchesQuery && matchesStatus && Boolean(p.id);
        });
    }, [rows, q, statusFilter]);

    const openCreate = () => {
        setEditing({
            id: "",
            title: "",
            category: "Borrowing",
            value: "",
        });
        setOpen(true);
    };

    const openEdit = (p) => {
        setEditing({
            id: p.id,
            title: p.title || "",
            category: p.category || "",
            value: p.value || "",
        });
        setOpen(true);
    };

    const save = async () => {
        if (!supabase) return;

        const title = String(editing?.title || "").trim();
        const category = String(editing?.category || "").trim();
        const value = String(editing?.value || "").trim();

        if (!title || !category || !value) return;

        try {
            // Create
            if (!editing?.id) {
                const { data, error: insErr } = await supabase
                    .from("policies")
                    .insert({
                        title,
                        category,
                        value,
                        is_active: true,
                    })
                    .select(
                        "id,title,category,value,is_active,archived_at,created_at"
                    )
                    .single();

                if (insErr) throw insErr;

                setRows((prev) => [data, ...prev]);
                return;
            }

            // Update
            const { data, error: upErr } = await supabase
                .from("policies")
                .update({ title, category, value })
                .eq("id", editing.id)
                .select(
                    "id,title,category,value,is_active,archived_at,created_at"
                )
                .single();

            if (upErr) throw upErr;

            setRows((prev) => prev.map((x) => (x.id === up.id ? up : x)));
        } catch (e) {
            alert(e?.message || "Save failed");
        }
    };

    const del = async () => {
        if (!supabase) return;
        if (!editing?.id) return;

        try {
            // Your trigger converts DELETE -> archive (is_active=false, archived_at=NOW()).
            const { error: dErr } = await supabase
                .from("policies")
                .delete()
                .eq("id", editing.id);

            if (dErr) throw dErr;

            // reload (record still exists but now archived)
            await load();
        } catch (e) {
            alert(e?.message || "Archive failed");
        }
    };

    const unarchive = async (id) => {
        if (!supabase || !id) return;
        try {
            const { data, error: upErr } = await supabase
                .from("policies")
                .update({ is_active: true, archived_at: null })
                .eq("id", id)
                .select(
                    "id,title,category,value,is_active,archived_at,created_at"
                )
                .single();

            if (upErr) throw upErr;

            setRows((prev) => prev.map((x) => (x.id === id ? data : x)));
        } catch (e) {
            alert(e?.message || "Unarchive failed");
        }
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AppShell title="Admin Policies">
                <PageHeader
                    title="Policies"
                    subtitle="Create and manage library rules visible to users."
                    right={
                        <Button
                            variant="contained"
                            startIcon={<AddOutlinedIcon />}
                            sx={{ borderRadius: 3 }}
                            onClick={openCreate}
                            disabled={loading}
                        >
                            New Policy
                        </Button>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                    </Alert>
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
                        placeholder="Search title / category / content…"
                        sx={{ width: { xs: "100%", sm: 520 } }}
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
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 200 } }}
                    >
                        {["Active", "Archived", "All"].map((s) => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Chip
                        icon={<GavelOutlinedIcon />}
                        label={`${loading ? "…" : filtered.length} item(s)`}
                        sx={{ borderRadius: 3, fontWeight: 900 }}
                        variant="outlined"
                    />
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 4, overflow: "hidden" }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            All Policies
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Live data • Delete = archive (trigger)
                        </Typography>
                    </Box>

                    <Divider />

                    <Box sx={{ overflowX: "auto" }}>
                        <Table size="small" sx={{ minWidth: 1100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                    <TableCell>Archived</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} sx={{ py: 6 }}>
                                            <Box sx={{ textAlign: "center" }}>
                                                <CircularProgress size={18} />
                                                <Typography
                                                    sx={{
                                                        fontWeight: 900,
                                                        mt: 1,
                                                    }}
                                                >
                                                    Loading…
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {filtered.map((p) => {
                                            const isActive = Boolean(
                                                p.is_active
                                            );
                                            return (
                                                <TableRow key={p.id} hover>
                                                    <TableCell>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 900,
                                                            }}
                                                        >
                                                            {p.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                            }}
                                                            noWrap
                                                        >
                                                            {p.value}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={p.category}
                                                            sx={{
                                                                borderRadius: 2,
                                                                fontWeight: 900,
                                                            }}
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <StatusChip
                                                            isActive={isActive}
                                                        />
                                                    </TableCell>

                                                    <TableCell
                                                        sx={{
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {formatDateTime(
                                                            p.created_at
                                                        )}
                                                    </TableCell>

                                                    <TableCell
                                                        sx={{
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                    >
                                                        {formatDateTime(
                                                            p.archived_at
                                                        )}
                                                    </TableCell>

                                                    <TableCell align="right">
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                gap: 1,
                                                                justifyContent:
                                                                    "flex-end",
                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >
                                                            {!isActive ? (
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        borderRadius: 3,
                                                                    }}
                                                                    onClick={() =>
                                                                        unarchive(
                                                                            p.id
                                                                        )
                                                                    }
                                                                >
                                                                    Unarchive
                                                                </Button>
                                                            ) : null}

                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                sx={{
                                                                    borderRadius: 3,
                                                                }}
                                                                onClick={() =>
                                                                    openEdit(p)
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

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
                                                            No policies found
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            Try another search
                                                            query or change the
                                                            status filter.
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
                </Paper>

                <AdminEditDrawer
                    open={open}
                    onClose={() => setOpen(false)}
                    title={editing?.id ? "Edit Policy" : "Create Policy"}
                    value={editing || {}}
                    onChange={setEditing}
                    onSave={save}
                    onDelete={del}
                    showDelete={Boolean(editing?.id)}
                    deleteLabel="Archive"
                    fields={[
                        { key: "title", label: "Title", required: true },
                        {
                            key: "category",
                            label: "Category",
                            required: true,
                            placeholder: "Borrowing / Payments / General",
                        },
                        {
                            key: "value",
                            label: "Policy content",
                            required: true,
                            multiline: true,
                            minRows: 5,
                        },
                    ]}
                />
            </AppShell>
        </RoleGuard>
    );
}

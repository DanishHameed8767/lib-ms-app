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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import AdminEditDrawer from "../../../components/AdminEditDrawer";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";

/** ✅ consistent radius (avoid MUI numeric multiplier “weird rounding”) */
const R = {
    card: "14px",
    soft: "12px",
    btn: "12px",
    chip: "999px",
};

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDaysISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return isoDate(d);
}

function StatusChip({ isActive }) {
    const active = Boolean(isActive);
    return (
        <Chip
            size="small"
            label={active ? "Active" : "Archived"}
            sx={{
                borderRadius: R.chip,
                fontWeight: 900,
                backgroundColor: active
                    ? "rgba(46,204,113,0.15)"
                    : "rgba(160,160,160,0.18)",
                color: active ? "#2ecc71" : "text.secondary",
            }}
        />
    );
}

function DateChip({ value }) {
    return (
        <Chip
            size="small"
            label={value || "—"}
            sx={{ borderRadius: R.chip, fontWeight: 900 }}
            variant="outlined"
        />
    );
}

export default function AdminAnnouncementsPage() {
    const { supabase } = useAuth();

    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const [q, setQ] = React.useState("");

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);
    const [saving, setSaving] = React.useState(false);

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase) return;

            if (!silent) setLoading(true);
            setError("");

            try {
                const { data, error: aErr } = await supabase
                    .from("announcements")
                    .select(
                        "id,title,description,expiration_date,is_active,archived_at,created_at"
                    )
                    .order("created_at", { ascending: false })
                    .limit(500);

                if (aErr) throw aErr;
                setRows(Array.isArray(data) ? data : []);
            } catch (e) {
                setError(e?.message || "Failed to load announcements");
                setRows([]);
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [supabase]
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

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return rows || [];
        return (rows || []).filter((a) => {
            return (
                String(a.title || "")
                    .toLowerCase()
                    .includes(query) ||
                String(a.description || "")
                    .toLowerCase()
                    .includes(query) ||
                String(a.expiration_date || "")
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [rows, q]);

    const openCreate = () => {
        setEditing({
            id: "",
            title: "",
            description: "",
            expirationDate: addDaysISO(30),
            is_active: true,
        });
        setOpen(true);
    };

    const openEdit = (a) => {
        setEditing({
            id: a.id,
            title: a.title || "",
            description: a.description || "",
            expirationDate: a.expiration_date || "",
            is_active: Boolean(a.is_active),
            created_at: a.created_at,
        });
        setOpen(true);
    };

    const save = async () => {
        if (!supabase) return;
        if (!editing) return;

        const title = String(editing.title || "").trim();
        const description = String(editing.description || "").trim();
        const expirationDate = editing.expirationDate || null;

        if (!title) return window.alert("Title is required");
        if (!description) return window.alert("Description is required");

        setSaving(true);
        try {
            if (!editing.id) {
                const { error: insErr } = await supabase
                    .from("announcements")
                    .insert({
                        title,
                        description,
                        expiration_date: expirationDate,
                        is_active: true,
                    });

                if (insErr) throw insErr;
            } else {
                const { error: upErr } = await supabase
                    .from("announcements")
                    .update({
                        title,
                        description,
                        expiration_date: expirationDate,
                        is_active: Boolean(editing.is_active),
                        archived_at: Boolean(editing.is_active)
                            ? null
                            : new Date().toISOString(),
                    })
                    .eq("id", editing.id);

                if (upErr) throw upErr;
            }

            setOpen(false);
            setEditing(null);
            await load({ silent: false });
        } catch (e) {
            window.alert(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    };

    // Archive (recommended) instead of delete
    const del = async () => {
        if (!supabase) return;
        if (!editing?.id) return;

        const ok = window.confirm("Archive this announcement?");
        if (!ok) return;

        setSaving(true);
        try {
            const { error: upErr } = await supabase
                .from("announcements")
                .update({
                    is_active: false,
                    archived_at: new Date().toISOString(),
                })
                .eq("id", editing.id);

            if (upErr) throw upErr;

            setOpen(false);
            setEditing(null);
            await load({ silent: false });
        } catch (e) {
            window.alert(e?.message || "Archive failed");
        } finally {
            setSaving(false);
        }
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AppShell title="Admin Announcements">
                {/* ✅ prevent page overflow / weird horizontal scroll */}
                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                    <PageHeader
                        title="Announcements"
                        subtitle="Create time-bound notices shown to users."
                        right={
                            <Button
                                variant="contained"
                                startIcon={<AddOutlinedIcon />}
                                sx={{ borderRadius: R.btn }}
                                onClick={openCreate}
                                disabled={saving}
                            >
                                New Announcement
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

                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            p: 1.25,
                            borderRadius: R.card,
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            alignItems: "center",
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search title / content / expiry…"
                            sx={{ width: { xs: "100%", sm: 520 }, minWidth: 0 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }} />
                        <Chip
                            icon={<CampaignOutlinedIcon />}
                            label={`${loading ? "…" : filtered.length} item(s)`}
                            sx={{ borderRadius: R.chip, fontWeight: 900 }}
                            variant="outlined"
                        />
                    </Paper>

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
                                All Announcements
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Live data • `announcements` table
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
                                <Typography sx={{ fontWeight: 900 }}>
                                    Loading…
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ width: "100%", overflowX: "auto" }}>
                                <Table
                                    size="small"
                                    sx={{
                                        minWidth: 980,
                                        "& th": {
                                            whiteSpace: "nowrap",
                                            fontWeight: 900,
                                        },
                                    }}
                                >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Title</TableCell>
                                            <TableCell>Expires</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created</TableCell>
                                            <TableCell align="right">
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>

                                    <TableBody>
                                        {filtered.map((a) => (
                                            <TableRow key={a.id} hover>
                                                <TableCell
                                                    sx={{
                                                        minWidth: 360,
                                                        maxWidth: 520,
                                                    }}
                                                >
                                                    <Typography
                                                        sx={{ fontWeight: 900 }}
                                                        noWrap
                                                        title={a.title || ""}
                                                    >
                                                        {a.title || "—"}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                            overflow: "hidden",
                                                            textOverflow:
                                                                "ellipsis",
                                                            whiteSpace:
                                                                "nowrap",
                                                        }}
                                                        title={
                                                            a.description || ""
                                                        }
                                                    >
                                                        {a.description || "—"}
                                                    </Typography>
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    <DateChip
                                                        value={
                                                            a.expiration_date
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell>
                                                    <StatusChip
                                                        isActive={a.is_active}
                                                    />
                                                </TableCell>

                                                <TableCell
                                                    sx={{
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    {a.created_at
                                                        ? new Date(
                                                              a.created_at
                                                          ).toLocaleDateString()
                                                        : "—"}
                                                </TableCell>

                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            borderRadius: R.btn,
                                                        }}
                                                        onClick={() =>
                                                            openEdit(a)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {filtered.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
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
                                                            No announcements
                                                            found
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            Try another search
                                                            query.
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

                    <AdminEditDrawer
                        open={open}
                        onClose={() => setOpen(false)}
                        title={
                            editing?.id
                                ? "Edit Announcement"
                                : "Create Announcement"
                        }
                        value={editing || {}}
                        onChange={setEditing}
                        onSave={save}
                        onDelete={del}
                        showDelete={Boolean(editing?.id)}
                        saving={saving} // harmless if drawer ignores
                        fields={[
                            { key: "title", label: "Title", required: true },
                            {
                                key: "description",
                                label: "Description",
                                required: true,
                                multiline: true,
                                minRows: 4,
                            },
                            {
                                key: "expirationDate",
                                label: "Expiration date",
                                required: true,
                                type: "date",
                            },
                        ]}
                    />
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

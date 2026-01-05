"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Button,
    TextField,
    Chip,
    Card,
    CardContent,
    Alert,
    CircularProgress,
} from "@mui/material";
import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import BranchTimingEditor from "../../../components/BranchTimingEditor";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

/** ✅ Use explicit px radii so it doesn't become “weirdly round” via theme units */
const R = {
    paper: 14,
    card: 14,
    soft: 12,
    btn: 12,
    chip: 999,
};

function toHHMM(t) {
    if (!t) return "";
    return String(t).slice(0, 5); // "HH:MM:SS" -> "HH:MM"
}

function buildEmptyTiming(branch) {
    return {
        branchId: branch?.id || "",
        branchName: branch?.name || "Branch",
        weekly: DAYS.map((d) => ({
            day: d,
            isClosed: false,
            open: "09:00",
            close: "17:00",
        })),
        overrides: [],
    };
}

function groupOverrides(rows) {
    const map = new Map();

    for (const r of rows) {
        const key = [
            r.start_date || "",
            r.end_date || "",
            String(Boolean(r.is_closed)),
            r.open_time || "",
            r.close_time || "",
        ].join("|");

        if (!map.has(key)) {
            map.set(key, {
                id: `ov_${(r.start_date || "na").replaceAll(
                    "-",
                    ""
                )}_${Math.random().toString(16).slice(2, 8)}`,
                startDate: r.start_date || "",
                endDate: r.end_date || "",
                isClosed: Boolean(r.is_closed),
                open: toHHMM(r.open_time),
                close: toHHMM(r.close_time),
                note: "",
            });
        }
    }

    return Array.from(map.values());
}

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function addDaysISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return isoDate(d);
}

export default function AdminBranchesPage() {
    const { supabase } = useAuth();

    const [branches, setBranches] = React.useState([]);
    const [branchesLoading, setBranchesLoading] = React.useState(true);
    const [branchesError, setBranchesError] = React.useState("");

    const [filterText, setFilterText] = React.useState("");
    const [activeBranchId, setActiveBranchId] = React.useState("");

    // branchId -> { branchId, branchName, weekly, overrides }
    const [timingsByBranch, setTimingsByBranch] = React.useState({});
    const [timingsLoading, setTimingsLoading] = React.useState(false);
    const [timingsError, setTimingsError] = React.useState("");

    const [saving, setSaving] = React.useState(false);
    const [dirty, setDirty] = React.useState(false);

    const filteredBranches = React.useMemo(() => {
        const q = filterText.trim().toLowerCase();
        if (!q) return branches;
        return branches.filter((b) => {
            return (
                String(b.name || "")
                    .toLowerCase()
                    .includes(q) ||
                String(b.address || "")
                    .toLowerCase()
                    .includes(q) ||
                String(b.id || "")
                    .toLowerCase()
                    .includes(q)
            );
        });
    }, [branches, filterText]);

    const activeBranch = React.useMemo(
        () => branches.find((b) => b.id === activeBranchId) || null,
        [branches, activeBranchId]
    );

    const activeValue = React.useMemo(() => {
        if (!activeBranch) return null;
        return (
            timingsByBranch[activeBranchId] || buildEmptyTiming(activeBranch)
        );
    }, [timingsByBranch, activeBranchId, activeBranch]);

    const loadBranches = React.useCallback(async () => {
        if (!supabase) return;

        setBranchesLoading(true);
        setBranchesError("");

        try {
            const { data, error } = await supabase
                .from("library_branches")
                .select("id, name, address, manager_id")
                .order("name", { ascending: true });

            if (error) throw error;

            setBranches(data || []);

            // default active branch once
            if (!activeBranchId && (data || []).length) {
                setActiveBranchId(data[0].id);
            }
        } catch (e) {
            setBranchesError(e?.message || "Failed to load branches");
        } finally {
            setBranchesLoading(false);
        }
    }, [supabase, activeBranchId]);

    const loadTimingsForBranch = React.useCallback(
        async (branchId, branchName, { force = false } = {}) => {
            if (!supabase || !branchId) return;

            if (!force && timingsByBranch[branchId]) return;

            setTimingsLoading(true);
            setTimingsError("");

            try {
                const { data, error } = await supabase
                    .from("timings")
                    .select(
                        "id, branch_id, day_of_week, start_date, end_date, open_time, close_time, is_closed"
                    )
                    .eq("branch_id", branchId);

                if (error) throw error;

                const rows = data || [];
                const weeklyRows = rows.filter(
                    (r) => !r.start_date && !r.end_date
                );
                const overrideRows = rows.filter(
                    (r) => r.start_date || r.end_date
                );

                const weekly = DAYS.map((day) => {
                    const r = weeklyRows.find(
                        (x) => String(x.day_of_week) === day
                    );
                    return {
                        day,
                        isClosed: Boolean(r?.is_closed),
                        open: toHHMM(r?.open_time) || "09:00",
                        close: toHHMM(r?.close_time) || "17:00",
                    };
                });

                const overrides = groupOverrides(overrideRows);

                setTimingsByBranch((prev) => ({
                    ...prev,
                    [branchId]: {
                        branchId,
                        branchName: branchName || "Branch",
                        weekly,
                        overrides,
                    },
                }));
            } catch (e) {
                setTimingsError(e?.message || "Failed to load timings");
            } finally {
                setTimingsLoading(false);
            }
        },
        [supabase, timingsByBranch]
    );

    React.useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    React.useEffect(() => {
        if (!activeBranchId || !activeBranch) return;
        loadTimingsForBranch(activeBranchId, activeBranch.name, {
            force: false,
        });
    }, [activeBranchId, activeBranch, loadTimingsForBranch]);

    const handleAddBranch = async () => {
        if (!supabase) return;
        const name = window.prompt("Branch name?");
        if (!name) return;

        const address = window.prompt("Branch address?") || "";

        try {
            const { data, error } = await supabase
                .from("library_branches")
                .insert([{ name: name.trim(), address: address.trim() }])
                .select("id, name, address, manager_id")
                .single();

            if (error) throw error;

            setBranches((prev) => [data, ...prev]);
            setActiveBranchId(data.id);
            setDirty(false);

            // seed empty timings in memory so editor isn't blank
            setTimingsByBranch((prev) => ({
                ...prev,
                [data.id]: buildEmptyTiming(data),
            }));
        } catch (e) {
            alert(e?.message || "Failed to add branch");
        }
    };

    const handleSave = async () => {
        if (!supabase) return;
        if (!activeBranchId || !activeValue) return;

        setSaving(true);
        setTimingsError("");

        try {
            const { error: delErr } = await supabase
                .from("timings")
                .delete()
                .eq("branch_id", activeBranchId);

            if (delErr) throw delErr;

            const weeklyRows = (activeValue.weekly || []).map((row) => ({
                branch_id: activeBranchId,
                day_of_week: row.day,
                start_date: null,
                end_date: null,
                is_closed: Boolean(row.isClosed),
                open_time: row.isClosed ? null : row.open || null,
                close_time: row.isClosed ? null : row.close || null,
            }));

            const overrideRows = (activeValue.overrides || []).flatMap((o) =>
                DAYS.map((day) => ({
                    branch_id: activeBranchId,
                    day_of_week: day,
                    start_date: o.startDate || null,
                    end_date: o.endDate || null,
                    is_closed: Boolean(o.isClosed),
                    open_time: o.isClosed ? null : o.open || null,
                    close_time: o.isClosed ? null : o.close || null,
                }))
            );

            const payload = [...weeklyRows, ...overrideRows];

            if (payload.length) {
                const { error: insErr } = await supabase
                    .from("timings")
                    .insert(payload);

                if (insErr) throw insErr;
            }

            setDirty(false);

            // force reload
            const branchName = activeBranch?.name || "Branch";
            setTimingsByBranch((prev) => {
                const next = { ...prev };
                delete next[activeBranchId];
                return next;
            });
            await loadTimingsForBranch(activeBranchId, branchName, {
                force: true,
            });

            alert("Saved ✅");
        } catch (e) {
            setTimingsError(e?.message || "Failed to save timings");
        } finally {
            setSaving(false);
        }
    };

    const showTimingsSkeleton =
        timingsLoading && !timingsByBranch[activeBranchId];

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN]}>
            <AppShell title="Branches & Hours">
                {/* ✅ prevent “gone out of screen” / weird overflows */}
                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                    <PageHeader
                        title="Branches & Hours"
                        subtitle="Manage library branches and operating hours."
                        right={
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Button
                                    variant="outlined"
                                    startIcon={<AddBusinessOutlinedIcon />}
                                    sx={{ borderRadius: `${R.btn}px` }}
                                    onClick={handleAddBranch}
                                    disabled={branchesLoading || saving}
                                >
                                    Add Branch
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<SaveOutlinedIcon />}
                                    sx={{ borderRadius: `${R.btn}px` }}
                                    onClick={handleSave}
                                    disabled={
                                        saving ||
                                        branchesLoading ||
                                        timingsLoading ||
                                        !activeBranchId ||
                                        !dirty
                                    }
                                >
                                    {saving ? "Saving…" : "Save Changes"}
                                </Button>
                            </Box>
                        }
                    />

                    {branchesError ? (
                        <Alert
                            severity="error"
                            sx={{ mt: 2, borderRadius: `${R.soft}px` }}
                        >
                            {branchesError}
                        </Alert>
                    ) : null}

                    {timingsError ? (
                        <Alert
                            severity="error"
                            sx={{
                                mt: branchesError ? 1 : 2,
                                borderRadius: `${R.soft}px`,
                            }}
                        >
                            {timingsError}
                        </Alert>
                    ) : null}

                    <Box
                        sx={{
                            mt: 2,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" },
                            gap: 2,
                            alignItems: "start",
                            minWidth: 0,
                        }}
                    >
                        {/* Left: Branch list */}
                        <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: `${R.paper}px`,
                                overflow: "hidden",
                                minWidth: 0,
                            }}
                        >
                            <Box sx={{ p: 2 }}>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Branches
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.25 }}
                                >
                                    Select a branch to edit hours
                                </Typography>

                                <TextField
                                    label="Quick filter"
                                    placeholder="Type…"
                                    fullWidth
                                    sx={{ mt: 1.5 }}
                                    value={filterText}
                                    onChange={(e) =>
                                        setFilterText(e.target.value)
                                    }
                                />
                            </Box>

                            <Divider />

                            {branchesLoading ? (
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
                                        Loading branches…
                                    </Typography>
                                </Box>
                            ) : (
                                <List dense sx={{ p: 1 }}>
                                    {filteredBranches.map((b) => {
                                        const selected =
                                            b.id === activeBranchId;
                                        return (
                                            <ListItemButton
                                                key={b.id}
                                                onClick={() => {
                                                    setActiveBranchId(b.id);
                                                }}
                                                sx={{
                                                    borderRadius: `${R.soft}px`,
                                                    mb: 0.5,
                                                    minWidth: 0,
                                                    backgroundColor: selected
                                                        ? "action.selected"
                                                        : "transparent",
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 900,
                                                            }}
                                                            noWrap
                                                        >
                                                            {b.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: "text.secondary",
                                                            }}
                                                            noWrap
                                                        >
                                                            {b.address || b.id}
                                                        </Typography>
                                                    }
                                                />
                                                <Chip
                                                    size="small"
                                                    label={
                                                        selected
                                                            ? "Editing"
                                                            : "View"
                                                    }
                                                    sx={{
                                                        borderRadius: `${R.chip}px`,
                                                        fontWeight: 900,
                                                    }}
                                                />
                                            </ListItemButton>
                                        );
                                    })}

                                    {filteredBranches.length === 0 ? (
                                        <Box sx={{ p: 2 }}>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                No branches
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                Try a different filter.
                                            </Typography>
                                        </Box>
                                    ) : null}
                                </List>
                            )}
                        </Paper>

                        {/* Right: Editor */}
                        <Box sx={{ display: "grid", gap: 2, minWidth: 0 }}>
                            <Card
                                sx={{
                                    borderRadius: `${R.card}px`,
                                    minWidth: 0,
                                }}
                            >
                                <CardContent
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        minWidth: 0,
                                        flexWrap: "wrap",
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
                                            {activeValue?.branchName ||
                                                "Branch"}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            Configure weekly hours and date
                                            overrides
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={
                                            dirty ? "Unsaved changes" : "Synced"
                                        }
                                        sx={{
                                            borderRadius: `${R.chip}px`,
                                            fontWeight: 900,
                                            backgroundColor: dirty
                                                ? "rgba(255,106,61,0.15)"
                                                : "action.selected",
                                        }}
                                    />
                                </CardContent>
                            </Card>

                            {showTimingsSkeleton ? (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: `${R.paper}px`,
                                        p: 3,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1.25,
                                            alignItems: "center",
                                        }}
                                    >
                                        <CircularProgress size={18} />
                                        <Typography sx={{ fontWeight: 900 }}>
                                            Loading timings…
                                        </Typography>
                                    </Box>
                                </Paper>
                            ) : activeValue ? (
                                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                                    <BranchTimingEditor
                                        value={activeValue}
                                        onChange={(next) => {
                                            setDirty(true);
                                            setTimingsByBranch((prev) => ({
                                                ...prev,
                                                [activeBranchId]: next,
                                            }));
                                        }}
                                    />
                                </Box>
                            ) : (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: `${R.paper}px`,
                                        p: 3,
                                    }}
                                >
                                    <Typography sx={{ fontWeight: 900 }}>
                                        No data
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                    >
                                        Select a branch to view/edit timings.
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    </Box>
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

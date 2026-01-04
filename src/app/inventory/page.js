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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import AdminEditDrawer from "../../components/AdminEditDrawer";
import { mockInventoryItems } from "../../lib/mock/inventory";

function StockChip({ stock }) {
    const tone = stock <= 10 ? "danger" : stock <= 25 ? "warn" : "ok";
    const map = {
        ok: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        warn: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        danger: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
    };
    const s = map[tone];

    return (
        <Chip
            size="small"
            label={`Stock ${stock}`}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

export default function InventoryPage() {
    const [rows, setRows] = React.useState(mockInventoryItems);
    const [q, setQ] = React.useState("");

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);

    const filtered = rows.filter((it) => {
        const query = q.trim().toLowerCase();
        if (!query) return true;
        return (
            it.name.toLowerCase().includes(query) ||
            it.id.toLowerCase().includes(query)
        );
    });

    const openCreate = () => {
        setEditing({ id: "", name: "", price: 0, stock: 0 });
        setOpen(true);
    };

    const openEdit = (it) => {
        setEditing({ ...it });
        setOpen(true);
    };

    const save = () => {
        setRows((prev) => {
            const isNew = !editing.id;
            const next = {
                ...editing,
                price: Number(editing.price || 0),
                stock: Number(editing.stock || 0),
                id: isNew
                    ? `inv_${Math.random().toString(16).slice(2, 6)}`
                    : editing.id,
            };
            if (isNew) return [next, ...prev];
            return prev.map((x) => (x.id === editing.id ? next : x));
        });
    };

    const del = () => {
        if (!editing?.id) return;
        setRows((prev) => prev.filter((x) => x.id !== editing.id));
        setOpen(false);
    };

    return (
        <AppShell title="Inventory">
            <PageHeader
                title="Inventory Items"
                subtitle="Manage non-book inventory (cards, supplies, etc.)."
                right={
                    <Button
                        variant="contained"
                        startIcon={<AddOutlinedIcon />}
                        sx={{ borderRadius: 3 }}
                        onClick={openCreate}
                    >
                        New Item
                    </Button>
                }
            />

            <Paper
                variant="outlined"
                sx={{
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
                    placeholder="Search inventory items…"
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
                <Chip
                    label={`${filtered.length} item(s)`}
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
                        Items ({filtered.length})
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.25 }}
                    >
                        UI-only demo • later connects to `inventory_items` table
                    </Typography>
                </Box>

                <Divider />

                <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 980 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Stock</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filtered.map((it) => (
                                <TableRow key={it.id} hover>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 900 }}>
                                            {it.name}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            {it.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>
                                        ${Number(it.price || 0).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <StockChip stock={it.stock} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{ borderRadius: 3 }}
                                            onClick={() => openEdit(it)}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} sx={{ py: 6 }}>
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                No items found
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                }}
                                            >
                                                Try another search query.
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            <AdminEditDrawer
                open={open}
                onClose={() => setOpen(false)}
                title={
                    editing?.id
                        ? "Edit Inventory Item"
                        : "Create Inventory Item"
                }
                value={editing || {}}
                onChange={setEditing}
                onSave={save}
                onDelete={del}
                showDelete={Boolean(editing?.id)}
                fields={[
                    { key: "name", label: "Item name", required: true },
                    {
                        key: "price",
                        label: "Price",
                        required: true,
                        type: "number",
                    },
                    {
                        key: "stock",
                        label: "Stock",
                        required: true,
                        type: "number",
                    },
                ]}
            />
        </AppShell>
    );
}

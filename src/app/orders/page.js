"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    TextField,
    InputAdornment,
    MenuItem,
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
import { mockOrders, fmtDT } from "../../lib/mock/orders";

function StatusChip({ status }) {
    const map = {
        Pending: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        Received: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
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

export default function OrdersPage() {
    const [rows, setRows] = React.useState(mockOrders);
    const [q, setQ] = React.useState("");
    const [status, setStatus] = React.useState("All");

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);

    const filtered = rows.filter((o) => {
        const query = q.trim().toLowerCase();
        const matchesQuery =
            !query ||
            o.bookTitle.toLowerCase().includes(query) ||
            o.id.toLowerCase().includes(query);
        const matchesStatus = status === "All" ? true : o.status === status;
        return matchesQuery && matchesStatus;
    });

    const openCreate = () => {
        setEditing({
            id: "",
            bookTitle: "",
            quantity: 1,
            status: "Pending",
            orderedBy: "you",
        });
        setOpen(true);
    };

    const openEdit = (o) => {
        setEditing({ ...o });
        setOpen(true);
    };

    const save = () => {
        setRows((prev) => {
            const isNew = !editing.id;
            const next = {
                ...editing,
                quantity: Number(editing.quantity || 1),
                id: isNew
                    ? `ord_${Math.random().toString(16).slice(2, 6)}`
                    : editing.id,
                orderDate: isNew ? new Date().toISOString() : editing.orderDate,
            };
            if (isNew) return [next, ...prev];
            return prev.map((x) => (x.id === editing.id ? next : x));
        });
    };

    return (
        <AppShell title="Orders">
            <PageHeader
                title="Orders"
                subtitle="Create and track book procurement orders."
                right={
                    <Button
                        variant="contained"
                        startIcon={<AddOutlinedIcon />}
                        sx={{ borderRadius: 3 }}
                        onClick={openCreate}
                    >
                        New Order
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
                    placeholder="Search order ID / title…"
                    sx={{ width: { xs: "100%", sm: 420 } }}
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
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    sx={{ width: { xs: "100%", sm: 220 } }}
                >
                    {["All", "Pending", "Received", "Cancelled"].map((s) => (
                        <MenuItem key={s} value={s}>
                            {s}
                        </MenuItem>
                    ))}
                </TextField>
            </Paper>

            <Paper
                variant="outlined"
                sx={{ mt: 2, borderRadius: 4, overflow: "hidden" }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 900 }}>
                        Orders ({filtered.length})
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.25 }}
                    >
                        UI-only demo • later connects to `orders` table
                    </Typography>
                </Box>

                <Divider />

                <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 980 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order ID</TableCell>
                                <TableCell>Book title</TableCell>
                                <TableCell>Qty</TableCell>
                                <TableCell>Ordered by</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filtered.map((o) => (
                                <TableRow key={o.id} hover>
                                    <TableCell sx={{ fontWeight: 900 }}>
                                        {o.id}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 900 }}>
                                        {o.bookTitle}
                                    </TableCell>
                                    <TableCell>{o.quantity}</TableCell>
                                    <TableCell>{o.orderedBy}</TableCell>
                                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                                        {fmtDT(o.orderDate)}
                                    </TableCell>
                                    <TableCell>
                                        <StatusChip status={o.status} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            sx={{ borderRadius: 3 }}
                                            onClick={() => openEdit(o)}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ py: 6 }}>
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                No orders found
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                }}
                                            >
                                                Try another filter or search
                                                query.
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
                title={editing?.id ? "Edit Order" : "Create Order"}
                value={editing || {}}
                onChange={setEditing}
                onSave={save}
                fields={[
                    { key: "bookTitle", label: "Book title", required: true },
                    {
                        key: "quantity",
                        label: "Quantity",
                        required: true,
                        type: "number",
                    },
                    {
                        key: "status",
                        label: "Status",
                        required: true,
                        placeholder: "Pending / Received / Cancelled",
                    },
                    { key: "orderedBy", label: "Ordered by", required: true },
                ]}
            />
        </AppShell>
    );
}

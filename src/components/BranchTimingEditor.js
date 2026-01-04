"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Switch,
    TextField,
    Button,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

function ClosedChip() {
    return (
        <Chip
            size="small"
            label="Closed"
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: "rgba(231,76,60,0.15)",
                color: "#e74c3c",
            }}
        />
    );
}

export default function BranchTimingEditor({ value, onChange }) {
    const data = React.useMemo(() => {
        const weekly = Array.isArray(value?.weekly) ? value.weekly : [];
        const overrides = Array.isArray(value?.overrides)
            ? value.overrides
            : [];
        return { ...value, weekly, overrides };
    }, [value]);

    const updateWeekly = (index, patch) => {
        const weekly = data.weekly.map((row, i) =>
            i === index ? { ...row, ...patch } : row
        );
        onChange?.({ ...data, weekly });
    };

    const addOverride = () => {
        const overrides = [
            ...data.overrides,
            {
                id: `ov_${Math.random().toString(16).slice(2, 8)}`,
                startDate: "2026-01-15",
                endDate: "2026-01-15",
                isClosed: true,
                open: "",
                close: "",
                note: "New override",
            },
        ];
        onChange?.({ ...data, overrides });
    };

    const updateOverride = (id, patch) => {
        const overrides = data.overrides.map((o) =>
            o.id === id ? { ...o, ...patch } : o
        );
        onChange?.({ ...data, overrides });
    };

    const deleteOverride = (id) => {
        const overrides = data.overrides.filter((o) => o.id !== id);
        onChange?.({ ...data, overrides });
    };

    return (
        <Box sx={{ display: "grid", gap: 2 }}>
            {/* Weekly schedule */}
            <Paper
                variant="outlined"
                sx={{ borderRadius: 4, overflow: "hidden" }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 900 }}>
                        Weekly Hours
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.25 }}
                    >
                        Standard operating hours per weekday.
                    </Typography>
                </Box>

                <Divider />

                <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 860 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Day</TableCell>
                                <TableCell>Closed</TableCell>
                                <TableCell>Open time</TableCell>
                                <TableCell>Close time</TableCell>
                                <TableCell align="right">Preview</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.weekly.map((row, idx) => (
                                <TableRow key={row.day || idx} hover>
                                    <TableCell sx={{ fontWeight: 900 }}>
                                        {row.day}
                                    </TableCell>

                                    <TableCell>
                                        <Switch
                                            checked={Boolean(row.isClosed)}
                                            onChange={(e) =>
                                                updateWeekly(idx, {
                                                    isClosed: e.target.checked,
                                                })
                                            }
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <TextField
                                            type="time"
                                            value={row.open || ""}
                                            disabled={row.isClosed}
                                            onChange={(e) =>
                                                updateWeekly(idx, {
                                                    open: e.target.value,
                                                })
                                            }
                                            sx={{ width: 140 }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <TextField
                                            type="time"
                                            value={row.close || ""}
                                            disabled={row.isClosed}
                                            onChange={(e) =>
                                                updateWeekly(idx, {
                                                    close: e.target.value,
                                                })
                                            }
                                            sx={{ width: 140 }}
                                        />
                                    </TableCell>

                                    <TableCell align="right">
                                        {row.isClosed ? (
                                            <ClosedChip />
                                        ) : (
                                            <Chip
                                                size="small"
                                                label={`${
                                                    row.open || "--:--"
                                                } – ${row.close || "--:--"}`}
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 900,
                                                }}
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>

            {/* Date overrides */}
            <Paper
                variant="outlined"
                sx={{ borderRadius: 4, overflow: "hidden" }}
            >
                <Box
                    sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography sx={{ fontWeight: 900 }}>
                            Date Overrides
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Temporary closures or special hours (e.g.,
                            holidays).
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        startIcon={<AddOutlinedIcon />}
                        sx={{ borderRadius: 3 }}
                        onClick={addOverride}
                    >
                        Add Override
                    </Button>
                </Box>

                <Divider />

                <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 980 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Start date</TableCell>
                                <TableCell>End date</TableCell>
                                <TableCell>Closed</TableCell>
                                <TableCell>Open</TableCell>
                                <TableCell>Close</TableCell>
                                <TableCell>Note</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {data.overrides.map((o) => (
                                <TableRow key={o.id} hover>
                                    <TableCell>
                                        <TextField
                                            type="date"
                                            value={o.startDate || ""}
                                            onChange={(e) =>
                                                updateOverride(o.id, {
                                                    startDate: e.target.value,
                                                })
                                            }
                                            sx={{ width: 160 }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <TextField
                                            type="date"
                                            value={o.endDate || ""}
                                            onChange={(e) =>
                                                updateOverride(o.id, {
                                                    endDate: e.target.value,
                                                })
                                            }
                                            sx={{ width: 160 }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Switch
                                            checked={Boolean(o.isClosed)}
                                            onChange={(e) =>
                                                updateOverride(o.id, {
                                                    isClosed: e.target.checked,
                                                })
                                            }
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <TextField
                                            type="time"
                                            value={o.open || ""}
                                            disabled={o.isClosed}
                                            onChange={(e) =>
                                                updateOverride(o.id, {
                                                    open: e.target.value,
                                                })
                                            }
                                            sx={{ width: 140 }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <TextField
                                            type="time"
                                            value={o.close || ""}
                                            disabled={o.isClosed}
                                            onChange={(e) =>
                                                updateOverride(o.id, {
                                                    close: e.target.value,
                                                })
                                            }
                                            sx={{ width: 140 }}
                                        />
                                    </TableCell>

                                    <TableCell sx={{ minWidth: 240 }}>
                                        <TextField
                                            value={o.note || ""}
                                            onChange={(e) =>
                                                updateOverride(o.id, {
                                                    note: e.target.value,
                                                })
                                            }
                                            placeholder="Reason / note"
                                            fullWidth
                                        />
                                    </TableCell>

                                    <TableCell align="right">
                                        <Tooltip title="Delete override">
                                            <IconButton
                                                onClick={() =>
                                                    deleteOverride(o.id)
                                                }
                                                aria-label="delete"
                                            >
                                                <DeleteOutlineOutlinedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {data.overrides.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{ py: 6 }}>
                                        <Box sx={{ textAlign: "center" }}>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                No overrides
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                }}
                                            >
                                                Add an override for holidays or
                                                special hours.
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : null}
                        </TableBody>
                    </Table>
                </Box>
            </Paper>
        </Box>
    );
}

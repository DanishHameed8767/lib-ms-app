"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { searchReaders } from "../lib/mock/readers";

function Badge({ label, tone = "default" }) {
    const map = {
        default: { bg: "action.selected", fg: "text.primary" },
        warn: { bg: "rgba(255,106,61,0.15)", fg: "primary.main" },
        danger: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        ok: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
    };
    const s = map[tone] || map.default;

    return (
        <Chip
            size="small"
            label={label}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

export default function ReaderLookupPanel({ selected, onSelect }) {
    const [q, setQ] = React.useState("");
    const results = React.useMemo(() => searchReaders(q), [q]);

    return (
        <Paper variant="outlined" sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 900 }}>Reader</Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.25 }}
                >
                    Search and select a member
                </Typography>

                <TextField
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search username / email…"
                    fullWidth
                    sx={{ mt: 1.5 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Divider />

            <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                <List dense sx={{ p: 1 }}>
                    {results.map((r) => {
                        const active = selected?.id === r.id;
                        return (
                            <ListItemButton
                                key={r.id}
                                onClick={() => onSelect?.(r)}
                                sx={{
                                    borderRadius: 3,
                                    mb: 0.5,
                                    backgroundColor: active
                                        ? "action.selected"
                                        : "transparent",
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Typography
                                            sx={{ fontWeight: 900 }}
                                            noWrap
                                        >
                                            {r.fullName}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                            noWrap
                                        >
                                            @{r.username}
                                        </Typography>
                                    }
                                />
                                <Badge
                                    label={
                                        r.unpaidFinesCount > 0
                                            ? `Fines ${r.unpaidFinesCount}`
                                            : "No fines"
                                    }
                                    tone={
                                        r.unpaidFinesCount > 0 ? "danger" : "ok"
                                    }
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
                {selected ? (
                    <Box sx={{ display: "grid", gap: 1 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Selected
                        </Typography>

                        <Paper
                            variant="outlined"
                            sx={{ p: 1.5, borderRadius: 3 }}
                        >
                            <Typography sx={{ fontWeight: 900 }}>
                                {selected.fullName}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                @{selected.username} • {selected.email}
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                    mt: 1.25,
                                }}
                            >
                                <Badge
                                    label={`Plan: ${selected.planName}`}
                                    tone="warn"
                                />
                                <Badge
                                    label={`Expires: ${selected.planExpires}`}
                                />
                                <Badge
                                    label={`Borrow: ${selected.activeBorrows}/${selected.borrowLimit}`}
                                />
                            </Box>

                            {selected.unpaidFinesCount > 0 ? (
                                <Box sx={{ mt: 1.25 }}>
                                    <Badge
                                        label={`Outstanding: $${Number(
                                            selected.unpaidFinesAmount
                                        ).toFixed(2)}`}
                                        tone="danger"
                                    />
                                </Box>
                            ) : null}
                        </Paper>
                    </Box>
                ) : (
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                    >
                        No reader selected.
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}

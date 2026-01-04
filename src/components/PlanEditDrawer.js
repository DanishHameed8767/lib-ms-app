"use client";

import * as React from "react";
import {
    Drawer,
    Box,
    Typography,
    Divider,
    IconButton,
    TextField,
    Button,
    Stack,
    FormControlLabel,
    Switch,
    Alert,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

export default function PlanEditDrawer({
    open,
    onClose,
    value,
    onChange,
    onSave,
    onDeactivate,
    saving = false,
    error = "",
    showDeactivate = false,
}) {
    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        if (open) setErrors({});
    }, [open, value?.id]);

    const validate = () => {
        const next = {};
        const name = String(value?.name || "").trim();

        if (!name) next.name = "Name is required";

        if (num(value?.price, -1) < 0) next.price = "Price must be ≥ 0";
        if (num(value?.borrow_limit, -1) < 0)
            next.borrow_limit = "Borrow limit must be ≥ 0";
        if (num(value?.borrow_duration_days, 0) < 1)
            next.borrow_duration_days = "Duration must be ≥ 1 day";
        if (num(value?.fine_amount_per_day, -1) < 0)
            next.fine_amount_per_day = "Fine/day must be ≥ 0";
        if (num(value?.grace_period_days, -1) < 0)
            next.grace_period_days = "Grace period must be ≥ 0";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        await onSave?.();
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 560 },
                    borderTopLeftRadius: { xs: 0, sm: 24 },
                    borderBottomLeftRadius: { xs: 0, sm: 24 },
                },
            }}
        >
            <Box
                sx={{
                    p: 2.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {value?.id ? "Edit Plan" : "Create Plan"}
                </Typography>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseOutlinedIcon />
                </IconButton>
            </Box>

            <Divider />

            <Box sx={{ p: 2.25, display: "grid", gap: 2 }}>
                {error ? <Alert severity="error">{error}</Alert> : null}

                <Stack spacing={1.5}>
                    <TextField
                        label="Plan name"
                        value={value?.name ?? ""}
                        onChange={(e) =>
                            onChange?.({ ...value, name: e.target.value })
                        }
                        error={Boolean(errors.name)}
                        helperText={errors.name || " "}
                        required
                        fullWidth
                    />

                    <TextField
                        label="Price"
                        type="number"
                        value={value?.price ?? 0}
                        onChange={(e) =>
                            onChange?.({
                                ...value,
                                price: e.target.value,
                            })
                        }
                        inputProps={{ min: 0, step: "0.01" }}
                        error={Boolean(errors.price)}
                        helperText={errors.price || " "}
                        fullWidth
                    />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1.5,
                        }}
                    >
                        <TextField
                            label="Borrow limit"
                            type="number"
                            value={value?.borrow_limit ?? 0}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    borrow_limit: e.target.value,
                                })
                            }
                            inputProps={{ min: 0, step: "1" }}
                            error={Boolean(errors.borrow_limit)}
                            helperText={errors.borrow_limit || " "}
                        />

                        <TextField
                            label="Borrow duration (days)"
                            type="number"
                            value={value?.borrow_duration_days ?? 14}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    borrow_duration_days: e.target.value,
                                })
                            }
                            inputProps={{ min: 1, step: "1" }}
                            error={Boolean(errors.borrow_duration_days)}
                            helperText={errors.borrow_duration_days || " "}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1.5,
                        }}
                    >
                        <TextField
                            label="Fine amount per day"
                            type="number"
                            value={value?.fine_amount_per_day ?? 0}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    fine_amount_per_day: e.target.value,
                                })
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                            error={Boolean(errors.fine_amount_per_day)}
                            helperText={errors.fine_amount_per_day || " "}
                        />

                        <TextField
                            label="Grace period (days)"
                            type="number"
                            value={value?.grace_period_days ?? 0}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    grace_period_days: e.target.value,
                                })
                            }
                            inputProps={{ min: 0, step: "1" }}
                            error={Boolean(errors.grace_period_days)}
                            helperText={errors.grace_period_days || " "}
                        />
                    </Box>

                    <TextField
                        label="Description"
                        value={value?.description ?? ""}
                        onChange={(e) =>
                            onChange?.({
                                ...value,
                                description: e.target.value,
                            })
                        }
                        fullWidth
                        multiline
                        minRows={3}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={Boolean(value?.is_active)}
                                onChange={(e) =>
                                    onChange?.({
                                        ...value,
                                        is_active: e.target.checked,
                                    })
                                }
                            />
                        }
                        label="Active"
                    />
                </Stack>

                <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
                >
                    {showDeactivate ? (
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ borderRadius: 3 }}
                            disabled={saving}
                            onClick={onDeactivate}
                        >
                            Deactivate
                        </Button>
                    ) : null}

                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 3 }}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        sx={{ borderRadius: 3 }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}

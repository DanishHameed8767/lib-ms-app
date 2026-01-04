"use client";

import * as React from "react";
import {
    Drawer,
    Box,
    Typography,
    Divider,
    IconButton,
    Button,
    TextField,
    Stack,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

export default function AdminEditDrawer({
    open,
    onClose,
    title = "Edit",
    fields = [], // [{key,label,type,selectOptions,required,placeholder}]
    value = {},
    onChange,
    onSave,
    onDelete,
    saveLabel = "Save",
    deleteLabel = "Delete",
    showDelete = false,
}) {
    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        setErrors({});
    }, [open]);

    const validate = () => {
        const next = {};
        for (const f of fields) {
            if (f.required && !String(value?.[f.key] || "").trim()) {
                next[f.key] = `${f.label} is required`;
            }
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave?.();
        onClose?.();
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
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {title}
                </Typography>
                <IconButton onClick={onClose} aria-label="close">
                    <CloseOutlinedIcon />
                </IconButton>
            </Box>

            <Divider />

            <Box sx={{ p: 2.25 }}>
                <Stack spacing={1.5}>
                    {fields.map((f) => (
                        <TextField
                            key={f.key}
                            label={f.label}
                            value={value?.[f.key] ?? ""}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    [f.key]: e.target.value,
                                })
                            }
                            type={f.type || "text"}
                            placeholder={f.placeholder}
                            required={Boolean(f.required)}
                            select={Boolean(f.selectOptions)}
                            multiline={Boolean(f.multiline)}
                            minRows={f.minRows || (f.multiline ? 3 : undefined)}
                            error={Boolean(errors[f.key])}
                            helperText={errors[f.key] || " "}
                            fullWidth
                        >
                            {f.selectOptions
                                ? f.selectOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                          {opt}
                                      </option>
                                  ))
                                : null}
                        </TextField>
                    ))}
                </Stack>

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        mt: 1,
                    }}
                >
                    {showDelete ? (
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ borderRadius: 3 }}
                            onClick={onDelete}
                        >
                            {deleteLabel}
                        </Button>
                    ) : null}
                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 3 }}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ borderRadius: 3 }}
                        onClick={handleSave}
                    >
                        {saveLabel}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}

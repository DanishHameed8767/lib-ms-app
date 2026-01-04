"use client";

import * as React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Chip,
    Divider,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

export default function UploadReceiptDialog({
    open,
    onClose,
    title = "Upload receipt",
    amountLabel = "",
    onSubmit,
}) {
    const [fileName, setFileName] = React.useState("");
    const [previewUrl, setPreviewUrl] = React.useState("");
    const [note, setNote] = React.useState("");
    const [file, setFile] = React.useState(null);
    const [submitting, setSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (!open) {
            setFileName("");
            setPreviewUrl("");
            setNote("");
            setFile(null);
            setSubmitting(false);
        }
    }, [open]);

    const handleSubmit = async () => {
        if (!file) return;
        setSubmitting(true);
        try {
            await onSubmit?.({ file, fileName, previewUrl, note });
            onClose?.();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2 }}>
                {amountLabel ? (
                    <Chip
                        label={amountLabel}
                        sx={{ borderRadius: 3, fontWeight: 900, mb: 2 }}
                        variant="outlined"
                    />
                ) : null}

                <Box
                    sx={{
                        border: "1px dashed",
                        borderColor: "divider",
                        borderRadius: 3,
                        p: 2,
                        display: "grid",
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            height: 220,
                            borderRadius: 3,
                            overflow: "hidden",
                            backgroundColor: "action.hover",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        {previewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewUrl}
                                alt="receipt preview"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        ) : (
                            <Box sx={{ textAlign: "center" }}>
                                <ImageOutlinedIcon sx={{ opacity: 0.6 }} />
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 1 }}
                                >
                                    Upload receipt image / pdf
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<CloudUploadOutlinedIcon />}
                            sx={{ borderRadius: 3 }}
                        >
                            Choose file
                            <input
                                hidden
                                type="file"
                                accept=".png,.jpg,.jpeg,.webp,.pdf"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (!f) return;
                                    setFile(f);
                                    setFileName(f.name);
                                    const url = URL.createObjectURL(f);
                                    setPreviewUrl(url);
                                }}
                            />
                        </Button>

                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            {fileName || "No file selected"}
                        </Typography>
                    </Box>
                </Box>

                <TextField
                    label="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add reference number, payment method, etc."
                    fullWidth
                    multiline
                    minRows={3}
                    sx={{ mt: 2 }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
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
                    onClick={handleSubmit}
                    disabled={!file || submitting}
                >
                    {submitting ? "Submitting…" : "Submit for approval"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

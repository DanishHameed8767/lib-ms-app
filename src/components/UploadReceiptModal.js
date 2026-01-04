"use client";

import * as React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    TextField,
    MenuItem,
    Button,
    Box,
    Paper,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

export default function UploadReceiptModal({
    open,
    onClose,
    entityLabel, // e.g. "Fine #fine_001"
    defaultAmount = 0,
    onSubmit, // UI-only callback
}) {
    const [amount, setAmount] = React.useState(defaultAmount);
    const [method, setMethod] = React.useState("Bank transfer");
    const [file, setFile] = React.useState(null);
    const [error, setError] = React.useState("");

    React.useEffect(() => {
        setAmount(defaultAmount);
        setMethod("Bank transfer");
        setFile(null);
        setError("");
    }, [open, defaultAmount]);

    const handleSubmit = () => {
        if (!amount || Number(amount) <= 0) {
            setError("Amount must be greater than 0.");
            return;
        }
        if (!file) {
            setError("Please upload a receipt file.");
            return;
        }
        setError("");
        onSubmit?.({ amount: Number(amount), method, file });
        onClose?.();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 900 }}>Upload Receipt</DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Entity: <b>{entityLabel}</b>
                </Typography>

                <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                    <TextField
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputProps={{ min: 0, step: "0.01" }}
                        fullWidth
                    />

                    <TextField
                        select
                        label="Payment method"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                    >
                        {[
                            "Bank transfer",
                            "UPI",
                            "Cash deposit",
                            "Card",
                            "Other",
                        ].map((m) => (
                            <MenuItem key={m} value={m}>
                                {m}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Paper
                        variant="outlined"
                        sx={{
                            borderRadius: 4,
                            p: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 900 }}>
                                Receipt file
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                PNG/JPG/PDF (UI-only)
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                    display: "block",
                                    mt: 0.5,
                                }}
                            >
                                {file ? file.name : "No file selected"}
                            </Typography>
                        </Box>

                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<CloudUploadOutlinedIcon />}
                            sx={{ borderRadius: 3 }}
                        >
                            Choose
                            <input
                                hidden
                                type="file"
                                accept=".png,.jpg,.jpeg,.pdf"
                                onChange={(e) =>
                                    setFile(e.target.files?.[0] || null)
                                }
                            />
                        </Button>
                    </Paper>

                    {error ? (
                        <Typography
                            variant="body2"
                            sx={{ color: "error.main" }}
                        >
                            {error}
                        </Typography>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Your receipt will be reviewed before the payment is
                            approved.
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ borderRadius: 3 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    sx={{ borderRadius: 3 }}
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
}

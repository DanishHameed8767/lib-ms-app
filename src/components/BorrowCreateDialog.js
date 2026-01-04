"use client";

import * as React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    Chip,
} from "@mui/material";
import {
    listBranches,
    searchReaders,
    searchBooks,
    createBorrowForReader,
} from "@/lib/supabase/staffBorrowApi";

function SmallRow({ label, value }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{ fontWeight: 800, textAlign: "right" }}
            >
                {value}
            </Typography>
        </Box>
    );
}

export default function BorrowCreateDialog({
    open,
    onClose,
    supabase,
    onCreated,
}) {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");

    const [branches, setBranches] = React.useState([]);
    const [branchId, setBranchId] = React.useState("");

    const [readerQ, setReaderQ] = React.useState("");
    const [readerHits, setReaderHits] = React.useState([]);
    const [reader, setReader] = React.useState(null);

    const [bookQ, setBookQ] = React.useState("");
    const [bookHits, setBookHits] = React.useState([]);
    const [book, setBook] = React.useState(null);

    React.useEffect(() => {
        if (!open || !supabase) return;

        let alive = true;
        (async () => {
            try {
                setError("");
                const b = await listBranches(supabase);
                if (!alive) return;
                setBranches(b);
                if (!branchId && b?.[0]?.id) setBranchId(b[0].id);
            } catch (e) {
                if (!alive) return;
                setError(e?.message || "Failed to load branches");
            }
        })();

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, supabase]);

    // Search readers (debounced)
    React.useEffect(() => {
        if (!open || !supabase) return;
        let alive = true;
        const t = setTimeout(async () => {
            try {
                if (!readerQ.trim()) {
                    setReaderHits([]);
                    return;
                }
                const hits = await searchReaders(supabase, readerQ);
                if (!alive) return;
                setReaderHits(hits);
            } catch (e) {
                if (!alive) return;
                setReaderHits([]);
            }
        }, 300);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [open, supabase, readerQ]);

    // Search books (debounced)
    React.useEffect(() => {
        if (!open || !supabase) return;
        let alive = true;
        const t = setTimeout(async () => {
            try {
                if (!bookQ.trim()) {
                    setBookHits([]);
                    return;
                }
                const hits = await searchBooks(supabase, bookQ);
                if (!alive) return;
                setBookHits(hits);
            } catch (e) {
                if (!alive) return;
                setBookHits([]);
            }
        }, 300);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [open, supabase, bookQ]);

    const canSubmit = Boolean(reader?.id && book?.id && branchId) && !loading;

    const submit = async () => {
        if (!canSubmit) return;
        setLoading(true);
        setError("");
        try {
            const created = await createBorrowForReader({
                supabase,
                readerId: reader.id,
                bookId: book.id,
                branchId,
            });
            onCreated?.(created);
            onClose?.();
        } catch (e) {
            // Trigger errors come through here (e.g. "No active membership plan.")
            setError(e?.message || "Failed to create borrow");
        } finally {
            setLoading(false);
        }
    };

    const resetSelection = () => {
        setReader(null);
        setBook(null);
        setReaderQ("");
        setBookQ("");
        setReaderHits([]);
        setBookHits([]);
        setError("");
    };

    React.useEffect(() => {
        if (!open) resetSelection();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 900 }}>
                Borrow for Reader
            </DialogTitle>

            <DialogContent dividers>
                {error ? (
                    <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 3, mb: 2 }}
                    >
                        <Typography
                            sx={{ fontWeight: 900, color: "error.main" }}
                        >
                            {error}
                        </Typography>
                    </Paper>
                ) : null}

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2,
                    }}
                >
                    {/* Reader */}
                    <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Select reader
                        </Typography>
                        <TextField
                            fullWidth
                            sx={{ mt: 1 }}
                            placeholder="Search by username or name…"
                            value={
                                reader
                                    ? `${reader.full_name} (@${reader.username})`
                                    : readerQ
                            }
                            onChange={(e) => {
                                setReader(null);
                                setReaderQ(e.target.value);
                            }}
                        />

                        <Divider sx={{ my: 1.5 }} />

                        {reader ? (
                            <Box sx={{ display: "grid", gap: 0.75 }}>
                                <SmallRow
                                    label="Name"
                                    value={reader.full_name}
                                />
                                <SmallRow
                                    label="Username"
                                    value={`@${reader.username}`}
                                />
                                <Chip
                                    size="small"
                                    label="Selected"
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 900,
                                        width: "fit-content",
                                    }}
                                />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        mt: 1,
                                        width: "fit-content",
                                    }}
                                    onClick={() => setReader(null)}
                                >
                                    Change
                                </Button>
                            </Box>
                        ) : (
                            <List
                                dense
                                sx={{ p: 0, maxHeight: 240, overflow: "auto" }}
                            >
                                {readerHits.map((p) => (
                                    <ListItemButton
                                        key={p.id}
                                        onClick={() => setReader(p)}
                                    >
                                        <ListItemText
                                            primaryTypographyProps={{
                                                sx: { fontWeight: 900 },
                                            }}
                                            primary={`${p.full_name} (@${p.username})`}
                                            secondary={p.id}
                                        />
                                    </ListItemButton>
                                ))}
                                {!readerQ.trim() ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary", mt: 1 }}
                                    >
                                        Type to search readers.
                                    </Typography>
                                ) : readerHits.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary", mt: 1 }}
                                    >
                                        No matches.
                                    </Typography>
                                ) : null}
                            </List>
                        )}
                    </Paper>

                    {/* Book */}
                    <Paper variant="outlined" sx={{ borderRadius: 3, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Select book
                        </Typography>
                        <TextField
                            fullWidth
                            sx={{ mt: 1 }}
                            placeholder="Search by title or ISBN…"
                            value={
                                book ? `${book.title} (${book.isbn})` : bookQ
                            }
                            onChange={(e) => {
                                setBook(null);
                                setBookQ(e.target.value);
                            }}
                        />

                        <Divider sx={{ my: 1.5 }} />

                        {book ? (
                            <Box sx={{ display: "grid", gap: 0.75 }}>
                                <SmallRow label="Title" value={book.title} />
                                <SmallRow label="ISBN" value={book.isbn} />
                                <SmallRow
                                    label="Available"
                                    value={`${book.stock_available}/${book.stock_total}`}
                                />
                                <Chip
                                    size="small"
                                    label={
                                        Number(book.stock_available) > 0
                                            ? "In stock"
                                            : "Out of stock"
                                    }
                                    sx={{
                                        borderRadius: 2,
                                        fontWeight: 900,
                                        width: "fit-content",
                                        backgroundColor:
                                            Number(book.stock_available) > 0
                                                ? "rgba(46,204,113,0.15)"
                                                : "rgba(231,76,60,0.15)",
                                        color:
                                            Number(book.stock_available) > 0
                                                ? "#2ecc71"
                                                : "#e74c3c",
                                    }}
                                />
                                <Button
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        mt: 1,
                                        width: "fit-content",
                                    }}
                                    onClick={() => setBook(null)}
                                >
                                    Change
                                </Button>
                            </Box>
                        ) : (
                            <List
                                dense
                                sx={{ p: 0, maxHeight: 240, overflow: "auto" }}
                            >
                                {bookHits.map((b) => (
                                    <ListItemButton
                                        key={b.id}
                                        disabled={
                                            Number(b.stock_available || 0) <= 0
                                        }
                                        onClick={() => setBook(b)}
                                    >
                                        <ListItemText
                                            primaryTypographyProps={{
                                                sx: { fontWeight: 900 },
                                            }}
                                            primary={b.title}
                                            secondary={`ISBN: ${b.isbn} • Available: ${b.stock_available}/${b.stock_total}`}
                                        />
                                    </ListItemButton>
                                ))}
                                {!bookQ.trim() ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary", mt: 1 }}
                                    >
                                        Type to search books.
                                    </Typography>
                                ) : bookHits.length === 0 ? (
                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary", mt: 1 }}
                                    >
                                        No matches.
                                    </Typography>
                                ) : null}
                            </List>
                        )}
                    </Paper>
                </Box>

                <Paper
                    variant="outlined"
                    sx={{ borderRadius: 3, p: 1.5, mt: 2 }}
                >
                    <Typography sx={{ fontWeight: 900 }}>Branch</Typography>
                    <TextField
                        select
                        label="Borrow at branch"
                        fullWidth
                        sx={{ mt: 1 }}
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                    >
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </TextField>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 1 }}
                    >
                        Note: your trigger blocks borrowing outside branch
                        operating hours.
                    </Typography>
                </Paper>
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
                    disabled={!canSubmit}
                    onClick={submit}
                >
                    {loading ? "Creating…" : "Create Borrow"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

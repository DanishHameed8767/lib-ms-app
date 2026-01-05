"use client";

import * as React from "react";
import Link from "next/link";
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
    Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import BookEditDrawer from "../../../components/BookEditDrawer";
import RoleGuard from "@/components/RoleGuard";
import { ROLES } from "../../../lib/roles";

import { createClient } from "@/lib/supabase/client";

/** ✅ Use explicit px radii to avoid “weirdly round” look */
const R = {
    card: "14px",
    soft: "12px",
    btn: "12px",
    chip: "999px",
};

function StockChip({ available }) {
    const ok = Number(available || 0) > 0;
    return (
        <Chip
            size="small"
            label={ok ? `Available ${available}` : "Out of stock"}
            sx={{
                borderRadius: R.chip,
                fontWeight: 900,
                backgroundColor: ok
                    ? "rgba(46,204,113,0.15)"
                    : "rgba(231,76,60,0.15)",
                color: ok ? "#2ecc71" : "#e74c3c",
            }}
        />
    );
}

function normalizeBook(b) {
    return {
        id: b?.id || "",
        title: b?.title || "",
        genre: b?.genre || "",
        isbn: b?.isbn || "",
        price: Number(b?.price || 0),
        edition: b?.edition || "",
        publisher: b?.publisher || "",
        publicationYear: b?.publicationYear || b?.publication_year || "",
        stockTotal: Number(b?.stockTotal ?? b?.stock_total ?? 0),
        stockAvailable: Number(b?.stockAvailable ?? b?.stock_available ?? 0),
        coverImageUrl: b?.coverImageUrl || b?.cover_image_url || "",
        coverFile: null,
        authors: Array.isArray(b?.authors) ? b.authors : [],
    };
}

function toDbPayload(b) {
    return {
        title: b.title,
        edition: b.edition || null,
        publisher: b.publisher || null,
        genre: b.genre || null,
        isbn: b.isbn,
        publication_year: b.publicationYear ? Number(b.publicationYear) : null,
        price: Number(b.price || 0),
        stock_total: Number(b.stockTotal || 0),
        stock_available: Number(b.stockAvailable || 0),
        cover_image_url: b.coverImageUrl || null,
    };
}

async function uploadCoverIfNeeded({ supabase, file }) {
    if (!file) return null;
    const ext = (file.name?.split(".").pop() || "png").toLowerCase();
    const path = `covers/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
        .from("book-covers")
        .upload(path, file, {
            upsert: false,
            contentType: file.type || undefined,
        });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from("book-covers").getPublicUrl(path);
    return data?.publicUrl || null;
}

// --- Authors helpers (no authors page needed) ---
async function upsertAuthorsByName(supabase, names) {
    const clean = [
        ...new Set((names || []).map((n) => String(n).trim()).filter(Boolean)),
    ];
    if (clean.length === 0) return [];

    const { data: existing, error: exErr } = await supabase
        .from("authors")
        .select("id, full_name")
        .in("full_name", clean);

    if (exErr) throw exErr;

    const existingMap = new Map(
        (existing || []).map((a) => [String(a.full_name).toLowerCase(), a])
    );
    const toInsert = clean.filter((n) => !existingMap.has(n.toLowerCase()));

    if (toInsert.length > 0) {
        const { data: inserted, error: insErr } = await supabase
            .from("authors")
            .insert(toInsert.map((full_name) => ({ full_name })))
            .select("id, full_name");

        if (insErr) throw insErr;

        (inserted || []).forEach((a) =>
            existingMap.set(String(a.full_name).toLowerCase(), a)
        );
    }

    return clean.map((n) => existingMap.get(n.toLowerCase())).filter(Boolean);
}

async function setBookAuthors(supabase, bookId, authorIds) {
    const { error: delErr } = await supabase
        .from("book_authors")
        .delete()
        .eq("book_id", bookId);
    if (delErr) throw delErr;

    if (!authorIds || authorIds.length === 0) return;

    const rows = authorIds.map((author_id) => ({ book_id: bookId, author_id }));
    const { error: insErr } = await supabase.from("book_authors").insert(rows);
    if (insErr) throw insErr;
}

async function loadAuthorsByBookId(supabase, bookIds) {
    if (!bookIds || bookIds.length === 0) return new Map();

    const { data, error } = await supabase
        .from("book_authors")
        .select("book_id, authors:author_id ( id, full_name )")
        .in("book_id", bookIds);

    if (error) throw error;

    const map = new Map();
    for (const row of data || []) {
        const name = row?.authors?.full_name;
        if (!name) continue;
        const arr = map.get(row.book_id) || [];
        arr.push(name);
        map.set(row.book_id, arr);
    }
    return map;
}

export default function AdminBooksPage() {
    const supabase = React.useMemo(() => createClient(), []);

    const [rows, setRows] = React.useState([]);
    const [q, setQ] = React.useState("");

    const [open, setOpen] = React.useState(false);
    const [editing, setEditing] = React.useState(null);

    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState("");

    const loadBooks = React.useCallback(async () => {
        setError("");
        setLoading(true);
        try {
            const { data: books, error: bErr } = await supabase
                .from("books")
                .select(
                    "id,title,edition,publisher,genre,isbn,publication_year,price,stock_total,stock_available,cover_image_url,created_at"
                )
                .order("created_at", { ascending: false });

            if (bErr) throw bErr;

            const ids = (books || []).map((b) => b.id);
            const authorsMap = await loadAuthorsByBookId(supabase, ids);

            const merged = (books || []).map((b) =>
                normalizeBook({
                    ...b,
                    authors: authorsMap.get(b.id) || [],
                })
            );

            setRows(merged);
        } catch (e) {
            setError(e?.message || "Failed to load books");
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    React.useEffect(() => {
        loadBooks();
    }, [loadBooks]);

    const filtered = React.useMemo(() => {
        const query = q.trim().toLowerCase();
        if (!query) return rows || [];
        return (rows || []).filter((b) => {
            const authorsStr = (b.authors || []).join(", ").toLowerCase();
            return (
                String(b.title || "")
                    .toLowerCase()
                    .includes(query) ||
                String(b.genre || "")
                    .toLowerCase()
                    .includes(query) ||
                String(b.isbn || "")
                    .toLowerCase()
                    .includes(query) ||
                authorsStr.includes(query)
            );
        });
    }, [rows, q]);

    const openCreate = () => {
        setEditing(
            normalizeBook({
                id: "",
                title: "",
                genre: "",
                isbn: "",
                price: 0,
                edition: "",
                publisher: "",
                stockTotal: 0,
                stockAvailable: 0,
                coverImageUrl: "",
                publicationYear: "",
                coverFile: null,
                authors: [],
            })
        );
        setOpen(true);
    };

    const openEdit = (b) => {
        setEditing({ ...normalizeBook(b) });
        setOpen(true);
    };

    const save = async () => {
        if (!editing) return;
        setError("");
        setSaving(true);

        try {
            let coverUrl = editing.coverImageUrl || null;
            if (editing.coverFile instanceof File) {
                coverUrl = await uploadCoverIfNeeded({
                    supabase,
                    file: editing.coverFile,
                });
            }

            const payload = toDbPayload({
                ...editing,
                coverImageUrl: coverUrl,
            });

            if (!payload.title) throw new Error("Title is required.");
            if (!payload.isbn) throw new Error("ISBN is required.");

            let savedBook = null;

            if (!editing.id) {
                const { data, error: err } = await supabase
                    .from("books")
                    .insert(payload)
                    .select(
                        "id,title,edition,publisher,genre,isbn,publication_year,price,stock_total,stock_available,cover_image_url,created_at"
                    )
                    .single();

                if (err) throw err;
                savedBook = data;
            } else {
                const { data, error: err } = await supabase
                    .from("books")
                    .update(payload)
                    .eq("id", editing.id)
                    .select(
                        "id,title,edition,publisher,genre,isbn,publication_year,price,stock_total,stock_available,cover_image_url,created_at"
                    )
                    .single();

                if (err) throw err;
                savedBook = data;
            }

            const names = Array.isArray(editing.authors) ? editing.authors : [];
            const authorRows = await upsertAuthorsByName(supabase, names);
            const authorIds = authorRows.map((a) => a.id);

            await setBookAuthors(supabase, savedBook.id, authorIds);

            const final = normalizeBook({
                ...savedBook,
                authors: authorRows.map((a) => a.full_name),
            });

            setRows((prev) => {
                const exists = prev.some((x) => x.id === final.id);
                if (!exists) return [final, ...prev];
                return prev.map((x) => (x.id === final.id ? final : x));
            });

            setOpen(false);
        } catch (e) {
            setError(e?.message || "Failed to save book");
        } finally {
            setSaving(false);
        }
    };

    const del = async () => {
        if (!editing?.id) return;
        setError("");
        setSaving(true);

        try {
            await supabase
                .from("book_authors")
                .delete()
                .eq("book_id", editing.id);

            const { error: err } = await supabase
                .from("books")
                .delete()
                .eq("id", editing.id);
            if (err) throw err;

            setRows((prev) => prev.filter((x) => x.id !== editing.id));
            setOpen(false);
        } catch (e) {
            setError(e?.message || "Failed to delete book");
        } finally {
            setSaving(false);
        }
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN]}>
            <AppShell title="Admin Books">
                {/* ✅ stop horizontal overflow + keep consistent “not too round” UI */}
                <Box sx={{ minWidth: 0, overflowX: "hidden" }}>
                    <PageHeader
                        title="Books (Admin)"
                        subtitle="Create and manage books, authors, stock and covers."
                        right={
                            <Button
                                variant="contained"
                                startIcon={<AddOutlinedIcon />}
                                sx={{ borderRadius: R.btn }}
                                onClick={openCreate}
                                disabled={loading}
                            >
                                New Book
                            </Button>
                        }
                    />

                    {error ? (
                        <Alert
                            severity="error"
                            sx={{ mb: 2, borderRadius: R.soft }}
                        >
                            {error}
                        </Alert>
                    ) : null}

                    <Paper
                        variant="outlined"
                        sx={{
                            p: 1.25,
                            borderRadius: R.card,
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            alignItems: "center",
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search title / authors / genre / ISBN…"
                            sx={{ width: { xs: "100%", sm: 520 }, minWidth: 0 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }} />
                        <Chip
                            label={
                                loading
                                    ? "Loading…"
                                    : `${filtered.length} item(s)`
                            }
                            sx={{ borderRadius: R.chip, fontWeight: 900 }}
                            variant="outlined"
                        />
                    </Paper>

                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 2,
                            borderRadius: R.card,
                            overflow: "hidden",
                            minWidth: 0,
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Books
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Supabase: books + authors + book_authors +
                                book-covers storage
                            </Typography>
                        </Box>

                        <Divider />

                        <Box sx={{ width: "100%", overflowX: "auto" }}>
                            <Table
                                size="small"
                                sx={{
                                    minWidth: 1100,
                                    "& th": {
                                        whiteSpace: "nowrap",
                                        fontWeight: 900,
                                    },
                                }}
                            >
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Authors</TableCell>
                                        <TableCell>ISBN</TableCell>
                                        <TableCell>Genre</TableCell>
                                        <TableCell>Stock</TableCell>
                                        <TableCell align="right">
                                            Action
                                        </TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filtered.map((b) => (
                                        <TableRow key={b.id} hover>
                                            <TableCell
                                                sx={{
                                                    minWidth: 340,
                                                    maxWidth: 520,
                                                }}
                                            >
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                    noWrap
                                                    title={b.title || ""}
                                                >
                                                    {b.title || "—"}
                                                </Typography>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                        fontFamily: "monospace",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    title={b.id || ""}
                                                >
                                                    {b.id || "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    minWidth: 260,
                                                    maxWidth: 360,
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    title={(
                                                        b.authors || []
                                                    ).join(", ")}
                                                >
                                                    {(b.authors || []).join(
                                                        ", "
                                                    ) || "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell
                                                sx={{
                                                    fontFamily: "monospace",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {b.isbn || "—"}
                                            </TableCell>

                                            <TableCell
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                {b.genre || "—"}
                                            </TableCell>

                                            <TableCell>
                                                <StockChip
                                                    available={b.stockAvailable}
                                                />
                                            </TableCell>

                                            <TableCell align="right">
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        gap: 1,
                                                        justifyContent:
                                                            "flex-end",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <Button
                                                        component={Link}
                                                        href={`/books/${b.id}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            borderRadius: R.btn,
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            borderRadius: R.btn,
                                                        }}
                                                        onClick={() =>
                                                            openEdit(b)
                                                        }
                                                    >
                                                        Edit
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {!loading && filtered.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                sx={{ py: 6 }}
                                            >
                                                <Box
                                                    sx={{ textAlign: "center" }}
                                                >
                                                    <Typography
                                                        sx={{ fontWeight: 900 }}
                                                    >
                                                        No books found
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        Try another search
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

                    <BookEditDrawer
                        open={open}
                        onClose={() => setOpen(false)}
                        value={editing || {}}
                        onChange={setEditing}
                        onSave={save}
                        onDelete={del}
                        showDelete={Boolean(editing?.id)}
                        saving={saving}
                    />
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

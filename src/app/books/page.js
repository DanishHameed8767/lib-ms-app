"use client";

import * as React from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    MenuItem,
    Button,
    Card,
    CardContent,
    Typography,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import BookCard from "../../components/BookCard";
import RoleGuard from "../../components/RoleGuard";
import { ROLES } from "../../lib/roles";
import { useAuth } from "@/context/AuthContext";

function withTimeout(promise, ms, label = "Request") {
    let t;
    const timeout = new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

function adaptBookRow(b) {
    const authorNames =
        (b.book_authors || [])
            .map((ba) => ba?.authors?.full_name)
            .filter(Boolean) || [];

    return {
        ...b,
        author: authorNames.length ? authorNames.join(", ") : "—",
        year: b.publication_year || "—",
        stockTotal: b.stock_total ?? 0,
        stockAvailable: b.stock_available ?? 0,
        coverImageUrl: b.cover_image_url || "",
    };
}

export default function BooksPage() {
    const { supabase, role } = useAuth();

    const [tab, setTab] = React.useState(0);
    const [genre, setGenre] = React.useState("All");
    const [query, setQuery] = React.useState("");

    const [books, setBooks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const canManageBooks = role === "Administrator" || role === "Librarian";

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase) return;

            let cancelled = false;
            // return a cancel fn (used by effect cleanup)
            const cancel = () => {
                cancelled = true;
            };

            if (!silent) {
                setLoading(true);
            }
            setError("");

            try {
                const p = supabase
                    .from("books")
                    .select(
                        `
            id,
            title,
            genre,
            isbn,
            publication_year,
            stock_total,
            stock_available,
            cover_image_url,
            created_at,
            book_authors (
              authors ( full_name )
            )
          `
                    )
                    .order("created_at", { ascending: false });

                const { data, error: qErr } = await withTimeout(
                    p,
                    8000,
                    "Load books"
                );
                if (cancelled) return cancel;

                if (qErr) throw qErr;

                const adapted = (data || []).map(adaptBookRow);
                if (!cancelled) setBooks(adapted);
            } catch (e) {
                if (!silent) setBooks([]);
                if (!cancelled) setError(e?.message || "Failed to load books");
            } finally {
                if (!cancelled && !silent) setLoading(false);
            }

            return cancel;
        },
        [supabase]
    );

    React.useEffect(() => {
        let cancel = null;

        (async () => {
            cancel = await load({ silent: false });
        })();

        // Re-fetch when tab becomes visible / focus returns (fixes “stuck after tab switch”)
        const onVisible = () => {
            if (document.visibilityState === "visible") load({ silent: true });
        };
        const onFocus = () => load({ silent: true });

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);

        return () => {
            if (typeof cancel === "function") cancel();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [load]);

    const genres = React.useMemo(() => {
        const set = new Set();
        for (const b of books) if (b.genre) set.add(b.genre);
        return ["All", ...Array.from(set).sort()];
    }, [books]);

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        return books.filter((b) => {
            const matchesGenre = genre === "All" ? true : b.genre === genre;
            const matchesQuery =
                !q ||
                String(b.title || "")
                    .toLowerCase()
                    .includes(q) ||
                String(b.author || "")
                    .toLowerCase()
                    .includes(q) ||
                String(b.isbn || "").includes(q);

            return matchesGenre && matchesQuery;
        });
    }, [books, genre, query]);

    const outOfStockCount = React.useMemo(
        () => books.filter((b) => (b.stockAvailable ?? 0) === 0).length,
        [books]
    );

    const lowStockAlerts = React.useMemo(
        () => books.filter((b) => (b.stockAvailable ?? 0) <= 2).slice(0, 4),
        [books]
    );

    return (
        <RoleGuard
            allowedRoles={[
                ROLES.ADMIN,
                ROLES.LIBRARIAN,
                ROLES.STAFF,
                ROLES.READER,
            ]}
        >
            <AppShell title="Books">
                <PageHeader
                    title="Books Collection"
                    subtitle="Browse, search and manage your catalogue."
                    right={
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<FilterAltOutlinedIcon />}
                                sx={{ borderRadius: 3 }}
                            >
                                Filters
                            </Button>

                            {canManageBooks ? (
                                <Button
                                    variant="contained"
                                    sx={{ borderRadius: 3 }}
                                >
                                    + Add Book
                                </Button>
                            ) : null}
                        </>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>
                        {error}
                    </Alert>
                ) : null}

                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.25,
                        borderRadius: 4,
                        display: "flex",
                        gap: 1,
                        flexWrap: "wrap",
                        alignItems: "center",
                        mt: error ? 2 : 0,
                    }}
                >
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            minHeight: 40,
                            "& .MuiTab-root": {
                                minHeight: 40,
                                borderRadius: 3,
                                textTransform: "none",
                                fontWeight: 800,
                            },
                        }}
                    >
                        <Tab label="Popular" />
                        <Tab label="Featured" />
                        <Tab label="Latest" />
                    </Tabs>

                    <Box sx={{ flex: 1 }} />

                    <TextField
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search title / author / ISBN…"
                        sx={{ width: { xs: "100%", sm: 360 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                        label="Genre"
                    >
                        {genres.map((g) => (
                            <MenuItem key={g} value={g}>
                                {g}
                            </MenuItem>
                        ))}
                    </TextField>
                </Paper>

                <Box
                    sx={{
                        mt: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                xl: "repeat(3, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        {(loading ? Array.from({ length: 6 }) : filtered).map(
                            (book, idx) =>
                                loading ? (
                                    <Paper
                                        key={`sk-${idx}`}
                                        variant="outlined"
                                        sx={{ borderRadius: 4, height: 290 }}
                                    />
                                ) : (
                                    <BookCard key={book.id} book={book} />
                                )
                        )}
                    </Box>

                    <Box sx={{ display: "grid", gap: 2 }}>
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Stock Snapshot
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Quick overview of inventory health.
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 1.25,
                                    }}
                                >
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.25, borderRadius: 3 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            Total Titles
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: 22,
                                            }}
                                        >
                                            {books.length}
                                        </Typography>
                                    </Paper>

                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1.25, borderRadius: 3 }}
                                    >
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            Out of Stock
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: 22,
                                            }}
                                        >
                                            {outOfStockCount}
                                        </Typography>
                                    </Paper>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mb: 1 }}
                                >
                                    Low stock alerts
                                </Typography>

                                <List dense sx={{ p: 0 }}>
                                    {lowStockAlerts.map((b) => (
                                        <ListItem key={b.id} sx={{ px: 0 }}>
                                            <ListItemText
                                                primaryTypographyProps={{
                                                    sx: { fontWeight: 800 },
                                                }}
                                                primary={b.title}
                                                secondary={`Available: ${b.stockAvailable}/${b.stockTotal}`}
                                            />
                                            <Chip
                                                size="small"
                                                label={
                                                    b.stockAvailable === 0
                                                        ? "Out"
                                                        : "Low"
                                                }
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 800,
                                                    backgroundColor:
                                                        b.stockAvailable === 0
                                                            ? "rgba(231,76,60,0.15)"
                                                            : "rgba(255,106,61,0.15)",
                                                    color:
                                                        b.stockAvailable === 0
                                                            ? "#e74c3c"
                                                            : "primary.main",
                                                }}
                                            />
                                        </ListItem>
                                    ))}

                                    {!loading && lowStockAlerts.length === 0 ? (
                                        <Box sx={{ py: 1 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                No low stock items right now.
                                            </Typography>
                                        </Box>
                                    ) : null}
                                </List>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Reservations
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    (UI placeholder — will connect later)
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: "grid", gap: 1 }}>
                                    {[
                                        "The Coffee Shop Next Door",
                                        "Dune Whisper",
                                        "Floral Dreams",
                                    ].map((t) => (
                                        <Paper
                                            key={t}
                                            variant="outlined"
                                            sx={{ p: 1.25, borderRadius: 3 }}
                                        >
                                            <Typography
                                                sx={{ fontWeight: 800 }}
                                                noWrap
                                            >
                                                {t}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                Queue: #2 • Status: Pending
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

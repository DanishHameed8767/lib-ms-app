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
import { alpha, useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import BookCard from "../../components/BookCard";
import RoleGuard from "../../components/RoleGuard";
import { ROLES } from "../../lib/roles";
import { useAuth } from "@/context/AuthContext";

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

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
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [tab, setTab] = React.useState(0);
    const [genre, setGenre] = React.useState("All");
    const [query, setQuery] = React.useState("");

    const [books, setBooks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const canManageBooks = role === "Administrator" || role === "Librarian";

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const hoverBg = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.04 : 0.035
    );

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase) return;

            let cancelled = false;
            const cancel = () => {
                cancelled = true;
            };

            if (!silent) setLoading(true);
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

    const surfaceCard = {
        borderRadius: R.xl,
        border: `1px solid ${borderSoft}`,
        background: isDark
            ? `linear-gradient(180deg, ${alpha("#FFFFFF", 0.05)} 0%, ${alpha(
                  "#FFFFFF",
                  0.02
              )} 100%)`
            : "#FFFFFF",
        boxShadow: "none",
        overflow: "hidden",
    };

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
                                sx={{
                                    borderRadius: R.xl,
                                    borderColor: borderSoft,
                                    px: 2,
                                    "&:hover": {
                                        borderColor: alpha(
                                            theme.palette.primary.main,
                                            0.45
                                        ),
                                    },
                                }}
                            >
                                Filters
                            </Button>

                            {canManageBooks ? (
                                <Button
                                    variant="contained"
                                    sx={{
                                        borderRadius: R.xl,
                                        px: 2.2,
                                        boxShadow: "none",
                                        "&:hover": { boxShadow: "none" },
                                    }}
                                >
                                    + Add Book
                                </Button>
                            ) : null}
                        </>
                    }
                />

                {error ? (
                    <Alert severity="error" sx={{ mt: 2, borderRadius: R.lg }}>
                        {error}
                    </Alert>
                ) : null}

                {/* Filter Bar (matches ref: one capsule row) */}
                <Paper
                    variant="outlined"
                    sx={{
                        mt: error ? 2 : 0,
                        p: 1,
                        borderRadius: "999px",
                        borderColor: borderSoft,
                        background: isDark
                            ? alpha("#0F1115", 0.35)
                            : alpha("#FFFFFF", 0.65),
                        backdropFilter: "blur(10px)",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "auto 1fr auto" },
                        gap: 1,
                        alignItems: "center",
                    }}
                >
                    <Tabs
                        value={tab}
                        onChange={(_, v) => setTab(v)}
                        sx={{
                            minHeight: 44,
                            "& .MuiTabs-flexContainer": { gap: 6, px: 0.5 },
                            "& .MuiTab-root": {
                                minHeight: 44,
                                px: 2,
                                borderRadius: "999px",
                                textTransform: "none",
                                fontWeight: 800,
                                color: "text.secondary",
                            },
                            "& .MuiTab-root.Mui-selected": {
                                color: "primary.main",
                                backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.14 : 0.1
                                ),
                            },
                            "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: 999,
                            },
                        }}
                    >
                        <Tab label="Popular" />
                        <Tab label="Featured" />
                        <Tab label="Latest" />
                    </Tabs>

                    <TextField
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search title / author / ISBN…"
                        fullWidth
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "999px",
                                backgroundColor: alpha(
                                    isDark ? "#FFFFFF" : "#0F1115",
                                    isDark ? 0.04 : 0.03
                                ),
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: borderSoft,
                            },
                        }}
                    />

                    <TextField
                        select
                        value={genre}
                        onChange={(e) => setGenre(e.target.value)}
                        label="Genre"
                        sx={{
                            width: { xs: "100%", md: 220 },
                            "& .MuiOutlinedInput-root": {
                                borderRadius: "999px",
                            },
                        }}
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
                    {/* Book Grid */}
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
                                        sx={{
                                            borderRadius: R.xl,
                                            height: 290,
                                            borderColor: borderSoft,
                                            background: isDark
                                                ? alpha("#FFFFFF", 0.03)
                                                : alpha("#0F1115", 0.02),
                                        }}
                                    />
                                ) : (
                                    <Box
                                        key={book.id}
                                        sx={{
                                            borderRadius: R.xl,
                                            transition:
                                                "transform 140ms ease, box-shadow 140ms ease",
                                            "&:hover": {
                                                transform: "translateY(-2px)",
                                            },
                                        }}
                                    >
                                        <BookCard book={book} />
                                    </Box>
                                )
                        )}

                        {!loading && filtered.length === 0 ? (
                            <Paper
                                variant="outlined"
                                sx={{
                                    ...surfaceCard,
                                    p: 2.25,
                                    gridColumn: "1 / -1",
                                }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    No results
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Try a different search term or choose
                                    another genre.
                                </Typography>
                            </Paper>
                        ) : null}
                    </Box>

                    {/* Right Rail */}
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <Card sx={surfaceCard}>
                            <CardContent sx={{ p: 2.25 }}>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Stock Snapshot
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Quick overview of inventory health.
                                </Typography>

                                <Divider
                                    sx={{ my: 2, borderColor: borderSoft }}
                                />

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 1.25,
                                    }}
                                >
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: R.lg,
                                            borderColor: borderSoft,
                                            background: alpha(
                                                isDark ? "#FFFFFF" : "#0F1115",
                                                isDark ? 0.03 : 0.02
                                            ),
                                        }}
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
                                        sx={{
                                            p: 1.25,
                                            borderRadius: R.lg,
                                            borderColor: borderSoft,
                                            background: alpha(
                                                isDark ? "#FFFFFF" : "#0F1115",
                                                isDark ? 0.03 : 0.02
                                            ),
                                        }}
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

                                <Divider
                                    sx={{ my: 2, borderColor: borderSoft }}
                                />

                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mb: 1 }}
                                >
                                    Low stock alerts
                                </Typography>

                                <List dense sx={{ p: 0 }}>
                                    {lowStockAlerts.map((b) => {
                                        const isOut = b.stockAvailable === 0;
                                        return (
                                            <ListItem
                                                key={b.id}
                                                sx={{
                                                    px: 0,
                                                    py: 0.75,
                                                    borderRadius: R.lg,
                                                    "&:hover": {
                                                        backgroundColor:
                                                            hoverBg,
                                                    },
                                                }}
                                                secondaryAction={
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            isOut
                                                                ? "Out"
                                                                : "Low"
                                                        }
                                                        sx={{
                                                            borderRadius:
                                                                "999px",
                                                            fontWeight: 800,
                                                            backgroundColor:
                                                                isOut
                                                                    ? alpha(
                                                                          theme
                                                                              .palette
                                                                              .error
                                                                              .main,
                                                                          isDark
                                                                              ? 0.18
                                                                              : 0.12
                                                                      )
                                                                    : alpha(
                                                                          theme
                                                                              .palette
                                                                              .primary
                                                                              .main,
                                                                          isDark
                                                                              ? 0.16
                                                                              : 0.1
                                                                      ),
                                                            color: isOut
                                                                ? theme.palette
                                                                      .error
                                                                      .main
                                                                : "primary.main",
                                                            border: `1px solid ${
                                                                isOut
                                                                    ? alpha(
                                                                          theme
                                                                              .palette
                                                                              .error
                                                                              .main,
                                                                          0.3
                                                                      )
                                                                    : alpha(
                                                                          theme
                                                                              .palette
                                                                              .primary
                                                                              .main,
                                                                          0.26
                                                                      )
                                                            }`,
                                                        }}
                                                    />
                                                }
                                            >
                                                <ListItemText
                                                    primaryTypographyProps={{
                                                        sx: {
                                                            fontWeight: 850,
                                                            pr: 8,
                                                        },
                                                    }}
                                                    primary={b.title}
                                                    secondary={`Available: ${b.stockAvailable}/${b.stockTotal}`}
                                                />
                                            </ListItem>
                                        );
                                    })}

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

                        <Card sx={surfaceCard}>
                            <CardContent sx={{ p: 2.25 }}>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Reservations
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    (UI placeholder — will connect later)
                                </Typography>

                                <Divider
                                    sx={{ my: 2, borderColor: borderSoft }}
                                />

                                <Box sx={{ display: "grid", gap: 1 }}>
                                    {[
                                        "The Coffee Shop Next Door",
                                        "Dune Whisper",
                                        "Floral Dreams",
                                    ].map((t) => (
                                        <Paper
                                            key={t}
                                            variant="outlined"
                                            sx={{
                                                p: 1.25,
                                                borderRadius: R.lg,
                                                borderColor: borderSoft,
                                                background: alpha(
                                                    isDark
                                                        ? "#FFFFFF"
                                                        : "#0F1115",
                                                    isDark ? 0.03 : 0.02
                                                ),
                                                "&:hover": {
                                                    backgroundColor: hoverBg,
                                                },
                                            }}
                                        >
                                            <Typography
                                                sx={{ fontWeight: 850 }}
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

"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Divider,
    Paper,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    AvatarGroup,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
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

// PKR currency formatter (request: replace $ -> PKR)
function moneyPKR(n) {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
    });
}

function adaptBook(b) {
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

        // placeholders (not in DB)
        language: b.language || "—",
        pages: b.pages || "—",
        description: b.description || "—",
        tags: Array.isArray(b.tags) ? b.tags : [],
    };
}

function AvailabilityPill({ available }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isOut = (available ?? 0) <= 0;

    const bg = isOut
        ? alpha(theme.palette.error.main, isDark ? 0.18 : 0.12)
        : alpha(theme.palette.success.main, isDark ? 0.18 : 0.12);

    const bd = isOut
        ? alpha(theme.palette.error.main, 0.3)
        : alpha(theme.palette.success.main, 0.28);

    const fg = isOut ? theme.palette.error.main : theme.palette.success.main;

    return (
        <Chip
            size="small"
            label={isOut ? "Out of stock" : "Available"}
            sx={{
                height: 28,
                borderRadius: "999px",
                fontWeight: 850,
                bgcolor: bg,
                color: fg,
                border: `1px solid ${bd}`,
                "& .MuiChip-label": { px: 1.1 },
            }}
        />
    );
}

export default function BookDetailsPage() {
    const params = useParams();
    const bookId = String(params?.id || "");

    const { supabase, role } = useAuth();
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const [book, setBook] = React.useState(null);
    const [related, setRelated] = React.useState([]);
    const [branches, setBranches] = React.useState([]);

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const canManageBooks = role === "Administrator" || role === "Librarian";

    // Borrow dialog state
    const [borrowOpen, setBorrowOpen] = React.useState(false);
    const [borrowSaving, setBorrowSaving] = React.useState(false);
    const [borrowError, setBorrowError] = React.useState("");
    const [borrowOk, setBorrowOk] = React.useState("");
    const [readerUsername, setReaderUsername] = React.useState("");
    const [branchId, setBranchId] = React.useState("");

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const hoverBg = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.04 : 0.035
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

    const load = React.useCallback(
        async ({ silent = false } = {}) => {
            if (!supabase || !bookId) return;

            let cancelled = false;
            const cancel = () => {
                cancelled = true;
            };

            if (!silent) setLoading(true);
            setError("");

            try {
                const branchesP = supabase
                    .from("library_branches")
                    .select("id,name,address")
                    .order("name", { ascending: true });

                const bookP = supabase
                    .from("books")
                    .select(
                        `
            id,
            title,
            genre,
            isbn,
            edition,
            publisher,
            publication_year,
            price,
            stock_total,
            stock_available,
            cover_image_url,
            created_at,
            book_authors (
              authors ( full_name )
            )
          `
                    )
                    .eq("id", bookId)
                    .maybeSingle();

                const [{ data: br, error: brErr }, { data, error: qErr }] =
                    await withTimeout(
                        Promise.all([branchesP, bookP]),
                        9000,
                        "Load book/branches"
                    );

                if (cancelled) return cancel;

                if (brErr) throw brErr;
                setBranches(br || []);

                if (qErr) throw qErr;
                if (!data) {
                    setBook(null);
                    setRelated([]);
                    if (!silent) setLoading(false);
                    return cancel;
                }

                const adapted = adaptBook(data);
                setBook(adapted);

                if (adapted.genre) {
                    const relP = supabase
                        .from("books")
                        .select(
                            `
              id,title,genre,isbn,publication_year,stock_total,stock_available,cover_image_url,created_at,
              book_authors ( authors ( full_name ) )
            `
                        )
                        .eq("genre", adapted.genre)
                        .neq("id", adapted.id)
                        .order("created_at", { ascending: false })
                        .limit(3);

                    const { data: rel, error: relErr } = await withTimeout(
                        relP,
                        7000,
                        "Load related"
                    );
                    if (cancelled) return cancel;
                    if (relErr) throw relErr;
                    setRelated((rel || []).map(adaptBook));
                } else {
                    setRelated([]);
                }
            } catch (e) {
                if (!cancelled) setError(e?.message || "Failed to load book");
            } finally {
                if (!cancelled && !silent) setLoading(false);
            }

            return cancel;
        },
        [supabase, bookId]
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

    const submitBorrow = async () => {
        if (!supabase || !book?.id) return;
        setBorrowError("");
        setBorrowOk("");

        const uname = String(readerUsername || "").trim();
        if (!uname) {
            setBorrowError("Enter a reader username.");
            return;
        }
        if (!branchId) {
            setBorrowError("Select a branch.");
            return;
        }

        setBorrowSaving(true);
        try {
            const { data: prof, error: pErr } = await withTimeout(
                supabase
                    .from("profiles")
                    .select("id, username, role, is_active")
                    .eq("username", uname)
                    .maybeSingle(),
                7000,
                "Lookup reader"
            );

            if (pErr) throw pErr;
            if (!prof) throw new Error("No user found with that username.");
            if (prof.is_active === false)
                throw new Error("That account is disabled.");
            if (prof.role !== "Reader")
                throw new Error("Username must belong to a Reader account.");

            const { error: insErr } = await withTimeout(
                supabase.from("borrows").insert({
                    reader_id: prof.id,
                    book_id: book.id,
                    branch_id: branchId,
                }),
                9000,
                "Create borrow"
            );
            if (insErr) throw insErr;

            setBorrowOk("Borrow created successfully.");
            await load({ silent: true });
        } catch (e) {
            setBorrowError(e?.message || "Borrow failed");
        } finally {
            setBorrowSaving(false);
        }
    };

    // Loading / Error / Not found shells (use correct radii)
    if (loading) {
        return (
            <RoleGuard
                allowedRoles={[
                    ROLES.ADMIN,
                    ROLES.LIBRARIAN,
                    ROLES.STAFF,
                    ROLES.READER,
                ]}
            >
                <AppShell title="Book">
                    <PageHeader title="Book" subtitle="Loading…" />
                    <Paper variant="outlined" sx={{ ...surfaceCard, p: 2.5 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Loading…
                        </Typography>
                    </Paper>
                </AppShell>
            </RoleGuard>
        );
    }

    if (error) {
        return (
            <RoleGuard
                allowedRoles={[
                    ROLES.ADMIN,
                    ROLES.LIBRARIAN,
                    ROLES.STAFF,
                    ROLES.READER,
                ]}
            >
                <AppShell title="Book">
                    <PageHeader title="Book" subtitle="Unable to load book" />
                    <Paper variant="outlined" sx={{ ...surfaceCard, p: 2.5 }}>
                        <Typography
                            sx={{ fontWeight: 900, color: "error.main" }}
                        >
                            {error}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                            Try refreshing the page.
                        </Typography>
                    </Paper>
                </AppShell>
            </RoleGuard>
        );
    }

    if (!book) {
        return (
            <RoleGuard
                allowedRoles={[
                    ROLES.ADMIN,
                    ROLES.LIBRARIAN,
                    ROLES.STAFF,
                    ROLES.READER,
                ]}
            >
                <AppShell title="Book">
                    <PageHeader
                        title="Book not found"
                        subtitle="This book may not exist."
                    />
                    <Paper variant="outlined" sx={{ ...surfaceCard, p: 2.5 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Not found
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.5 }}
                        >
                            The book you’re looking for is missing or you don’t
                            have access.
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                            <Button
                                component={Link}
                                href="/books"
                                variant="contained"
                                sx={{
                                    borderRadius: "999px",
                                    px: 2.2,
                                    boxShadow: "none",
                                    "&:hover": { boxShadow: "none" },
                                }}
                            >
                                Back to Books
                            </Button>
                        </Box>
                    </Paper>
                </AppShell>
            </RoleGuard>
        );
    }

    const coverUrl = book.coverImageUrl || "";

    // Placeholder borrowing history (replace $ with PKR)
    const historyRows = [
        { m: "Mia Sharp", b: "Aug 24, 2025", r: "Aug 30", o: "—", f: 0 },
        { m: "Celine Moore", b: "Jul 26, 2025", r: "Jul 31", o: "—", f: 0 },
        { m: "Ava Lin", b: "Jun 15, 2025", r: "Jun 26", o: "4 days", f: 600 },
    ];

    return (
        <RoleGuard
            allowedRoles={[
                ROLES.ADMIN,
                ROLES.LIBRARIAN,
                ROLES.STAFF,
                ROLES.READER,
            ]}
        >
            <AppShell title="Book">
                <PageHeader
                    title={book.title}
                    subtitle={`${book.genre || "—"} • ${book.author || "—"}`}
                    right={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {canManageBooks ? (
                                <Button
                                    variant="outlined"
                                    sx={{
                                        borderRadius: "999px",
                                        px: 2,
                                        borderColor: borderSoft,
                                        "&:hover": {
                                            borderColor: alpha(
                                                theme.palette.primary.main,
                                                0.45
                                            ),
                                        },
                                    }}
                                >
                                    Edit
                                </Button>
                            ) : null}

                            {canManageBooks ? (
                                <Button
                                    variant="contained"
                                    sx={{
                                        borderRadius: "999px",
                                        px: 2.2,
                                        boxShadow: "none",
                                        "&:hover": { boxShadow: "none" },
                                    }}
                                    onClick={() => {
                                        setBorrowError("");
                                        setBorrowOk("");
                                        setReaderUsername("");
                                        setBranchId(branches?.[0]?.id || "");
                                        setBorrowOpen(true);
                                    }}
                                    disabled={(book.stockAvailable ?? 0) <= 0}
                                >
                                    Borrow for Reader
                                </Button>
                            ) : null}
                        </Box>
                    }
                />

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    {/* Main */}
                    <Box sx={{ display: "grid", gap: 2 }}>
                        {/* Book summary card */}
                        <Card sx={surfaceCard}>
                            <CardContent
                                sx={{
                                    p: 2.5,
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "240px 1fr",
                                    },
                                    gap: 2.5,
                                }}
                            >
                                {/* Cover */}
                                <Box
                                    sx={{
                                        height: 320,
                                        borderRadius: R.xl,
                                        border: `1px solid ${borderSoft}`,
                                        overflow: "hidden",
                                        background: coverUrl
                                            ? `url(${coverUrl}) center / cover no-repeat`
                                            : `linear-gradient(135deg,
                          ${alpha(theme.palette.primary.main, 0.35)} 0%,
                          ${alpha(theme.palette.primary.main, 0.1)} 55%,
                          ${alpha("#000000", 0)} 100%)`,
                                        position: "relative",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            left: 14,
                                            top: 14,
                                            display: "flex",
                                            gap: 1,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Chip
                                            size="small"
                                            label={book.genre || "—"}
                                            sx={{
                                                height: 28,
                                                borderRadius: "999px",
                                                fontWeight: 850,
                                                bgcolor: alpha(
                                                    theme.palette.primary.main,
                                                    isDark ? 0.14 : 0.1
                                                ),
                                                color: "primary.main",
                                                border: `1px solid ${alpha(
                                                    theme.palette.primary.main,
                                                    0.22
                                                )}`,
                                                "& .MuiChip-label": { px: 1.1 },
                                            }}
                                        />
                                        <AvailabilityPill
                                            available={book.stockAvailable}
                                        />
                                    </Box>
                                </Box>

                                {/* Details */}
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 950,
                                            letterSpacing: "-0.02em",
                                            lineHeight: 1.15,
                                        }}
                                    >
                                        {book.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.75,
                                        }}
                                    >
                                        By <b>{book.author || "—"}</b>
                                    </Typography>

                                    {/* Price (PKR) if present */}
                                    {book.price != null ? (
                                        <Typography
                                            sx={{ mt: 0.75, fontWeight: 850 }}
                                        >
                                            Price:{" "}
                                            <Box
                                                component="span"
                                                sx={{ color: "primary.main" }}
                                            >
                                                {moneyPKR(book.price)}
                                            </Box>
                                        </Typography>
                                    ) : null}

                                    <Divider
                                        sx={{ my: 2, borderColor: borderSoft }}
                                    />

                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                sm: "repeat(2, 1fr)",
                                            },
                                            gap: 1.25,
                                        }}
                                    >
                                        <Meta
                                            label="ISBN"
                                            value={book.isbn || "—"}
                                        />
                                        <Meta
                                            label="Publisher"
                                            value={book.publisher || "—"}
                                        />
                                        <Meta
                                            label="Edition"
                                            value={book.edition || "—"}
                                        />
                                        <Meta
                                            label="Year"
                                            value={String(book.year ?? "—")}
                                        />
                                        <Meta
                                            label="Language"
                                            value={book.language || "—"}
                                        />
                                        <Meta
                                            label="Pages"
                                            value={String(book.pages ?? "—")}
                                        />
                                    </Box>

                                    <Divider
                                        sx={{ my: 2, borderColor: borderSoft }}
                                    />

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            lineHeight: 1.65,
                                        }}
                                    >
                                        {book.description || "—"}
                                    </Typography>

                                    {Array.isArray(book.tags) &&
                                    book.tags.length ? (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                gap: 1,
                                                flexWrap: "wrap",
                                                mt: 2,
                                            }}
                                        >
                                            {book.tags.map((t) => (
                                                <Chip
                                                    key={t}
                                                    size="small"
                                                    label={t}
                                                    sx={{
                                                        height: 28,
                                                        borderRadius: "999px",
                                                        fontWeight: 750,
                                                        bgcolor: alpha(
                                                            isDark
                                                                ? "#FFFFFF"
                                                                : "#0F1115",
                                                            isDark ? 0.06 : 0.04
                                                        ),
                                                        border: `1px solid ${borderSoft}`,
                                                        "& .MuiChip-label": {
                                                            px: 1.1,
                                                        },
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    ) : null}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Borrowing history */}
                        <Card sx={surfaceCard}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 950,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    Borrowing History
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    UI placeholder data
                                </Typography>

                                <Divider
                                    sx={{ my: 2, borderColor: borderSoft }}
                                />

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell
                                                sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 850,
                                                }}
                                            >
                                                Member
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 850,
                                                }}
                                            >
                                                Borrow
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 850,
                                                }}
                                            >
                                                Return
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 850,
                                                }}
                                            >
                                                Overdue
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: "text.secondary",
                                                    fontWeight: 850,
                                                }}
                                            >
                                                Fine (PKR)
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historyRows.map((row) => (
                                            <TableRow
                                                key={row.m}
                                                sx={{
                                                    "&:hover": {
                                                        backgroundColor:
                                                            hoverBg,
                                                    },
                                                }}
                                            >
                                                <TableCell
                                                    sx={{ fontWeight: 850 }}
                                                >
                                                    {row.m}
                                                </TableCell>
                                                <TableCell>{row.b}</TableCell>
                                                <TableCell>{row.r}</TableCell>
                                                <TableCell>{row.o}</TableCell>
                                                <TableCell align="right">
                                                    {moneyPKR(row.f)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Right rail */}
                    <Box sx={{ display: "grid", gap: 2 }}>
                        <Card sx={surfaceCard}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 950,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    Reservations
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Queue overview (UI placeholder)
                                </Typography>

                                <Divider
                                    sx={{ my: 2, borderColor: borderSoft }}
                                />

                                <AvatarGroup
                                    max={4}
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(
                                                theme.palette.primary.main,
                                                0.25
                                            ),
                                            color: "text.primary",
                                        }}
                                    >
                                        MR
                                    </Avatar>
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha("#3B82F6", 0.25),
                                            color: "text.primary",
                                        }}
                                    >
                                        NT
                                    </Avatar>
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha("#2BB673", 0.25),
                                            color: "text.primary",
                                        }}
                                    >
                                        EA
                                    </Avatar>
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha("#F5A524", 0.25),
                                            color: "text.primary",
                                        }}
                                    >
                                        NM
                                    </Avatar>
                                </AvatarGroup>

                                <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                                    {[
                                        { t: "Queue #2", s: "Ready" },
                                        { t: "Queue #6", s: "Pending" },
                                    ].map((x) => (
                                        <Paper
                                            key={x.t}
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
                                            >
                                                {x.t}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                Status: {x.s}
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={surfaceCard}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 950,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    Stock
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
                                            Total
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 950,
                                                fontSize: 22,
                                            }}
                                        >
                                            {book.stockTotal}
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
                                            Available
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 950,
                                                fontSize: 22,
                                            }}
                                        >
                                            {book.stockAvailable}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={surfaceCard}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 950,
                                        letterSpacing: "-0.01em",
                                    }}
                                >
                                    Related Books
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Same genre (live)
                                </Typography>

                                <Divider
                                    sx={{ my: 2, borderColor: borderSoft }}
                                />

                                <Box sx={{ display: "grid", gap: 1 }}>
                                    {related.map((b) => (
                                        <Paper
                                            key={b.id}
                                            variant="outlined"
                                            component={Link}
                                            href={`/books/${b.id}`}
                                            sx={{
                                                p: 1.25,
                                                borderRadius: R.lg,
                                                borderColor: borderSoft,
                                                textDecoration: "none",
                                                color: "inherit",
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
                                                {b.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                                noWrap
                                            >
                                                {b.author}
                                            </Typography>
                                        </Paper>
                                    ))}

                                    {related.length === 0 ? (
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            No related books found.
                                        </Typography>
                                    ) : null}
                                </Box>
                            </CardContent>
                        </Card>
                    </Box>
                </Box>

                {/* Borrow dialog */}
                <Dialog
                    open={borrowOpen}
                    onClose={() => setBorrowOpen(false)}
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle sx={{ fontWeight: 950 }}>
                        Borrow for Reader
                    </DialogTitle>
                    <DialogContent sx={{ pt: 1 }}>
                        {borrowError ? (
                            <Alert
                                severity="error"
                                sx={{ mb: 2, borderRadius: R.lg }}
                            >
                                {borrowError}
                            </Alert>
                        ) : null}
                        {borrowOk ? (
                            <Alert
                                severity="success"
                                sx={{ mb: 2, borderRadius: R.lg }}
                            >
                                {borrowOk}
                            </Alert>
                        ) : null}

                        <TextField
                            label="Reader username"
                            value={readerUsername}
                            onChange={(e) => setReaderUsername(e.target.value)}
                            fullWidth
                            sx={{ mt: 1 }}
                            disabled={borrowSaving}
                            helperText="Must be a Reader account (profiles.username)."
                        />

                        <TextField
                            select
                            label="Branch"
                            value={branchId}
                            onChange={(e) => setBranchId(e.target.value)}
                            fullWidth
                            sx={{ mt: 2 }}
                            disabled={borrowSaving}
                        >
                            {(branches || []).map((b) => (
                                <MenuItem key={b.id} value={b.id}>
                                    {b.name}
                                </MenuItem>
                            ))}
                            {!branches || branches.length === 0 ? (
                                <MenuItem value="" disabled>
                                    No branches found
                                </MenuItem>
                            ) : null}
                        </TextField>

                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.secondary",
                                display: "block",
                                mt: 2,
                            }}
                        >
                            Borrow rules are enforced by your DB trigger (active
                            subscription, fine threshold, branch hours, stock).
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={{ p: 2 }}>
                        <Button
                            variant="outlined"
                            sx={{
                                borderRadius: "999px",
                                px: 2,
                                borderColor: borderSoft,
                                "&:hover": {
                                    borderColor: alpha(
                                        theme.palette.primary.main,
                                        0.45
                                    ),
                                },
                            }}
                            onClick={() => setBorrowOpen(false)}
                            disabled={borrowSaving}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            sx={{
                                borderRadius: "999px",
                                px: 2.2,
                                boxShadow: "none",
                                "&:hover": { boxShadow: "none" },
                            }}
                            onClick={submitBorrow}
                            disabled={borrowSaving}
                        >
                            {borrowSaving ? "Borrowing…" : "Create Borrow"}
                        </Button>
                    </DialogActions>
                </Dialog>
            </AppShell>
        </RoleGuard>
    );
}

function Meta({ label, value }) {
    return (
        <Box>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
            </Typography>
            <Typography sx={{ fontWeight: 850 }}>{value}</Typography>
        </Box>
    );
}

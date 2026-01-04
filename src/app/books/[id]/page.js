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
import AppShell from "../../../components/AppShell";
import PageHeader from "../../../components/PageHeader";
import RoleGuard from "../../../components/RoleGuard";
import { ROLES } from "../../../lib/roles";
import { useAuth } from "@/context/AuthContext";

function withTimeout(promise, ms, label = "Request") {
    let t;
    const timeout = new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
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

        // placeholders (not in DB)
        language: b.language || "—",
        pages: b.pages || "—",
        description: b.description || "—",
        tags: Array.isArray(b.tags) ? b.tags : [],
    };
}

export default function BookDetailsPage() {
    const params = useParams();
    const bookId = String(params?.id || "");

    const { supabase, role } = useAuth();

    const [book, setBook] = React.useState(null);
    const [related, setRelated] = React.useState([]);
    const [branches, setBranches] = React.useState([]);

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState("");

    const canManageBooks = role === "Administrator" || role === "Librarian";

    // Borrow dialog state (Librarian/Admin only)
    const [borrowOpen, setBorrowOpen] = React.useState(false);
    const [borrowSaving, setBorrowSaving] = React.useState(false);
    const [borrowError, setBorrowError] = React.useState("");
    const [borrowOk, setBorrowOk] = React.useState("");
    const [readerUsername, setReaderUsername] = React.useState("");
    const [branchId, setBranchId] = React.useState("");

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
                // Load branches (for borrow dialog; harmless for readers too)
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

                // Related: same genre
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

    // Borrow handler (Librarian/Admin)
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
            // Lookup reader by username
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
            if (prof.role !== "Reader") {
                throw new Error("Username must belong to a Reader account.");
            }

            // Insert borrow (trigger sets due_date/plan/status + decrements stock atomically)
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
            // Reload book (stock changes)
            await load({ silent: true });
        } catch (e) {
            setBorrowError(e?.message || "Borrow failed");
        } finally {
            setBorrowSaving(false);
        }
    };

    // Loading shell
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
                    <Paper variant="outlined" sx={{ borderRadius: 4, p: 3 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Loading…
                        </Typography>
                    </Paper>
                </AppShell>
            </RoleGuard>
        );
    }

    // Error
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
                    <Paper variant="outlined" sx={{ borderRadius: 4, p: 3 }}>
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

    // Not found
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
                    <Paper variant="outlined" sx={{ borderRadius: 4, p: 3 }}>
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
                                sx={{ borderRadius: 3 }}
                            >
                                Back to Books
                            </Button>
                        </Box>
                    </Paper>
                </AppShell>
            </RoleGuard>
        );
    }

    const coverUrl = book.cover_image_url || "";

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
                        <>
                            {canManageBooks ? (
                                <Button
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                >
                                    Edit
                                </Button>
                            ) : null}

                            {canManageBooks ? (
                                <Button
                                    variant="contained"
                                    sx={{ borderRadius: 3 }}
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
                        </>
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
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: {
                                        xs: "1fr",
                                        md: "220px 1fr",
                                    },
                                    gap: 2,
                                }}
                            >
                                {/* Cover */}
                                <Box
                                    sx={{
                                        height: 280,
                                        borderRadius: 4,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        overflow: "hidden",
                                        background: coverUrl
                                            ? `url(${coverUrl}) center / cover no-repeat`
                                            : "linear-gradient(135deg, rgba(255,106,61,0.25) 0%, rgba(255,106,61,0.05) 55%, rgba(0,0,0,0) 100%)",
                                    }}
                                />

                                {/* Details */}
                                <Box>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Chip
                                            size="small"
                                            label={book.genre || "—"}
                                            sx={{
                                                borderRadius: 2,
                                                fontWeight: 800,
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={
                                                book.stockAvailable > 0
                                                    ? "Available"
                                                    : "Out of stock"
                                            }
                                            sx={{
                                                borderRadius: 2,
                                                fontWeight: 800,
                                                backgroundColor:
                                                    book.stockAvailable > 0
                                                        ? "rgba(46,204,113,0.15)"
                                                        : "rgba(231,76,60,0.15)",
                                                color:
                                                    book.stockAvailable > 0
                                                        ? "#2ecc71"
                                                        : "#e74c3c",
                                            }}
                                        />
                                    </Box>

                                    <Typography
                                        variant="h5"
                                        sx={{ fontWeight: 900, mt: 1 }}
                                    >
                                        {book.title}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: "text.secondary",
                                            mt: 0.5,
                                        }}
                                    >
                                        By <b>{book.author || "—"}</b>
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

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

                                    <Divider sx={{ my: 2 }} />

                                    <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
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
                                                    sx={{ borderRadius: 2 }}
                                                />
                                            ))}
                                        </Box>
                                    ) : null}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Borrowing history placeholder */}
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Borrowing History
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    UI placeholder data
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Member</TableCell>
                                            <TableCell>Borrow</TableCell>
                                            <TableCell>Return</TableCell>
                                            <TableCell>Overdue</TableCell>
                                            <TableCell align="right">
                                                Fine
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[
                                            {
                                                m: "Mia Sharp",
                                                b: "Aug 24, 2025",
                                                r: "Aug 30",
                                                o: "—",
                                                f: "$0.00",
                                            },
                                            {
                                                m: "Celine Moore",
                                                b: "Jul 26, 2025",
                                                r: "Jul 31",
                                                o: "—",
                                                f: "$0.00",
                                            },
                                            {
                                                m: "Ava Lin",
                                                b: "Jun 15, 2025",
                                                r: "Jun 26",
                                                o: "4 days",
                                                f: "$2.00",
                                            },
                                        ].map((row) => (
                                            <TableRow key={row.m}>
                                                <TableCell
                                                    sx={{ fontWeight: 800 }}
                                                >
                                                    {row.m}
                                                </TableCell>
                                                <TableCell>{row.b}</TableCell>
                                                <TableCell>{row.r}</TableCell>
                                                <TableCell>{row.o}</TableCell>
                                                <TableCell align="right">
                                                    {row.f}
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
                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Reservations
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Queue overview (UI placeholder)
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <AvatarGroup
                                    max={4}
                                    sx={{ justifyContent: "flex-start" }}
                                >
                                    <Avatar>MR</Avatar>
                                    <Avatar>NT</Avatar>
                                    <Avatar>EA</Avatar>
                                    <Avatar>NM</Avatar>
                                </AvatarGroup>

                                <Box sx={{ mt: 2, display: "grid", gap: 1 }}>
                                    {[
                                        { t: "Queue #2", s: "Ready" },
                                        { t: "Queue #6", s: "Pending" },
                                    ].map((x) => (
                                        <Paper
                                            key={x.t}
                                            variant="outlined"
                                            sx={{ p: 1.25, borderRadius: 3 }}
                                        >
                                            <Typography
                                                sx={{ fontWeight: 800 }}
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

                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Stock
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
                                            Total
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: 22,
                                            }}
                                        >
                                            {book.stockTotal}
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
                                            Available
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontWeight: 900,
                                                fontSize: 22,
                                            }}
                                        >
                                            {book.stockAvailable}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </CardContent>
                        </Card>

                        <Card sx={{ borderRadius: 4 }}>
                            <CardContent>
                                <Typography sx={{ fontWeight: 900 }}>
                                    Related Books
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Same genre (live)
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: "grid", gap: 1 }}>
                                    {related.map((b) => (
                                        <Paper
                                            key={b.id}
                                            variant="outlined"
                                            sx={{ p: 1.25, borderRadius: 3 }}
                                            component={Link}
                                            href={`/books/${b.id}`}
                                        >
                                            <Typography
                                                sx={{ fontWeight: 800 }}
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

                {/* Borrow dialog (Librarian/Admin only) */}
                <Dialog
                    open={borrowOpen}
                    onClose={() => setBorrowOpen(false)}
                    fullWidth
                    maxWidth="sm"
                >
                    <DialogTitle sx={{ fontWeight: 900 }}>
                        Borrow for Reader
                    </DialogTitle>
                    <DialogContent sx={{ pt: 1 }}>
                        {borrowError ? (
                            <Alert
                                severity="error"
                                sx={{ mb: 2, borderRadius: 3 }}
                            >
                                {borrowError}
                            </Alert>
                        ) : null}
                        {borrowOk ? (
                            <Alert
                                severity="success"
                                sx={{ mb: 2, borderRadius: 3 }}
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
                            sx={{ borderRadius: 3 }}
                            onClick={() => setBorrowOpen(false)}
                            disabled={borrowSaving}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ borderRadius: 3 }}
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
            <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
        </Box>
    );
}

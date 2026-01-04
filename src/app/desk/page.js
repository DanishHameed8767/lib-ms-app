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
    Tabs,
    Tab,
    List,
    ListItemButton,
    ListItemText,
    Chip,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import RoleGuard from "../../components/RoleGuard";
import { ROLES } from "../../lib/roles";

import { mockReaders } from "../../lib/mock/readers";
import { mockBooks } from "../../lib/mock/books";
import { mockBorrows } from "../../lib/mock/borrows";
import {
    normalizeBook,
    todayISO,
    addDaysISO,
} from "../../lib/mock/deskHelpers";

function StatusChip({ status }) {
    const map = {
        Borrowed: { bg: "rgba(46,204,113,0.15)", fg: "#2ecc71" },
        Overdue: { bg: "rgba(231,76,60,0.15)", fg: "#e74c3c" },
        Returned: { bg: "rgba(160,160,160,0.18)", fg: "text.secondary" },
    };
    const s = map[status] || map.Borrowed;
    return (
        <Chip
            size="small"
            label={status}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: s.bg,
                color: s.fg,
            }}
        />
    );
}

function StockChip({ available }) {
    const ok = Number(available || 0) > 0;
    return (
        <Chip
            size="small"
            label={ok ? `Available ${available}` : "Out of stock"}
            sx={{
                borderRadius: 2,
                fontWeight: 900,
                backgroundColor: ok
                    ? "rgba(46,204,113,0.15)"
                    : "rgba(231,76,60,0.15)",
                color: ok ? "#2ecc71" : "#e74c3c",
            }}
        />
    );
}

export default function DeskPage() {
    // Local UI state copies (simulate DB updates)
    const [books, setBooks] = React.useState(() =>
        (mockBooks || []).map(normalizeBook)
    );
    const [borrows, setBorrows] = React.useState(() =>
        mockBorrows.map((b) => ({ ...b }))
    );

    // Member search + selection
    const [memberQuery, setMemberQuery] = React.useState("");
    const [selectedMember, setSelectedMember] = React.useState(mockReaders[0]);

    // Borrow tab: book search + selection
    const [tab, setTab] = React.useState(0); // 0 Borrow, 1 Return
    const [bookQuery, setBookQuery] = React.useState("");
    const [selectedBookId, setSelectedBookId] = React.useState("");

    // Activity log
    const [activity, setActivity] = React.useState([
        {
            id: "act_001",
            ts: new Date().toISOString(),
            text: "Desk ready (UI only).",
        },
    ]);

    const selectedBook = books.find((b) => b.id === selectedBookId) || null;

    const memberResults = mockReaders.filter((m) => {
        const q = memberQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            m.fullName.toLowerCase().includes(q) ||
            m.username.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q)
        );
    });

    const bookResults = books.filter((b) => {
        const q = bookQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            b.title.toLowerCase().includes(q) ||
            (b.author || "").toLowerCase().includes(q) ||
            String(b.isbn || "").includes(q)
        );
    });

    const memberActiveBorrows = borrows.filter(
        (x) =>
            x.readerUsername === selectedMember.username &&
            x.status !== "Returned"
    );

    const memberOverdueCount = memberActiveBorrows.filter(
        (x) => x.status === "Overdue"
    ).length;

    const canBorrow =
        selectedMember &&
        selectedBook &&
        Number(selectedBook.stockAvailable || 0) > 0;

    const borrowNow = () => {
        if (!canBorrow) return;

        // UI-only: pretend due_date is based on plan duration (use 14 days default)
        const due = addDaysISO(14);
        const newBorrow = {
            id: `br_${Math.random().toString(16).slice(2, 8)}`,
            readerUsername: selectedMember.username,
            bookId: selectedBook.id,
            bookTitle: selectedBook.title,
            branch: "Main Branch",
            startDate: todayISO(),
            dueDate: due,
            status: "Borrowed",
        };

        setBorrows((prev) => [newBorrow, ...prev]);
        setBooks((prev) =>
            prev.map((b) =>
                b.id === selectedBook.id
                    ? {
                          ...b,
                          stockAvailable: Math.max(
                              0,
                              Number(b.stockAvailable || 0) - 1
                          ),
                      }
                    : b
            )
        );

        setActivity((prev) => [
            {
                id: `act_${Date.now()}`,
                ts: new Date().toISOString(),
                text: `Borrowed “${selectedBook.title}” for @${selectedMember.username}.`,
            },
            ...prev,
        ]);
    };

    const returnBorrow = (borrowId) => {
        const target = borrows.find((b) => b.id === borrowId);
        if (!target) return;

        setBorrows((prev) =>
            prev.map((b) =>
                b.id === borrowId
                    ? { ...b, status: "Returned", returnDate: todayISO() }
                    : b
            )
        );

        setBooks((prev) =>
            prev.map((bk) =>
                String(bk.id) === String(target.bookId)
                    ? {
                          ...bk,
                          stockAvailable: Number(bk.stockAvailable || 0) + 1,
                      }
                    : bk
            )
        );

        setActivity((prev) => [
            {
                id: `act_${Date.now()}`,
                ts: new Date().toISOString(),
                text: `Returned “${target.bookTitle}” for @${selectedMember.username}.`,
            },
            ...prev,
        ]);
    };

    return (
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF]}>
            <AppShell title="Desk">
                <PageHeader
                    title="Desk"
                    subtitle="Borrow & return workflow (UI-only)"
                    right={
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Button
                                component={Link}
                                href="/payments"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                Payment Inbox
                            </Button>
                            <Button
                                component={Link}
                                href="/orders"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                Create Order
                            </Button>
                            <Chip
                                icon={<SwapHorizOutlinedIcon />}
                                label={`${memberActiveBorrows.length} active`}
                                sx={{ borderRadius: 3, fontWeight: 900 }}
                                variant="outlined"
                            />
                        </Box>
                    }
                />

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            lg: "340px 1fr 360px",
                        },
                        gap: 2,
                        alignItems: "start",
                    }}
                >
                    {/* LEFT: Member panel */}
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, overflow: "hidden" }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <PersonSearchOutlinedIcon fontSize="small" />
                                Member
                            </Typography>
                            <TextField
                                value={memberQuery}
                                onChange={(e) => setMemberQuery(e.target.value)}
                                placeholder="Search name / username / email…"
                                fullWidth
                                sx={{ mt: 1.5 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        <Divider />

                        <List
                            dense
                            sx={{ p: 1, maxHeight: 360, overflow: "auto" }}
                        >
                            {memberResults.map((m) => {
                                const selected =
                                    selectedMember?.username === m.username;
                                return (
                                    <ListItemButton
                                        key={m.id}
                                        selected={selected}
                                        onClick={() => setSelectedMember(m)}
                                        sx={{ borderRadius: 3, mb: 0.5 }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    sx={{ fontWeight: 900 }}
                                                >
                                                    {m.fullName}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    @{m.username} • {m.planName}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>

                        <Divider />

                        {/* Selected member summary */}
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Selected
                            </Typography>

                            <Paper
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 3, mt: 1.25 }}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    {selectedMember.fullName}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary" }}
                                >
                                    @{selectedMember.username} •{" "}
                                    {selectedMember.email}
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        flexWrap: "wrap",
                                        mt: 1.25,
                                    }}
                                >
                                    <Chip
                                        size="small"
                                        label={`${selectedMember.planName} plan`}
                                        sx={{
                                            borderRadius: 2,
                                            fontWeight: 900,
                                        }}
                                    />
                                    <Chip
                                        size="small"
                                        label={`Borrow ${memberActiveBorrows.length}/${selectedMember.borrowLimit}`}
                                        sx={{ borderRadius: 2 }}
                                    />
                                    {memberOverdueCount > 0 ? (
                                        <Chip
                                            size="small"
                                            icon={<WarningAmberOutlinedIcon />}
                                            label={`${memberOverdueCount} overdue`}
                                            sx={{
                                                borderRadius: 2,
                                                fontWeight: 900,
                                                backgroundColor:
                                                    "rgba(231,76,60,0.15)",
                                                color: "#e74c3c",
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            size="small"
                                            label="No overdue"
                                            sx={{
                                                borderRadius: 2,
                                                fontWeight: 900,
                                                backgroundColor:
                                                    "rgba(46,204,113,0.15)",
                                                color: "#2ecc71",
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: 1,
                                        mt: 1.25,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Button
                                        component={Link}
                                        href={`/members/${selectedMember.username}`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderRadius: 3 }}
                                    >
                                        Member Details
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    </Paper>

                    {/* MIDDLE: Borrow/Return */}
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, overflow: "hidden" }}
                    >
                        <Box sx={{ p: 1.25 }}>
                            <Tabs
                                value={tab}
                                onChange={(_, v) => setTab(v)}
                                sx={{
                                    minHeight: 40,
                                    "& .MuiTab-root": {
                                        minHeight: 40,
                                        textTransform: "none",
                                        fontWeight: 900,
                                        borderRadius: 3,
                                    },
                                }}
                            >
                                <Tab label="Borrow" />
                                <Tab label="Return" />
                            </Tabs>
                        </Box>

                        <Divider />

                        {/* Borrow tab */}
                        {tab === 0 ? (
                            <Box sx={{ p: 2, display: "grid", gap: 2 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <MenuBookOutlinedIcon fontSize="small" />
                                    Select book
                                </Typography>

                                <TextField
                                    value={bookQuery}
                                    onChange={(e) =>
                                        setBookQuery(e.target.value)
                                    }
                                    placeholder="Search title / author / ISBN…"
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            md: "1fr 1fr",
                                        },
                                        gap: 2,
                                    }}
                                >
                                    {/* Results */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 3,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Box sx={{ p: 1.5 }}>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                Results
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                {bookResults.length} found
                                            </Typography>
                                        </Box>
                                        <Divider />
                                        <List
                                            dense
                                            sx={{
                                                p: 1,
                                                maxHeight: 360,
                                                overflow: "auto",
                                            }}
                                        >
                                            {bookResults.map((b) => {
                                                const selected =
                                                    b.id === selectedBookId;
                                                return (
                                                    <ListItemButton
                                                        key={b.id}
                                                        selected={selected}
                                                        onClick={() =>
                                                            setSelectedBookId(
                                                                b.id
                                                            )
                                                        }
                                                        sx={{
                                                            borderRadius: 3,
                                                            mb: 0.5,
                                                        }}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 900,
                                                                    }}
                                                                >
                                                                    {b.title}
                                                                </Typography>
                                                            }
                                                            secondary={
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: "text.secondary",
                                                                    }}
                                                                >
                                                                    {b.author ||
                                                                        "—"}{" "}
                                                                    •{" "}
                                                                    {b.isbn ||
                                                                        "—"}
                                                                </Typography>
                                                            }
                                                        />
                                                        <StockChip
                                                            available={
                                                                b.stockAvailable
                                                            }
                                                        />
                                                    </ListItemButton>
                                                );
                                            })}
                                        </List>
                                    </Paper>

                                    {/* Selected book */}
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 3,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Box sx={{ p: 1.5 }}>
                                            <Typography
                                                sx={{ fontWeight: 900 }}
                                            >
                                                Selected Book
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: "text.secondary" }}
                                            >
                                                Borrow for selected member
                                            </Typography>
                                        </Box>

                                        <Divider />

                                        <Box
                                            sx={{
                                                p: 1.5,
                                                display: "grid",
                                                gap: 1,
                                            }}
                                        >
                                            {selectedBook ? (
                                                <>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 900,
                                                            fontSize: 16,
                                                        }}
                                                    >
                                                        {selectedBook.title}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        {selectedBook.author ||
                                                            "—"}{" "}
                                                        • ISBN{" "}
                                                        {selectedBook.isbn ||
                                                            "—"}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            gap: 1,
                                                            flexWrap: "wrap",
                                                            mt: 0.75,
                                                        }}
                                                    >
                                                        {selectedBook.genre ? (
                                                            <Chip
                                                                size="small"
                                                                label={
                                                                    selectedBook.genre
                                                                }
                                                                sx={{
                                                                    borderRadius: 2,
                                                                    fontWeight: 900,
                                                                }}
                                                            />
                                                        ) : null}
                                                        <StockChip
                                                            available={
                                                                selectedBook.stockAvailable
                                                            }
                                                        />
                                                    </Box>

                                                    <Divider sx={{ my: 1 }} />

                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Due date (preview):{" "}
                                                        <b>{addDaysISO(14)}</b>
                                                    </Typography>

                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            justifyContent:
                                                                "flex-end",
                                                            gap: 1,
                                                            mt: 1,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <Button
                                                            variant="contained"
                                                            sx={{
                                                                borderRadius: 3,
                                                            }}
                                                            disabled={
                                                                !canBorrow
                                                            }
                                                            onClick={borrowNow}
                                                        >
                                                            Borrow now
                                                        </Button>
                                                    </Box>

                                                    {!canBorrow ? (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: "text.secondary",
                                                            }}
                                                        >
                                                            Select a book with
                                                            available stock.
                                                        </Typography>
                                                    ) : null}
                                                </>
                                            ) : (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: "text.secondary",
                                                    }}
                                                >
                                                    Select a book from results.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Paper>
                                </Box>
                            </Box>
                        ) : null}

                        {/* Return tab */}
                        {tab === 1 ? (
                            <Box sx={{ p: 2 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    <ReplayOutlinedIcon fontSize="small" />
                                    Active borrows
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: "text.secondary", mt: 0.5 }}
                                >
                                    Return items for{" "}
                                    <b>@{selectedMember.username}</b>
                                </Typography>

                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 3,
                                        overflow: "hidden",
                                        mt: 2,
                                    }}
                                >
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table
                                            size="small"
                                            sx={{ minWidth: 960 }}
                                        >
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>
                                                        Borrow ID
                                                    </TableCell>
                                                    <TableCell>Book</TableCell>
                                                    <TableCell>Start</TableCell>
                                                    <TableCell>Due</TableCell>
                                                    <TableCell>
                                                        Status
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        Action
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {memberActiveBorrows.map(
                                                    (b) => (
                                                        <TableRow
                                                            key={b.id}
                                                            hover
                                                        >
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                {b.id}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    fontWeight: 900,
                                                                }}
                                                            >
                                                                {b.bookTitle}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                }}
                                                            >
                                                                {b.startDate}
                                                            </TableCell>
                                                            <TableCell
                                                                sx={{
                                                                    whiteSpace:
                                                                        "nowrap",
                                                                }}
                                                            >
                                                                {b.dueDate}
                                                            </TableCell>
                                                            <TableCell>
                                                                <StatusChip
                                                                    status={
                                                                        b.status
                                                                    }
                                                                />
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Button
                                                                    size="small"
                                                                    variant="contained"
                                                                    startIcon={
                                                                        <DoneOutlinedIcon />
                                                                    }
                                                                    sx={{
                                                                        borderRadius: 3,
                                                                    }}
                                                                    onClick={() =>
                                                                        returnBorrow(
                                                                            b.id
                                                                        )
                                                                    }
                                                                >
                                                                    Return
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    )
                                                )}

                                                {memberActiveBorrows.length ===
                                                0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            sx={{ py: 6 }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    textAlign:
                                                                        "center",
                                                                }}
                                                            >
                                                                <Typography
                                                                    sx={{
                                                                        fontWeight: 900,
                                                                    }}
                                                                >
                                                                    No active
                                                                    borrows
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        color: "text.secondary",
                                                                        mt: 0.5,
                                                                    }}
                                                                >
                                                                    This member
                                                                    has nothing
                                                                    to return.
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : null}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                </Paper>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        display: "block",
                                        mt: 1.25,
                                    }}
                                >
                                    Fine calculation + receipt upload will be
                                    wired when we connect triggers + payments.
                                </Typography>
                            </Box>
                        ) : null}
                    </Paper>

                    {/* RIGHT: Activity / quick summary */}
                    <Paper
                        variant="outlined"
                        sx={{ borderRadius: 4, overflow: "hidden" }}
                    >
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Activity
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                Latest desk actions (UI)
                            </Typography>
                        </Box>

                        <Divider />

                        <List
                            dense
                            sx={{ p: 1, maxHeight: 520, overflow: "auto" }}
                        >
                            {activity.map((a) => (
                                <ListItemText
                                    key={a.id}
                                    primary={
                                        <Typography sx={{ fontWeight: 900 }}>
                                            {a.text}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            {new Date(a.ts).toLocaleString()}
                                        </Typography>
                                    }
                                    sx={{
                                        p: 1.25,
                                        borderRadius: 3,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        mb: 1,
                                    }}
                                />
                            ))}
                        </List>

                        <Divider />

                        <Box sx={{ p: 2, display: "grid", gap: 1 }}>
                            <Typography sx={{ fontWeight: 900 }}>
                                Quick Summary
                            </Typography>
                            <Chip
                                label={`Member: @${selectedMember.username}`}
                                sx={{ borderRadius: 3, fontWeight: 900 }}
                                variant="outlined"
                            />
                            <Chip
                                label={`Active borrows: ${memberActiveBorrows.length}`}
                                sx={{ borderRadius: 3, fontWeight: 900 }}
                                variant="outlined"
                            />
                            <Chip
                                label={`Overdue: ${memberOverdueCount}`}
                                sx={{
                                    borderRadius: 3,
                                    fontWeight: 900,
                                    backgroundColor: memberOverdueCount
                                        ? "rgba(231,76,60,0.15)"
                                        : "rgba(46,204,113,0.15)",
                                    color: memberOverdueCount
                                        ? "#e74c3c"
                                        : "#2ecc71",
                                }}
                            />
                        </Box>
                    </Paper>
                </Box>
            </AppShell>
        </RoleGuard>
    );
}

"use client";

import * as React from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Paper,
    Divider,
    Button,
    Chip,
} from "@mui/material";
import AppShell from "../../components/AppShell";
import PageHeader from "../../components/PageHeader";
import {
    readerProfile,
    readerBorrows,
    readerFines,
    money,
} from "../../lib/mock/readerData";

export default function ReaderDashboardPage() {
    const activeCount = readerBorrows.filter(
        (b) => b.status === "Borrowed" || b.status === "Overdue"
    ).length;
    const overdueCount = readerBorrows.filter(
        (b) => b.status === "Overdue"
    ).length;
    const outstanding = readerFines.reduce(
        (sum, f) => sum + (f.outstanding || 0),
        0
    );

    return (
        <AppShell title="Dashboard">
            <PageHeader
                title="Dashboard"
                subtitle={`Welcome, ${readerProfile.fullName}`}
                right={
                    <Chip
                        label={`${readerProfile.planName} • Expires ${readerProfile.planExpires}`}
                        sx={{ borderRadius: 3, fontWeight: 900 }}
                        variant="outlined"
                    />
                }
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" },
                    gap: 2,
                }}
            >
                {/* Main */}
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "repeat(3, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        <StatCard
                            title="Borrowing"
                            value={`${activeCount} books`}
                            sub={`${overdueCount} overdue`}
                        />
                        <StatCard
                            title="Fines"
                            value={money(outstanding)}
                            sub="Outstanding balance"
                        />
                        <StatCard
                            title="Membership"
                            value={readerProfile.planName}
                            sub={`Limit ${readerProfile.borrowLimit}`}
                        />
                    </Box>

                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: 900 }}>
                                Borrowed Books
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                            >
                                Quick view of your current items
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: "grid", gap: 1 }}>
                                {readerBorrows
                                    .filter((b) => b.status !== "Returned")
                                    .slice(0, 3)
                                    .map((b) => (
                                        <Paper
                                            key={b.id}
                                            variant="outlined"
                                            sx={{ p: 1.25, borderRadius: 3 }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    gap: 2,
                                                }}
                                            >
                                                <Box>
                                                    <Typography
                                                        sx={{ fontWeight: 900 }}
                                                        noWrap
                                                    >
                                                        {b.bookTitle}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: "text.secondary",
                                                        }}
                                                    >
                                                        Due: <b>{b.dueDate}</b>{" "}
                                                        • {b.branch}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    size="small"
                                                    label={b.status}
                                                    sx={{
                                                        borderRadius: 2,
                                                        fontWeight: 900,
                                                        backgroundColor:
                                                            b.status ===
                                                            "Overdue"
                                                                ? "rgba(231,76,60,0.15)"
                                                                : "rgba(46,204,113,0.15)",
                                                        color:
                                                            b.status ===
                                                            "Overdue"
                                                                ? "#e74c3c"
                                                                : "#2ecc71",
                                                    }}
                                                />
                                            </Box>
                                        </Paper>
                                    ))}
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    mt: 2,
                                }}
                            >
                                <Button
                                    href="/reader/borrows"
                                    variant="contained"
                                    sx={{ borderRadius: 3 }}
                                >
                                    View All Borrowings
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Right rail */}
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: 900 }}>
                                Announcements
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                            >
                                Active notices (UI)
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: "grid", gap: 1 }}>
                                {[
                                    {
                                        t: "Holiday Hours",
                                        d: "Main Branch closed Sunday.",
                                        exp: "Jan 10",
                                    },
                                    {
                                        t: "New Arrivals",
                                        d: "Sci-Fi collection updated.",
                                        exp: "Jan 20",
                                    },
                                ].map((a) => (
                                    <Paper
                                        key={a.t}
                                        variant="outlined"
                                        sx={{ p: 1.25, borderRadius: 3 }}
                                    >
                                        <Typography sx={{ fontWeight: 900 }}>
                                            {a.t}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            {a.d}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: "text.secondary" }}
                                        >
                                            Expires: {a.exp}
                                        </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 4 }}>
                        <CardContent>
                            <Typography sx={{ fontWeight: 900 }}>
                                Fines
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.5 }}
                            >
                                Upload receipt to pay
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                                {money(outstanding)}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                Outstanding
                            </Typography>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    mt: 2,
                                }}
                            >
                                <Button
                                    href="/reader/fines"
                                    variant="outlined"
                                    sx={{ borderRadius: 3 }}
                                >
                                    Manage Fines
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </AppShell>
    );
}

function StatCard({ title, value, sub }) {
    return (
        <Card sx={{ borderRadius: 4 }}>
            <CardContent>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {title}
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 22, mt: 0.5 }}>
                    {value}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.5 }}
                >
                    {sub}
                </Typography>
            </CardContent>
        </Card>
    );
}

// src/app/page.js
"use client";

import * as React from "react";
import Link from "next/link";
import {
    Box,
    Container,
    Typography,
    Button,
    Chip,
    Paper,
    Divider,
    Stack,
} from "@mui/material";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";

function FeatureCard({ icon, title, desc }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 4,
                p: 2.25,
                height: "100%",
                background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                borderColor: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(10px)",
            }}
        >
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 3,
                    backgroundColor: "rgba(255,106,61,0.15)",
                    border: "1px solid rgba(255,106,61,0.25)",
                    mb: 1.25,
                }}
            >
                {icon}
            </Box>
            <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
            <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
            >
                {desc}
            </Typography>
        </Paper>
    );
}

export default function LandingPage() {
    return (
        <Box
            sx={{
                minHeight: "100dvh",
                color: "text.primary",
                position: "relative",
                overflow: "hidden",
                background:
                    "radial-gradient(1200px 600px at 20% 10%, rgba(255,106,61,0.25) 0%, rgba(0,0,0,0) 60%), radial-gradient(1000px 700px at 85% 25%, rgba(52,152,219,0.18) 0%, rgba(0,0,0,0) 55%), radial-gradient(900px 600px at 40% 100%, rgba(46,204,113,0.14) 0%, rgba(0,0,0,0) 55%)",
            }}
        >
            {/* subtle grid */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0.25,
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage:
                        "radial-gradient(closest-side, rgba(0,0,0,1), rgba(0,0,0,0))",
                }}
            />

            {/* Top bar */}
            <Container maxWidth="lg" sx={{ position: "relative" }}>
                <Box
                    sx={{
                        py: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 3,
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: "rgba(255,106,61,0.15)",
                                border: "1px solid rgba(255,106,61,0.25)",
                            }}
                        >
                            <LocalLibraryOutlinedIcon />
                        </Box>
                        <Typography
                            sx={{
                                fontWeight: 900,
                                letterSpacing: 0.2,
                                fontSize: 18,
                            }}
                        >
                            <Box
                                component="span"
                                sx={{ color: "primary.main" }}
                            >
                                LIBRA
                            </Box>
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Button
                            component={Link}
                            href="/login"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                        >
                            Sign in
                        </Button>
                        <Button
                            component={Link}
                            href="/login"
                            variant="contained"
                            endIcon={<ArrowForwardRoundedIcon />}
                            sx={{ borderRadius: 3 }}
                        >
                            Get started
                        </Button>
                    </Stack>
                </Box>

                {/* Hero */}
                <Box
                    sx={{
                        pt: { xs: 6, md: 9 },
                        pb: { xs: 5, md: 7 },
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
                        gap: { xs: 4, md: 5 },
                        alignItems: "center",
                    }}
                >
                    <Box>
                        <Chip
                            label="Modern library management"
                            sx={{
                                borderRadius: 3,
                                fontWeight: 900,
                                backgroundColor: "rgba(255,106,61,0.14)",
                                border: "1px solid rgba(255,106,61,0.22)",
                                mb: 2,
                            }}
                        />

                        <Typography
                            sx={{
                                fontWeight: 1000,
                                lineHeight: 1.05,
                                fontSize: { xs: 40, sm: 52, md: 60 },
                                letterSpacing: -0.6,
                            }}
                        >
                            Borrow, manage, and track your library —{" "}
                            <Box
                                component="span"
                                sx={{ color: "primary.main" }}
                            >
                                beautifully
                            </Box>
                            .
                        </Typography>

                        <Typography
                            variant="body1"
                            sx={{
                                color: "text.secondary",
                                mt: 2,
                                maxWidth: 560,
                                fontSize: { xs: 15, md: 16 },
                            }}
                        >
                            Libra makes it easy for readers to explore books and
                            subscriptions, while staff can handle borrows,
                            fines, orders, and announcements in one clean
                            dashboard.
                        </Typography>

                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ mt: 3 }}
                        >
                            <Button
                                component={Link}
                                href="/login"
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForwardRoundedIcon />}
                                sx={{ borderRadius: 3, px: 2.5, py: 1.25 }}
                            >
                                Sign in to Libra
                            </Button>
                            <Button
                                component={Link}
                                href="/books"
                                variant="outlined"
                                size="large"
                                sx={{ borderRadius: 3, px: 2.5, py: 1.25 }}
                            >
                                Browse books
                            </Button>
                        </Stack>

                        <Box sx={{ mt: 3 }}>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                Secure auth • Role-based access • Receipt-based
                                payments
                            </Typography>
                        </Box>
                    </Box>

                    {/* Right hero card */}
                    <Paper
                        variant="outlined"
                        sx={{
                            borderRadius: 5,
                            overflow: "hidden",
                            borderColor: "rgba(255,255,255,0.10)",
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <Box
                            sx={{
                                p: 2.25,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Typography sx={{ fontWeight: 900 }}>
                                What you can do
                            </Typography>
                            <Chip
                                size="small"
                                label="Live in-app"
                                sx={{
                                    borderRadius: 2,
                                    fontWeight: 900,
                                    backgroundColor: "rgba(46,204,113,0.14)",
                                    border: "1px solid rgba(46,204,113,0.22)",
                                }}
                            />
                        </Box>

                        <Divider
                            sx={{ borderColor: "rgba(255,255,255,0.10)" }}
                        />

                        <Box
                            sx={{
                                p: 2.25,
                                display: "grid",
                                gap: 1.25,
                            }}
                        >
                            <MiniRow
                                icon={<MenuBookOutlinedIcon fontSize="small" />}
                                title="Discover & borrow"
                                sub="Search titles, track due dates, renew quickly."
                            />
                            <MiniRow
                                icon={<PaymentsOutlinedIcon fontSize="small" />}
                                title="Fines & receipts"
                                sub="Upload receipts for fines and approvals."
                            />
                            <MiniRow
                                icon={
                                    <AutoStoriesOutlinedIcon fontSize="small" />
                                }
                                title="Membership plans"
                                sub="Request subscriptions and upgrade your plan."
                            />
                            <MiniRow
                                icon={<CampaignOutlinedIcon fontSize="small" />}
                                title="Announcements"
                                sub="Stay updated with library notices and policies."
                            />
                        </Box>

                        <Divider
                            sx={{ borderColor: "rgba(255,255,255,0.10)" }}
                        />

                        <Box sx={{ p: 2.25, display: "flex", gap: 1 }}>
                            <Button
                                component={Link}
                                href="/login"
                                variant="contained"
                                fullWidth
                                sx={{ borderRadius: 3 }}
                            >
                                Sign in
                            </Button>
                            <Button
                                component={Link}
                                href="/policies"
                                variant="outlined"
                                fullWidth
                                sx={{ borderRadius: 3 }}
                            >
                                View policies
                            </Button>
                        </Box>
                    </Paper>
                </Box>

                {/* Features */}
                <Box sx={{ pb: { xs: 7, md: 9 } }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "end",
                            gap: 2,
                            flexWrap: "wrap",
                            mb: 2,
                        }}
                    >
                        <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                                Built for readers and staff
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary", mt: 0.25 }}
                            >
                                A clean UI with the essentials — fast.
                            </Typography>
                        </Box>
                        <Chip
                            label="Role-based navigation"
                            variant="outlined"
                            sx={{ borderRadius: 3, fontWeight: 900 }}
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, 1fr)",
                                md: "repeat(4, 1fr)",
                            },
                            gap: 2,
                        }}
                    >
                        <FeatureCard
                            icon={<MenuBookOutlinedIcon />}
                            title="Unified catalog"
                            desc="Browse books with clean metadata and quick actions."
                        />
                        <FeatureCard
                            icon={<PaymentsOutlinedIcon />}
                            title="Receipt approvals"
                            desc="Simple payments: upload receipt, staff reviews."
                        />
                        <FeatureCard
                            icon={<AutoStoriesOutlinedIcon />}
                            title="Memberships"
                            desc="Plans, upgrades, and subscription requests in-app."
                        />
                        <FeatureCard
                            icon={<CampaignOutlinedIcon />}
                            title="Clear communication"
                            desc="Announcements and policies always accessible."
                        />
                    </Box>

                    {/* Footer */}
                    <Box
                        sx={{
                            mt: 5,
                            py: 3,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 2,
                            borderTop: "1px solid rgba(255,255,255,0.10)",
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            © {new Date().getFullYear()} Libra • Library
                            management made simple.
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <Button
                                component={Link}
                                href="/announcements"
                                size="small"
                                variant="text"
                                sx={{ borderRadius: 3 }}
                            >
                                Announcements
                            </Button>
                            <Button
                                component={Link}
                                href="/policies"
                                size="small"
                                variant="text"
                                sx={{ borderRadius: 3 }}
                            >
                                Policies
                            </Button>
                            <Button
                                component={Link}
                                href="/login"
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                            >
                                Sign in
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}

function MiniRow({ icon, title, sub }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.25,
                alignItems: "flex-start",
            }}
        >
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2.5,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    mt: 0.25,
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                    {title}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.25 }}
                >
                    {sub}
                </Typography>
            </Box>
        </Box>
    );
}

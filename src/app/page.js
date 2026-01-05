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
import { alpha, useTheme } from "@mui/material/styles";

import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import LocalLibraryOutlinedIcon from "@mui/icons-material/LocalLibraryOutlined";

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

function FeatureCard({ icon, title, desc }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const surface = {
        borderRadius: R.lg,
        p: 2.25,
        height: "100%",
        border: `1px solid ${alpha(
            isDark ? "#FFFFFF" : "#0F1115",
            isDark ? 0.1 : 0.1
        )}`,
        background: isDark
            ? `linear-gradient(180deg, ${alpha("#FFFFFF", 0.06)} 0%, ${alpha(
                  "#FFFFFF",
                  0.02
              )} 100%)`
            : `linear-gradient(180deg, ${alpha("#FFFFFF", 0.95)} 0%, ${alpha(
                  "#FFFFFF",
                  0.86
              )} 100%)`,
        backdropFilter: "blur(10px)",
        boxShadow: isDark
            ? "0 12px 26px rgba(0,0,0,0.35)"
            : "0 12px 26px rgba(18,18,18,0.08)",
    };

    return (
        <Paper variant="outlined" sx={surface}>
            <Box
                sx={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: R.md,
                    backgroundColor: alpha(
                        theme.palette.primary.main,
                        isDark ? 0.16 : 0.12
                    ),
                    border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        isDark ? 0.28 : 0.22
                    )}`,
                    mb: 1.25,
                }}
            >
                {icon}
            </Box>

            <Typography sx={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
                {title}
            </Typography>
            <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 0.5 }}
            >
                {desc}
            </Typography>
        </Paper>
    );
}

function MiniRow({ icon, title, sub }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    return (
        <Box sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: R.md,
                    backgroundColor: isDark
                        ? alpha("#FFFFFF", 0.06)
                        : alpha("#0F1115", 0.04),
                    border: `1px solid ${alpha(
                        isDark ? "#FFFFFF" : "#0F1115",
                        isDark ? 0.1 : 0.1
                    )}`,
                    mt: 0.25,
                }}
            >
                {icon}
            </Box>

            <Box>
                <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
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

export default function LandingPage() {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );

    const heroBg = isDark
        ? [
              `radial-gradient(1200px 600px at 18% 12%, ${alpha(
                  theme.palette.primary.main,
                  0.28
              )} 0%, rgba(0,0,0,0) 60%)`,
              `radial-gradient(900px 600px at 82% 20%, ${alpha(
                  "#3B82F6",
                  0.16
              )} 0%, rgba(0,0,0,0) 55%)`,
              `radial-gradient(900px 600px at 45% 100%, ${alpha(
                  "#2BB673",
                  0.12
              )} 0%, rgba(0,0,0,0) 55%)`,
              `linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.30) 100%)`,
          ].join(",")
        : [
              `radial-gradient(1200px 600px at 18% 12%, ${alpha(
                  theme.palette.primary.main,
                  0.22
              )} 0%, rgba(255,255,255,0) 60%)`,
              `radial-gradient(900px 600px at 82% 20%, ${alpha(
                  "#3B82F6",
                  0.1
              )} 0%, rgba(255,255,255,0) 55%)`,
              `radial-gradient(900px 600px at 45% 100%, ${alpha(
                  "#2BB673",
                  0.08
              )} 0%, rgba(255,255,255,0) 55%)`,
              `linear-gradient(180deg, ${alpha("#FFFFFF", 0.8)} 0%, ${alpha(
                  "#FFFFFF",
                  0.25
              )} 100%)`,
          ].join(",");

    const glassCard = {
        borderRadius: R.xl,
        overflow: "hidden",
        border: `1px solid ${borderSoft}`,
        background: isDark
            ? `linear-gradient(180deg, ${alpha("#FFFFFF", 0.07)} 0%, ${alpha(
                  "#FFFFFF",
                  0.025
              )} 100%)`
            : `linear-gradient(180deg, ${alpha("#FFFFFF", 0.92)} 0%, ${alpha(
                  "#FFFFFF",
                  0.78
              )} 100%)`,
        backdropFilter: "blur(12px)",
        boxShadow: isDark
            ? "0 18px 40px rgba(0,0,0,0.45)"
            : "0 18px 40px rgba(18,18,18,0.10)",
    };

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                color: "text.primary",
                position: "relative",
                overflow: "hidden",
                background: heroBg,
            }}
        >
            {/* subtle grid (softer + better mask) */}
            <Box
                aria-hidden
                sx={{
                    position: "absolute",
                    inset: 0,
                    opacity: isDark ? 0.18 : 0.22,
                    backgroundImage: `linear-gradient(${alpha(
                        isDark ? "#FFFFFF" : "#0F1115",
                        0.08
                    )} 1px, transparent 1px),
                            linear-gradient(90deg, ${alpha(
                                isDark ? "#FFFFFF" : "#0F1115",
                                0.08
                            )} 1px, transparent 1px)`,
                    backgroundSize: "48px 48px",
                    WebkitMaskImage:
                        "radial-gradient(closest-side, rgba(0,0,0,1), rgba(0,0,0,0))",
                    maskImage:
                        "radial-gradient(closest-side, rgba(0,0,0,1), rgba(0,0,0,0))",
                    pointerEvents: "none",
                }}
            />

            <Container maxWidth="lg" sx={{ position: "relative" }}>
                {/* Top bar */}
                <Box
                    sx={{
                        py: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.25,
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: R.md,
                                display: "grid",
                                placeItems: "center",
                                backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.16 : 0.1
                                ),
                                border: `1px solid ${alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.28 : 0.2
                                )}`,
                            }}
                        >
                            <LocalLibraryOutlinedIcon />
                        </Box>

                        <Typography
                            sx={{
                                fontWeight: 900,
                                letterSpacing: 0.4,
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
                            sx={{
                                borderRadius: R.xl,
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
                            Sign in
                        </Button>

                        <Button
                            component={Link}
                            href="/login"
                            variant="contained"
                            endIcon={<ArrowForwardRoundedIcon />}
                            sx={{
                                borderRadius: R.xl,
                                px: 2.2,
                                boxShadow: "none",
                                "&:hover": { boxShadow: "none" },
                            }}
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
                                borderRadius: R.xl,
                                fontWeight: 800,
                                letterSpacing: "-0.01em",
                                backgroundColor: alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.14 : 0.1
                                ),
                                border: `1px solid ${alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.22 : 0.18
                                )}`,
                                mb: 2,
                            }}
                        />

                        <Typography
                            sx={{
                                fontWeight: 900,
                                lineHeight: 1.05,
                                fontSize: { xs: 40, sm: 52, md: 60 },
                                letterSpacing: "-0.04em",
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
                                sx={{
                                    borderRadius: R.xl,
                                    px: 2.6,
                                    py: 1.25,
                                    boxShadow: "none",
                                    "&:hover": { boxShadow: "none" },
                                }}
                            >
                                Sign in to Libra
                            </Button>

                            <Button
                                component={Link}
                                href="/books"
                                variant="outlined"
                                size="large"
                                sx={{
                                    borderRadius: R.xl,
                                    px: 2.6,
                                    py: 1.25,
                                    borderColor: borderSoft,
                                    "&:hover": {
                                        borderColor: alpha(
                                            theme.palette.primary.main,
                                            0.45
                                        ),
                                    },
                                }}
                            >
                                Browse books
                            </Button>
                        </Stack>

                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 3 }}
                        >
                            Secure auth • Role-based access • Receipt-based
                            payments
                        </Typography>
                    </Box>

                    {/* Right hero card */}
                    <Paper variant="outlined" sx={glassCard}>
                        <Box
                            sx={{
                                p: 2.25,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 2,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontWeight: 900,
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                What you can do
                            </Typography>

                            <Chip
                                size="small"
                                label="Live in-app"
                                sx={{
                                    borderRadius: R.xl,
                                    fontWeight: 800,
                                    backgroundColor: alpha(
                                        "#2BB673",
                                        isDark ? 0.16 : 0.12
                                    ),
                                    border: `1px solid ${alpha(
                                        "#2BB673",
                                        isDark ? 0.26 : 0.22
                                    )}`,
                                }}
                            />
                        </Box>

                        <Divider sx={{ borderColor: borderSoft }} />

                        <Box sx={{ p: 2.25, display: "grid", gap: 1.25 }}>
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

                        <Divider sx={{ borderColor: borderSoft }} />

                        <Box sx={{ p: 2.25, display: "flex", gap: 1 }}>
                            <Button
                                component={Link}
                                href="/login"
                                variant="contained"
                                fullWidth
                                sx={{
                                    borderRadius: R.xl,
                                    boxShadow: "none",
                                    "&:hover": { boxShadow: "none" },
                                }}
                            >
                                Sign in
                            </Button>
                            <Button
                                component={Link}
                                href="/policies"
                                variant="outlined"
                                fullWidth
                                sx={{
                                    borderRadius: R.xl,
                                    borderColor: borderSoft,
                                    "&:hover": {
                                        borderColor: alpha(
                                            theme.palette.primary.main,
                                            0.45
                                        ),
                                    },
                                }}
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
                            sx={{
                                borderRadius: R.xl,
                                fontWeight: 800,
                                borderColor: borderSoft,
                            }}
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
                            borderTop: `1px solid ${borderSoft}`,
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
                                sx={{ borderRadius: R.xl }}
                            >
                                Announcements
                            </Button>
                            <Button
                                component={Link}
                                href="/policies"
                                size="small"
                                variant="text"
                                sx={{ borderRadius: R.xl }}
                            >
                                Policies
                            </Button>
                            <Button
                                component={Link}
                                href="/login"
                                size="small"
                                variant="outlined"
                                sx={{
                                    borderRadius: R.xl,
                                    borderColor: borderSoft,
                                }}
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

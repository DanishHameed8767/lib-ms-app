"use client";

import Link from "next/link";
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Button,
    Stack,
    CardActionArea,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

function AvailabilityBadge({ available }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const isOut = (available ?? 0) <= 0;

    const bg = isOut
        ? alpha(theme.palette.error.main, isDark ? 0.18 : 0.12)
        : alpha(theme.palette.success.main, isDark ? 0.18 : 0.12);

    const border = isOut
        ? alpha(theme.palette.error.main, 0.3)
        : alpha(theme.palette.success.main, 0.28);

    const fg = isOut ? theme.palette.error.main : theme.palette.success.main;

    return (
        <Chip
            size="small"
            label={isOut ? "Out of stock" : "Available"}
            sx={{
                height: 26,
                borderRadius: "999px",
                fontWeight: 800,
                letterSpacing: "-0.01em",
                bgcolor: bg,
                color: fg,
                border: `1px solid ${border}`,
                "& .MuiChip-label": { px: 1.1 },
            }}
        />
    );
}

export default function BookCard({ book }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const hoverBg = alpha(isDark ? "#FFFFFF" : "#0F1115", isDark ? 0.03 : 0.02);

    const coverUrl = book?.coverImageUrl || book?.cover_image_url || "";

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: R.xl,
                overflow: "hidden",
                borderColor: borderSoft,
                background: isDark
                    ? `linear-gradient(180deg, ${alpha(
                          "#FFFFFF",
                          0.04
                      )} 0%, ${alpha("#FFFFFF", 0.02)} 100%)`
                    : "#FFFFFF",
                boxShadow: "none",
                transition: "transform 140ms ease, background-color 140ms ease",
                "&:hover": {
                    backgroundColor: hoverBg,
                },
            }}
        >
            <CardActionArea
                component={Link}
                href={`/books/${book.id}`}
                sx={{
                    // prevent ripple from feeling too big on rounded corners
                    borderRadius: R.xl,
                }}
            >
                {/* Top gradient / cover band */}
                <Box
                    sx={{
                        height: 144,
                        position: "relative",
                        background: isDark
                            ? `linear-gradient(135deg,
                  ${alpha(theme.palette.primary.main, 0.55)} 0%,
                  ${alpha(theme.palette.primary.main, 0.18)} 55%,
                  ${alpha("#000000", 0)} 100%)`
                            : `linear-gradient(135deg,
                  ${alpha(theme.palette.primary.main, 0.45)} 0%,
                  ${alpha(theme.palette.primary.main, 0.1)} 55%,
                  ${alpha("#FFFFFF", 0)} 100%)`,
                    }}
                >
                    {/* Badge */}
                    <Box sx={{ position: "absolute", right: 14, top: 14 }}>
                        <AvailabilityBadge available={book.stockAvailable} />
                    </Box>

                    {/* Cover */}
                    <Box
                        sx={{
                            position: "absolute",
                            left: 14,
                            bottom: -30,
                            width: 86,
                            height: 116,
                            borderRadius: R.lg,
                            border: `1px solid ${alpha(
                                isDark ? "#FFFFFF" : "#0F1115",
                                0.14
                            )}`,
                            backgroundColor: isDark
                                ? alpha("#0F1115", 0.6)
                                : "#FFFFFF",
                            boxShadow: isDark
                                ? "0 14px 28px rgba(0,0,0,0.45)"
                                : "0 14px 28px rgba(18,18,18,0.14)",
                            overflow: "hidden",
                        }}
                    >
                        {coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={coverUrl}
                                alt={`${book.title} cover`}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                }}
                            />
                        ) : (
                            <Box
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    background: isDark
                                        ? `linear-gradient(180deg, ${alpha(
                                              "#FFFFFF",
                                              0.06
                                          )} 0%, ${alpha(
                                              "#FFFFFF",
                                              0.02
                                          )} 100%)`
                                        : `linear-gradient(180deg, ${alpha(
                                              "#0F1115",
                                              0.04
                                          )} 0%, ${alpha(
                                              "#0F1115",
                                              0.01
                                          )} 100%)`,
                                }}
                            />
                        )}
                    </Box>
                </Box>

                <CardContent sx={{ pt: 4.5, pb: 2.0 }}>
                    <Stack spacing={0.6}>
                        <Typography
                            sx={{ fontWeight: 900, letterSpacing: "-0.02em" }}
                            noWrap
                            title={book.title}
                        >
                            {book.title}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                            noWrap
                            title={`${book.author} • ${book.genre}`}
                        >
                            {book.author} • {book.genre}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                mt: 0.75,
                                flexWrap: "wrap",
                            }}
                        >
                            <Chip
                                size="small"
                                label={book.year}
                                sx={{
                                    borderRadius: "999px",
                                    fontWeight: 750,
                                    bgcolor: alpha(
                                        isDark ? "#FFFFFF" : "#0F1115",
                                        isDark ? 0.06 : 0.04
                                    ),
                                    border: `1px solid ${borderSoft}`,
                                }}
                            />
                            <Chip
                                size="small"
                                label={`ISBN ${book.isbn}`}
                                sx={{
                                    borderRadius: "999px",
                                    fontWeight: 750,
                                    bgcolor: alpha(
                                        isDark ? "#FFFFFF" : "#0F1115",
                                        isDark ? 0.06 : 0.04
                                    ),
                                    border: `1px solid ${borderSoft}`,
                                }}
                            />
                        </Box>
                    </Stack>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 2,
                            gap: 1.5,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                            noWrap
                        >
                            Available: <b>{book.stockAvailable}</b> /{" "}
                            {book.stockTotal}
                        </Typography>

                        <Button
                            size="small"
                            variant="outlined"
                            sx={{
                                borderRadius: "999px",
                                px: 1.6,
                                borderColor: alpha(
                                    theme.palette.primary.main,
                                    0.4
                                ),
                                color: "primary.main",
                                "&:hover": {
                                    borderColor: alpha(
                                        theme.palette.primary.main,
                                        0.65
                                    ),
                                    backgroundColor: alpha(
                                        theme.palette.primary.main,
                                        isDark ? 0.1 : 0.06
                                    ),
                                },
                            }}
                        >
                            View
                        </Button>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

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

function AvailabilityBadge({ available }) {
    return (
        <Chip
            size="small"
            label={available > 0 ? "Available" : "Out of stock"}
            sx={{
                fontWeight: 700,
                borderRadius: 2,
                backgroundColor:
                    available > 0
                        ? "rgba(46, 204, 113, 0.15)"
                        : "rgba(231, 76, 60, 0.15)",
                color: available > 0 ? "#2ecc71" : "#e74c3c",
            }}
        />
    );
}

export default function BookCard({ book }) {
    return (
        <Card sx={{ borderRadius: 4, overflow: "hidden" }}>
            <CardActionArea component={Link} href={`/books/${book.id}`}>
                <Box
                    sx={{
                        height: 140,
                        background:
                            "linear-gradient(135deg, rgba(255,106,61,0.55) 0%, rgba(255,106,61,0.15) 60%, rgba(0,0,0,0) 100%)",
                        position: "relative",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            right: 14,
                            top: 14,
                        }}
                    >
                        <AvailabilityBadge available={book.stockAvailable} />
                    </Box>

                    {/* Placeholder cover block */}
                    <Box
                        sx={{
                            position: "absolute",
                            left: 14,
                            bottom: -28,
                            width: 84,
                            height: 112,
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.25)",
                            backgroundColor: "background.paper",
                            boxShadow: (t) =>
                                t.palette.mode === "dark"
                                    ? "0 10px 25px rgba(0,0,0,0.5)"
                                    : "0 10px 25px rgba(0,0,0,0.12)",
                        }}
                    />
                </Box>

                <CardContent sx={{ pt: 4 }}>
                    <Stack spacing={0.5}>
                        <Typography sx={{ fontWeight: 900 }} noWrap>
                            {book.title}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                            noWrap
                        >
                            {book.author} • {book.genre}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                mt: 1,
                                flexWrap: "wrap",
                            }}
                        >
                            <Chip
                                size="small"
                                label={book.year}
                                sx={{ borderRadius: 2 }}
                            />
                            <Chip
                                size="small"
                                label={`ISBN ${book.isbn}`}
                                sx={{ borderRadius: 2 }}
                            />
                        </Box>
                    </Stack>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 2,
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                        >
                            Available: <b>{book.stockAvailable}</b> /{" "}
                            {book.stockTotal}
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                        >
                            View
                        </Button>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

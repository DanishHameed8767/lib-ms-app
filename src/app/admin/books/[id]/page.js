"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Box, Paper, Typography, Divider, Chip, Button } from "@mui/material";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import AppShell from "../../../../components/AppShell";
import PageHeader from "../../../../components/PageHeader";
import { mockBooks } from "../../../../lib/mock/books";

export default function BookDetailPage() {
    const params = useParams();
    const id = params?.id;

    const book = (mockBooks || []).find((b) => String(b.id) === String(id));

    if (!book) {
        return (
            <AppShell title="Book">
                <PageHeader title="Book" subtitle="Not found" />
                <Paper
                    variant="outlined"
                    sx={{ borderRadius: 4, p: 4, textAlign: "center" }}
                >
                    <Typography sx={{ fontWeight: 900 }}>
                        Book not found
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                    >
                        The requested book does not exist in mock data.
                    </Typography>
                    <Button
                        component={Link}
                        href="/books"
                        variant="contained"
                        sx={{ borderRadius: 3, mt: 2 }}
                    >
                        Back to Books
                    </Button>
                </Paper>
            </AppShell>
        );
    }

    const stockAvailable = Number(
        book.stockAvailable ?? book.stock_available ?? 0
    );
    const stockTotal = Number(book.stockTotal ?? book.stock_total ?? 0);
    const cover = book.coverImageUrl || book.cover_image_url || "";

    return (
        <AppShell title="Book Detail">
            <PageHeader
                title={book.title}
                subtitle={`${book.author || "Unknown author"} • ISBN ${
                    book.isbn || "—"
                }`}
                right={
                    <Button
                        component={Link}
                        href="/books"
                        variant="outlined"
                        startIcon={<ArrowBackOutlinedIcon />}
                        sx={{ borderRadius: 3 }}
                    >
                        Back
                    </Button>
                }
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "360px 1fr" },
                    gap: 2,
                }}
            >
                {/* Cover */}
                <Paper
                    variant="outlined"
                    sx={{ borderRadius: 4, overflow: "hidden" }}
                >
                    <Box
                        sx={{
                            height: 420,
                            backgroundColor: "action.hover",
                            display: "grid",
                            placeItems: "center",
                        }}
                    >
                        {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={cover}
                                alt="cover"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "text.secondary",
                                    fontWeight: 900,
                                }}
                            >
                                No cover
                            </Typography>
                        )}
                    </Box>

                    <Divider />

                    <Box sx={{ p: 2, display: "grid", gap: 1 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Availability
                        </Typography>
                        <Chip
                            label={
                                stockAvailable > 0
                                    ? `Available ${stockAvailable}/${stockTotal}`
                                    : "Out of stock"
                            }
                            sx={{
                                borderRadius: 3,
                                fontWeight: 900,
                                backgroundColor:
                                    stockAvailable > 0
                                        ? "rgba(46,204,113,0.15)"
                                        : "rgba(231,76,60,0.15)",
                                color:
                                    stockAvailable > 0 ? "#2ecc71" : "#e74c3c",
                                width: "fit-content",
                            }}
                        />
                    </Box>
                </Paper>

                {/* Details */}
                <Paper
                    variant="outlined"
                    sx={{ borderRadius: 4, overflow: "hidden" }}
                >
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Details
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            UI-only • later this will load from Supabase
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 1.5,
                            }}
                        >
                            {book.genre ? (
                                <Chip
                                    size="small"
                                    label={book.genre}
                                    sx={{ borderRadius: 2, fontWeight: 900 }}
                                />
                            ) : null}
                            {book.publicationYear || book.publication_year ? (
                                <Chip
                                    size="small"
                                    label={`Year ${
                                        book.publicationYear ||
                                        book.publication_year
                                    }`}
                                    sx={{ borderRadius: 2, fontWeight: 900 }}
                                />
                            ) : null}
                            {book.publisher ? (
                                <Chip
                                    size="small"
                                    label={book.publisher}
                                    sx={{ borderRadius: 2 }}
                                />
                            ) : null}
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ p: 2, display: "grid", gap: 1 }}>
                        <Row label="Title" value={book.title} />
                        <Row label="Author" value={book.author || "—"} />
                        <Row label="ISBN" value={book.isbn || "—"} />
                        <Row label="Edition" value={book.edition || "—"} />
                        <Row
                            label="Price"
                            value={`$${Number(book.price || 0).toFixed(2)}`}
                        />
                    </Box>

                    <Divider />

                    <Box
                        sx={{
                            p: 2,
                            display: "flex",
                            gap: 1,
                            justifyContent: "flex-end",
                            flexWrap: "wrap",
                        }}
                    >
                        <Button
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                            disabled
                        >
                            Reserve
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ borderRadius: 3 }}
                            disabled
                        >
                            Borrow
                        </Button>
                    </Box>

                    <Box sx={{ px: 2, pb: 2 }}>
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            Actions are disabled in UI-only mode. Borrow/Reserve
                            will be wired to your rules + triggers later.
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </AppShell>
    );
}

function Row({ label, value }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                sx={{ fontWeight: 900, textAlign: "right" }}
            >
                {value}
            </Typography>
        </Box>
    );
}

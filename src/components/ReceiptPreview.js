"use client";

import * as React from "react";
import { Box, Typography, Paper, Button, Stack } from "@mui/material";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

function extLower(s = "") {
    const p = String(s).split("?")[0];
    const idx = p.lastIndexOf(".");
    return idx >= 0 ? p.slice(idx + 1).toLowerCase() : "";
}

function isPdfLike(pathOrUrl = "") {
    return extLower(pathOrUrl) === "pdf";
}

function isImageLike(pathOrUrl = "") {
    const e = extLower(pathOrUrl);
    return ["png", "jpg", "jpeg", "webp"].includes(e);
}

function safeLabel(s) {
    return s ? String(s) : "—";
}

export default function ReceiptPreview({ receiptUrl = "", receiptPath = "" }) {
    const source = receiptUrl || "";
    const kindPdf = isPdfLike(source || receiptPath);
    const kindImg = isImageLike(source || receiptPath);

    const [imgError, setImgError] = React.useState(false);

    React.useEffect(() => {
        setImgError(false);
    }, [receiptUrl, receiptPath]);

    // If we have no signed URL, we cannot actually preview private receipts.
    const canPreview = Boolean(source);

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 4,
                p: 2,
                minHeight: 220,
                overflow: "hidden",
                background: (t) =>
                    t.palette.mode === "dark"
                        ? "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
                        : "linear-gradient(135deg, rgba(255,106,61,0.08), rgba(0,0,0,0))",
            }}
        >
            {/* IMAGE PREVIEW */}
            {canPreview && kindImg && !imgError ? (
                <Box
                    sx={{
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={source}
                        alt="Receipt"
                        style={{
                            width: "100%",
                            height: 320,
                            objectFit: "contain",
                            display: "block",
                        }}
                        onError={() => setImgError(true)}
                    />
                    <Box
                        sx={{
                            px: 1.5,
                            py: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 900 }}>
                            Image Receipt
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                                startIcon={<OpenInNewOutlinedIcon />}
                                component="a"
                                href={source}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
                                startIcon={<DownloadOutlinedIcon />}
                                component="a"
                                href={source}
                                download
                            >
                                Download
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            ) : (
                // PDF preview or fallback
                <Box
                    sx={{
                        height: 320,
                        display: "grid",
                        placeItems: "center",
                        textAlign: "center",
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                        px: 2,
                    }}
                >
                    {kindPdf ? (
                        <PictureAsPdfOutlinedIcon
                            sx={{ fontSize: 52, color: "text.secondary" }}
                        />
                    ) : (
                        <ImageOutlinedIcon
                            sx={{ fontSize: 52, color: "text.secondary" }}
                        />
                    )}

                    <Typography sx={{ mt: 1, fontWeight: 900 }}>
                        {kindPdf
                            ? "PDF Receipt"
                            : kindImg
                            ? "Image Receipt"
                            : "Receipt"}
                    </Typography>

                    {!canPreview ? (
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                mt: 0.5,
                                maxWidth: 420,
                            }}
                        >
                            Preview requires a signed URL. If you’re seeing this
                            as staff, check Storage RLS and that the page
                            generated a signed URL for the private receipt.
                        </Typography>
                    ) : imgError ? (
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                mt: 0.5,
                                maxWidth: 420,
                            }}
                        >
                            Couldn’t load the image preview (expired link or
                            unsupported file). Use Open/Download instead.
                        </Typography>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                color: "text.secondary",
                                mt: 0.5,
                                maxWidth: 420,
                            }}
                        >
                            {kindPdf
                                ? "PDF previews are opened in a new tab."
                                : "Preview not available for this file type."}
                        </Typography>
                    )}

                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                            startIcon={<OpenInNewOutlinedIcon />}
                            component="a"
                            href={canPreview ? source : undefined}
                            target="_blank"
                            rel="noreferrer"
                            disabled={!canPreview}
                        >
                            Open
                        </Button>
                        <Button
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                            startIcon={<DownloadOutlinedIcon />}
                            component="a"
                            href={canPreview ? source : undefined}
                            download
                            disabled={!canPreview}
                        >
                            Download
                        </Button>
                    </Stack>

                    <Typography
                        variant="caption"
                        sx={{
                            display: "block",
                            mt: 1.5,
                            color: "text.secondary",
                            wordBreak: "break-all",
                            maxWidth: 420,
                        }}
                    >
                        {safeLabel(receiptPath)}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}

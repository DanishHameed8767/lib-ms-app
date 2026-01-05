"use client";

import * as React from "react";
import {
    Drawer,
    Box,
    Typography,
    Divider,
    IconButton,
    TextField,
    Button,
    Stack,
    Paper,
    Chip,
} from "@mui/material";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

/** ✅ explicit px radii to avoid “weirdly round” */
const R = {
    drawer: 16, // <- was 24
    card: 14, // <- was 4 (theme units) in multiple places
    soft: 12, // <- for small surfaces
    btn: 12, // <- was 3
    chip: 999, // pill
};

export default function BookEditDrawer({
    open,
    onClose,
    value,
    onChange,
    onSave,
    onDelete,
    showDelete = false,
    saving = false,
}) {
    const [errors, setErrors] = React.useState({});
    const [localCoverUrl, setLocalCoverUrl] = React.useState("");
    const [localCoverName, setLocalCoverName] = React.useState("");
    const [authorInput, setAuthorInput] = React.useState("");

    React.useEffect(() => {
        setErrors({});
        setAuthorInput("");

        setLocalCoverName("");
        setLocalCoverUrl((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return "";
        });
    }, [open, value?.id]);

    React.useEffect(() => {
        return () => {
            if (localCoverUrl?.startsWith("blob:"))
                URL.revokeObjectURL(localCoverUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const validate = () => {
        const next = {};
        const title = String(value?.title || "").trim();
        const isbn = String(value?.isbn || "").trim();

        if (!title) next.title = "Title is required";
        if (!isbn) next.isbn = "ISBN is required";
        if (isbn && !/^\d{10}$|^\d{13}$/.test(isbn))
            next.isbn = "ISBN must be 10 or 13 digits";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        await onSave?.();
    };

    const coverSrc = localCoverUrl || value?.coverImageUrl || "";
    const authors = Array.isArray(value?.authors) ? value.authors : [];

    const addAuthor = (nameRaw) => {
        const name = String(nameRaw || "").trim();
        if (!name) return;

        const exists = authors.some(
            (a) => String(a).toLowerCase() === name.toLowerCase()
        );
        if (exists) return;

        onChange?.({ ...value, authors: [...authors, name] });
        setAuthorInput("");
    };

    const removeAuthor = (name) => {
        onChange?.({
            ...value,
            authors: authors.filter((a) => a !== name),
        });
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: "100%", sm: 560 },
                    maxWidth: "100vw",
                    minWidth: 0,
                    overflowX: "hidden",

                    // ✅ less round, consistent
                    borderTopLeftRadius: { xs: 0, sm: `${R.drawer}px` },
                    borderBottomLeftRadius: { xs: 0, sm: `${R.drawer}px` },
                },
            }}
        >
            <Box
                sx={{
                    p: 2.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    minWidth: 0,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 900 }} noWrap>
                    {value?.id ? "Edit Book" : "Create Book"}
                </Typography>
                <IconButton
                    onClick={onClose}
                    aria-label="close"
                    disabled={saving}
                >
                    <CloseOutlinedIcon />
                </IconButton>
            </Box>

            <Divider />

            <Box sx={{ p: 2.25, display: "grid", gap: 2, minWidth: 0 }}>
                {/* Cover */}
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: `${R.card}px`,
                        p: 2,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" },
                        gap: 2,
                        alignItems: "center",
                        minWidth: 0,
                    }}
                >
                    <Box
                        sx={{
                            width: { xs: "100%", sm: 140 },
                            height: { xs: 220, sm: 180 },
                            borderRadius: `${R.soft}px`,
                            overflow: "hidden",
                            backgroundColor: "action.hover",
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid",
                            borderColor: "divider",
                            minWidth: 0,
                        }}
                    >
                        {coverSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={coverSrc}
                                alt="cover"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <ImageOutlinedIcon style={{ opacity: 0.6 }} />
                        )}
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 900 }}>
                            Cover image
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ color: "text.secondary", mt: 0.25 }}
                        >
                            Uploads to Supabase Storage (<b>book-covers</b>) on
                            Save and stores the public URL.
                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.secondary",
                                display: "block",
                                mt: 1,
                                wordBreak: "break-word",
                            }}
                        >
                            {localCoverName ||
                                value?.coverImageUrl ||
                                "No cover selected"}
                        </Typography>

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                mt: 1.25,
                                flexWrap: "wrap",
                            }}
                        >
                            <Button
                                component="label"
                                variant="contained"
                                startIcon={<CloudUploadOutlinedIcon />}
                                sx={{ borderRadius: `${R.btn}px` }}
                                disabled={saving}
                            >
                                Upload cover
                                <input
                                    hidden
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        setLocalCoverUrl((prev) => {
                                            if (prev?.startsWith("blob:"))
                                                URL.revokeObjectURL(prev);
                                            return "";
                                        });

                                        const url = URL.createObjectURL(file);
                                        setLocalCoverName(file.name);
                                        setLocalCoverUrl(url);

                                        onChange?.({
                                            ...value,
                                            coverFile: file,
                                        });
                                    }}
                                />
                            </Button>

                            <Button
                                variant="outlined"
                                sx={{ borderRadius: `${R.btn}px` }}
                                disabled={saving}
                                onClick={() => {
                                    if (localCoverUrl?.startsWith("blob:"))
                                        URL.revokeObjectURL(localCoverUrl);
                                    setLocalCoverName("");
                                    setLocalCoverUrl("");
                                    onChange?.({
                                        ...value,
                                        coverFile: null,
                                        coverImageUrl: "",
                                    });
                                }}
                            >
                                Clear
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Fields */}
                <Stack spacing={1.5} sx={{ minWidth: 0 }}>
                    <TextField
                        label="Title"
                        value={value?.title ?? ""}
                        onChange={(e) =>
                            onChange?.({ ...value, title: e.target.value })
                        }
                        error={Boolean(errors.title)}
                        helperText={errors.title || " "}
                        required
                        fullWidth
                        disabled={saving}
                    />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.5,
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            label="Edition"
                            value={value?.edition ?? ""}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    edition: e.target.value,
                                })
                            }
                            disabled={saving}
                            fullWidth
                        />
                        <TextField
                            label="Publisher"
                            value={value?.publisher ?? ""}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    publisher: e.target.value,
                                })
                            }
                            disabled={saving}
                            fullWidth
                        />
                    </Box>

                    {/* Authors */}
                    <Box sx={{ minWidth: 0 }}>
                        <TextField
                            label="Authors"
                            value={authorInput}
                            onChange={(e) => setAuthorInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addAuthor(authorInput);
                                }
                            }}
                            helperText="Type an author name and press Enter. Multiple authors supported."
                            fullWidth
                            disabled={saving}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: 1,
                            }}
                        >
                            {authors.length === 0 ? (
                                <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary" }}
                                >
                                    No authors added yet.
                                </Typography>
                            ) : null}

                            {authors.map((a) => (
                                <Chip
                                    key={a}
                                    label={a}
                                    onDelete={
                                        saving
                                            ? undefined
                                            : () => removeAuthor(a)
                                    }
                                    sx={{
                                        fontWeight: 800,
                                        borderRadius: `${R.chip}px`,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    <TextField
                        label="Genre"
                        value={value?.genre ?? ""}
                        onChange={(e) =>
                            onChange?.({ ...value, genre: e.target.value })
                        }
                        fullWidth
                        disabled={saving}
                    />

                    <TextField
                        label="ISBN"
                        value={value?.isbn ?? ""}
                        onChange={(e) =>
                            onChange?.({
                                ...value,
                                isbn: e.target.value.replace(/\s+/g, ""),
                            })
                        }
                        error={Boolean(errors.isbn)}
                        helperText={errors.isbn || " "}
                        required
                        fullWidth
                        disabled={saving}
                    />

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.5,
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            label="Price"
                            type="number"
                            value={value?.price ?? 0}
                            onChange={(e) =>
                                onChange?.({ ...value, price: e.target.value })
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                            disabled={saving}
                            fullWidth
                        />
                        <TextField
                            label="Publication year"
                            type="number"
                            value={value?.publicationYear ?? ""}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    publicationYear: e.target.value,
                                })
                            }
                            inputProps={{ min: 0, step: "1" }}
                            disabled={saving}
                            fullWidth
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.5,
                            minWidth: 0,
                        }}
                    >
                        <TextField
                            label="Stock total"
                            type="number"
                            value={value?.stockTotal ?? 0}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    stockTotal: e.target.value,
                                })
                            }
                            inputProps={{ min: 0, step: "1" }}
                            disabled={saving}
                            fullWidth
                        />
                        <TextField
                            label="Stock available"
                            type="number"
                            value={value?.stockAvailable ?? 0}
                            onChange={(e) =>
                                onChange?.({
                                    ...value,
                                    stockAvailable: e.target.value,
                                })
                            }
                            inputProps={{ min: 0, step: "1" }}
                            disabled={saving}
                            fullWidth
                        />
                    </Box>
                </Stack>

                <Box
                    sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                    }}
                >
                    {showDelete ? (
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ borderRadius: `${R.btn}px` }}
                            onClick={onDelete}
                            disabled={saving}
                        >
                            Delete
                        </Button>
                    ) : null}

                    <Button
                        variant="outlined"
                        sx={{ borderRadius: `${R.btn}px` }}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        sx={{ borderRadius: `${R.btn}px` }}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? "Saving…" : "Save"}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}

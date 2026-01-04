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

        // prevent duplicates case-insensitively
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
                    borderTopLeftRadius: { xs: 0, sm: 24 },
                    borderBottomLeftRadius: { xs: 0, sm: 24 },
                },
            }}
        >
            <Box
                sx={{
                    p: 2.25,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
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

            <Box sx={{ p: 2.25, display: "grid", gap: 2 }}>
                {/* Cover */}
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: 4,
                        p: 2,
                        display: "grid",
                        gridTemplateColumns: "140px 1fr",
                        gap: 2,
                        alignItems: "center",
                    }}
                >
                    <Box
                        sx={{
                            width: 140,
                            height: 180,
                            borderRadius: 3,
                            overflow: "hidden",
                            backgroundColor: "action.hover",
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid",
                            borderColor: "divider",
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

                    <Box>
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
                                sx={{ borderRadius: 3 }}
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
                                            return prev;
                                        });

                                        const url = URL.createObjectURL(file);
                                        setLocalCoverName(file.name);
                                        setLocalCoverUrl(url);

                                        onChange?.({
                                            ...value,
                                            coverFile: file, // parent uploads
                                        });
                                    }}
                                />
                            </Button>

                            <Button
                                variant="outlined"
                                sx={{ borderRadius: 3 }}
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
                <Stack spacing={1.5}>
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
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1.5,
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
                        />
                    </Box>

                    {/* Authors (real table: authors + book_authors) */}
                    <Box>
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
                                    sx={{ fontWeight: 800 }}
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
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1.5,
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
                        />
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 1.5,
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
                        />
                    </Box>
                </Stack>

                <Box
                    sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
                >
                    {showDelete ? (
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ borderRadius: 3 }}
                            onClick={onDelete}
                            disabled={saving}
                        >
                            Delete
                        </Button>
                    ) : null}

                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 3 }}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        sx={{ borderRadius: 3 }}
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

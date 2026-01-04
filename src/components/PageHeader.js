"use client";

import { Box, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle, right }) {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                alignItems: { xs: "flex-start", md: "center" },
                justifyContent: "space-between",
                flexDirection: { xs: "column", md: "row" },
                mb: 2,
            }}
        >
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    {title}
                </Typography>
                {subtitle ? (
                    <Typography sx={{ color: "text.secondary", mt: 0.25 }}>
                        {subtitle}
                    </Typography>
                ) : null}
            </Box>
            {right ? (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {right}
                </Box>
            ) : null}
        </Box>
    );
}

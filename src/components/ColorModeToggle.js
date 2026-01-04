"use client";

import * as React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { ColorModeContext } from "../app/providers";

export default function ColorModeToggle() {
    const { mode, toggleColorMode } = React.useContext(ColorModeContext);

    return (
        <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
            <IconButton onClick={toggleColorMode} aria-label="toggle theme">
                {mode === "dark" ? (
                    <LightModeOutlinedIcon />
                ) : (
                    <DarkModeOutlinedIcon />
                )}
            </IconButton>
        </Tooltip>
    );
}

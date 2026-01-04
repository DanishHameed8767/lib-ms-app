"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { createTheme } from "@mui/material/styles";
import getDesignTokens from "../theme/getDesignTokens";

export const ColorModeContext = React.createContext({
    mode: "light",
    toggleColorMode: () => {},
    setMode: () => {},
});

function getInitialMode() {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("mui-mode");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export default function Providers({ children }) {
    const [mode, setMode] = React.useState("light");
    const [hydrated, setHydrated] = React.useState(false);

    React.useEffect(() => {
        setMode(getInitialMode());
        setHydrated(true);
    }, []);

    React.useEffect(() => {
        if (!hydrated) return;
        window.localStorage.setItem("mui-mode", mode);
    }, [mode, hydrated]);

    const colorMode = React.useMemo(
        () => ({
            mode,
            toggleColorMode: () =>
                setMode((prev) => (prev === "light" ? "dark" : "light")),
            setMode,
        }),
        [mode]
    );

    const theme = React.useMemo(
        () => createTheme(getDesignTokens(mode)),
        [mode]
    );

    // Avoid a flash of wrong theme before hydration:
    if (!hydrated) return null;

    return (
        <AppRouterCacheProvider>
            <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {children}
                </ThemeProvider>
            </ColorModeContext.Provider>
        </AppRouterCacheProvider>
    );
}

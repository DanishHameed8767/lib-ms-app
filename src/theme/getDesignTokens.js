const ORANGE = {
    main: "#FF6A3D",
    dark: "#E85A2F",
    light: "#FF8A66",
    contrastText: "#FFFFFF",
};

const NAVY = {
    main: "#1F2A44", // deep slate/navy used in charts/labels
    dark: "#172033",
    light: "#2B3A5F",
    contrastText: "#FFFFFF",
};

const NEUTRAL = {
    50: "#FAF7F3",
    100: "#F4EFE9",
    200: "#E9E1D9",
    300: "#D7CDC3",
    400: "#B7ABA0",
    500: "#8B8178",
    600: "#6E655E",
    700: "#4D4742",
    800: "#2B2A2B",
    900: "#15151A",
};

export default function getDesignTokens(mode) {
    const isDark = mode === "dark";

    // Warm dashboard base like your references
    const bgDefault = isDark ? "#0F1115" : "#F6F2ED";
    const paper = isDark ? "#141824" : "#FFFFFF";

    // Soft borders/dividers
    const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,17,21,0.08)";
    const cardBorder = divider;

    // Action/focus
    const focusRing = isDark
        ? "rgba(255,106,61,0.35)"
        : "rgba(255,106,61,0.30)";
    const hoverBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(15,17,21,0.035)";
    const selectedBg = isDark
        ? "rgba(255,106,61,0.14)"
        : "rgba(255,106,61,0.12)";

    return {
        palette: {
            mode,
            primary: ORANGE,
            secondary: NAVY,

            // Semantic colors for your pills/badges
            success: {
                main: "#2BB673",
                dark: "#21935C",
                light: "#61D39E",
                contrastText: "#07130D",
            },
            warning: {
                main: "#F5A524",
                dark: "#D48B16",
                light: "#FFD08A",
                contrastText: "#1A1205",
            },
            error: {
                main: "#F04438",
                dark: "#C8342A",
                light: "#FF7C73",
                contrastText: "#FFFFFF",
            },
            info: {
                main: "#3B82F6",
                dark: "#2563EB",
                light: "#93C5FD",
                contrastText: "#07121F",
            },

            background: { default: bgDefault, paper },

            text: {
                primary: isDark ? "#EDEFF3" : "#1E1E22",
                secondary: isDark ? "#A6ADBB" : "#5D6472",
                disabled: isDark
                    ? "rgba(237,239,243,0.38)"
                    : "rgba(30,30,34,0.38)",
            },

            divider,

            // Useful for sidebars/cards/chips
            grey: NEUTRAL,

            action: {
                hover: hoverBg,
                selected: selectedBg,
                disabled: isDark
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(15,17,21,0.22)",
                disabledBackground: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(15,17,21,0.06)",
                focus: focusRing,
            },
        },

        shape: { borderRadius: 14 },

        typography: {
            fontFamily:
                'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
            h4: { fontWeight: 750, letterSpacing: "-0.02em" },
            h6: { fontWeight: 750, letterSpacing: "-0.01em" },
            subtitle1: { fontWeight: 650 },
            button: { textTransform: "none", fontWeight: 650 },
        },

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: bgDefault,
                    },
                    "*::selection": {
                        background: isDark
                            ? "rgba(255,106,61,0.35)"
                            : "rgba(255,106,61,0.25)",
                    },
                    ":focus-visible": {
                        outline: "none",
                    },
                },
            },

            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        border: `1px solid ${divider}`,
                        boxShadow: isDark
                            ? "0 10px 24px rgba(0,0,0,0.38)"
                            : "0 10px 24px rgba(18,18,18,0.06)",
                    },
                },
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        border: `1px solid ${cardBorder}`,
                    },
                },
            },

            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        backgroundColor: isDark ? "#0F131C" : "#FFFFFF",
                        borderBottom: `1px solid ${divider}`,
                        boxShadow: "none",
                    },
                },
            },

            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundImage: "none",
                        backgroundColor: isDark ? "#0F131C" : "#FFFFFF",
                        borderRight: `1px solid ${divider}`,
                    },
                },
            },

            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        marginLeft: 10,
                        marginRight: 10,
                        "&.Mui-selected": {
                            backgroundColor: selectedBg,
                            color: ORANGE.main,
                            "&:hover": { backgroundColor: selectedBg },
                        },
                    },
                },
            },

            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        paddingLeft: 16,
                        paddingRight: 16,
                    },
                    containedPrimary: {
                        boxShadow: "none",
                        "&:hover": {
                            boxShadow: "none",
                            backgroundColor: ORANGE.dark,
                        },
                    },
                },
            },

            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                },
            },

            MuiTextField: {
                defaultProps: { size: "small" },
            },

            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: divider,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: isDark
                                ? "rgba(255,255,255,0.18)"
                                : "rgba(15,17,21,0.16)",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: ORANGE.main,
                            boxShadow: `0 0 0 4px ${focusRing}`,
                        },
                    },
                },
            },

            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        fontWeight: 650,
                    },
                    filled: {
                        backgroundColor: isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(15,17,21,0.04)",
                    },
                },
            },

            MuiTableContainer: {
                styleOverrides: {
                    root: {
                        border: `1px solid ${divider}`,
                        borderRadius: 14,
                    },
                },
            },

            MuiTableHead: {
                styleOverrides: {
                    root: {
                        backgroundColor: isDark
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(15,17,21,0.03)",
                    },
                },
            },

            MuiTableRow: {
                styleOverrides: {
                    root: {
                        "&:hover": {
                            backgroundColor: hoverBg,
                        },
                    },
                },
            },

            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        borderRadius: 10,
                        backgroundColor: isDark ? "#0B0E14" : "#111318",
                        border: `1px solid ${
                            isDark
                                ? "rgba(255,255,255,0.10)"
                                : "rgba(255,255,255,0.10)"
                        }`,
                    },
                },
            },
        },
    };
}

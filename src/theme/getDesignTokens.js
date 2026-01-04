const ORANGE = {
    main: "#FF6A3D",
    dark: "#E85A2F",
    light: "#FF8A66",
};

export default function getDesignTokens(mode) {
    const isDark = mode === "dark";

    return {
        palette: {
            mode,
            primary: ORANGE,
            background: {
                default: isDark ? "#0F1115" : "#F6F2ED",
                paper: isDark ? "#151821" : "#FFFFFF",
            },
            text: {
                primary: isDark ? "#EDEFF3" : "#1E1E22",
                secondary: isDark ? "#A6ADBB" : "#5D6472",
            },
            divider: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,17,21,0.08)",
        },
        shape: { borderRadius: 14 },
        typography: {
            fontFamily:
                'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
            h4: { fontWeight: 700 },
            h6: { fontWeight: 700 },
            button: { textTransform: "none", fontWeight: 600 },
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        boxShadow: isDark
                            ? "0 10px 30px rgba(0,0,0,0.35)"
                            : "0 10px 30px rgba(18, 18, 18, 0.08)",
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        border: `1px solid ${
                            isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(15,17,21,0.08)"
                        }`,
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
                },
            },
            MuiTextField: {
                defaultProps: { size: "small" },
            },
        },
    };
}

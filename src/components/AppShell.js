"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    InputBase,
    Paper,
    Avatar,
    Chip,
    Menu,
    MenuItem,
    useMediaQuery,
    Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import ColorModeToggle from "./ColorModeToggle";
import { useAuth } from "../context/AuthContext";
import { navItems } from "../lib/navItems";
import { isRoleAllowed } from "../lib/roles";

const drawerWidth = 272;

const R = {
    xs: "10px",
    sm: "12px",
    md: "16px",
    lg: "20px",
    xl: "24px",
};

function initialsFromName(name) {
    const s = String(name || "").trim();
    if (!s) return "U";
    const parts = s.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
    return letters.join("") || "U";
}

function roleLabel(role) {
    if (!role) return "User";
    // Keep your DB labels, but shorten for UI
    if (role === "Administrator") return "Admin";
    return role;
}

export default function AppShell({ title = "Dashboard", children }) {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";
    const router = useRouter();
    const pathname = usePathname();
    const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const openMenu = Boolean(anchorEl);

    const { user, profile, role, signOut } = useAuth();

    const [loggingOut, setLoggingOut] = React.useState(false);

    const visibleNav = React.useMemo(
        () => navItems.filter((item) => isRoleAllowed(role, item.roles)),
        [role]
    );

    const displayName =
        profile?.full_name || profile?.username || user?.email || "Account";

    const avatarText = initialsFromName(
        profile?.full_name || profile?.username
    );

    const borderSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.1 : 0.1
    );
    const paperSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.04 : 0.03
    );
    const hoverSoft = alpha(
        isDark ? "#FFFFFF" : "#0F1115",
        isDark ? 0.06 : 0.04
    );

    async function handleLogout() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            setAnchorEl(null);
            setMobileOpen(false);
            await signOut();
            router.replace("/login");
            router.refresh();
        } finally {
            setLoggingOut(false);
        }
    }

    // close drawer on route change (mobile)
    React.useEffect(() => {
        if (isMdDown) setMobileOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Brand / top */}
            <Box
                sx={{
                    px: 2.25,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: R.lg,
                            display: "grid",
                            placeItems: "center",
                            border: `1px solid ${alpha(
                                theme.palette.primary.main,
                                0.25
                            )}`,
                            background: alpha(
                                theme.palette.primary.main,
                                isDark ? 0.14 : 0.1
                            ),
                            color: "primary.main",
                            fontWeight: 900,
                        }}
                    >
                        L
                    </Box>

                    <Box>
                        <Typography
                            sx={{
                                fontWeight: 950,
                                letterSpacing: "-0.02em",
                                lineHeight: 1,
                            }}
                        >
                            <Box
                                component="span"
                                sx={{ color: "primary.main" }}
                            >
                                LIBRA
                            </Box>
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            Library management
                        </Typography>
                    </Box>
                </Box>

                {isMdDown ? (
                    <IconButton
                        onClick={() => setMobileOpen(false)}
                        aria-label="close drawer"
                        size="small"
                        sx={{ borderRadius: R.md }}
                    >
                        <CloseRoundedIcon />
                    </IconButton>
                ) : null}
            </Box>

            <Divider sx={{ borderColor: borderSoft }} />

            {/* Nav */}
            <Box sx={{ px: 1.25, py: 1.25 }}>
                <List sx={{ display: "grid", gap: 0.6, p: 0 }}>
                    {visibleNav.map((item) => {
                        const active =
                            pathname === item.href ||
                            pathname?.startsWith(item.href + "/");

                        return (
                            <ListItemButton
                                key={item.label}
                                component={Link}
                                href={item.href}
                                sx={{
                                    borderRadius: "999px",
                                    px: 1.4,
                                    py: 1.0,
                                    position: "relative",
                                    overflow: "hidden",
                                    backgroundColor: active
                                        ? alpha(
                                              theme.palette.primary.main,
                                              isDark ? 0.12 : 0.09
                                          )
                                        : "transparent",
                                    border: active
                                        ? `1px solid ${alpha(
                                              theme.palette.primary.main,
                                              0.22
                                          )}`
                                        : `1px solid transparent`,
                                    "&:hover": {
                                        backgroundColor: active
                                            ? alpha(
                                                  theme.palette.primary.main,
                                                  isDark ? 0.15 : 0.11
                                              )
                                            : hoverSoft,
                                    },
                                    "&::before": active
                                        ? {
                                              content: '""',
                                              position: "absolute",
                                              left: 10,
                                              top: "50%",
                                              transform: "translateY(-50%)",
                                              width: 6,
                                              height: 6,
                                              borderRadius: "999px",
                                              background:
                                                  theme.palette.primary.main,
                                              boxShadow: `0 0 0 6px ${alpha(
                                                  theme.palette.primary.main,
                                                  0.1
                                              )}`,
                                          }
                                        : {},
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: active
                                            ? "primary.main"
                                            : "text.secondary",
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>

                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        sx: {
                                            fontWeight: active ? 900 : 650,
                                            letterSpacing: "-0.01em",
                                        },
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Sidebar footer card */}
            <Box sx={{ p: 2 }}>
                <Paper
                    variant="outlined"
                    sx={{
                        borderRadius: R.xl,
                        borderColor: borderSoft,
                        background: isDark
                            ? `linear-gradient(180deg, ${alpha(
                                  "#FFFFFF",
                                  0.05
                              )} 0%, ${alpha("#FFFFFF", 0.02)} 100%)`
                            : alpha(theme.palette.primary.main, 0.06),
                        p: 1.6,
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                        On-the-Go Management
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 0.5,
                            color: "text.secondary",
                            lineHeight: 1.5,
                        }}
                    >
                        Manage books, members, and payments anywhere.
                    </Typography>

                    <Box
                        sx={{
                            mt: 1.25,
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                        }}
                    >
                        <Chip
                            size="small"
                            label="Fast"
                            sx={{
                                height: 26,
                                borderRadius: "999px",
                                fontWeight: 800,
                                bgcolor: alpha(
                                    theme.palette.primary.main,
                                    isDark ? 0.14 : 0.1
                                ),
                                color: "primary.main",
                                border: `1px solid ${alpha(
                                    theme.palette.primary.main,
                                    0.22
                                )}`,
                            }}
                        />
                        <Chip
                            size="small"
                            label="Role-based"
                            sx={{
                                height: 26,
                                borderRadius: "999px",
                                fontWeight: 800,
                                bgcolor: alpha(
                                    isDark ? "#FFFFFF" : "#0F1115",
                                    isDark ? 0.06 : 0.04
                                ),
                                border: `1px solid ${borderSoft}`,
                            }}
                        />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100dvh" }}>
            {/* AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor: alpha(
                        isDark ? "#0F1115" : "#F6F2ED",
                        isDark ? 0.35 : 0.55
                    ),
                    color: "text.primary",
                    borderBottom: `1px solid ${borderSoft}`,
                    backdropFilter: "blur(12px)",
                }}
            >
                <Toolbar sx={{ gap: 1.5, minHeight: 72 }}>
                    {isMdDown && (
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            edge="start"
                            aria-label="open drawer"
                            sx={{ borderRadius: R.md }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Box sx={{ minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: 950,
                                letterSpacing: "-0.02em",
                                display: { xs: "none", sm: "block" },
                                lineHeight: 1.05,
                            }}
                            noWrap
                            title={title}
                        >
                            {title}
                        </Typography>

                        {/* Optional small breadcrumb-ish hint */}
                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.secondary",
                                display: { xs: "none", sm: "block" },
                            }}
                        >
                            {roleLabel(role)}
                        </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }} />

                    {/* Search */}
                    <Paper
                        component="form"
                        variant="outlined"
                        onSubmit={(e) => e.preventDefault()}
                        sx={{
                            display: { xs: "none", sm: "flex" },
                            alignItems: "center",
                            gap: 1,
                            px: 1.25,
                            py: 0.9,
                            borderRadius: "999px",
                            width: { sm: 320, md: 440 },
                            borderColor: borderSoft,
                            backgroundColor: paperSoft,
                        }}
                    >
                        <SearchIcon fontSize="small" style={{ opacity: 0.8 }} />
                        <InputBase
                            placeholder="Search anything…"
                            sx={{
                                flex: 1,
                                fontSize: 14,
                                "& input::placeholder": { opacity: 0.7 },
                            }}
                        />
                    </Paper>

                    <Tooltip title="Toggle theme">
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <ColorModeToggle />
                        </Box>
                    </Tooltip>

                    {/* Account pill */}
                    <Chip
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        avatar={
                            <Avatar
                                sx={{
                                    width: 28,
                                    height: 28,
                                    bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.25
                                    ),
                                    color: "text.primary",
                                    fontWeight: 900,
                                }}
                            >
                                {avatarText}
                            </Avatar>
                        }
                        label={
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                <Typography sx={{ fontWeight: 850 }} noWrap>
                                    {displayName}
                                </Typography>
                                <Box
                                    component="span"
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 999,
                                        background: theme.palette.primary.main,
                                        opacity: 0.9,
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    style={{ opacity: 0.8 }}
                                >
                                    {roleLabel(role)}
                                </Typography>
                            </Box>
                        }
                        variant="outlined"
                        sx={{
                            borderRadius: "999px",
                            cursor: "pointer",
                            borderColor: borderSoft,
                            backgroundColor: paperSoft,
                            "& .MuiChip-label": { maxWidth: 240 },
                        }}
                    />

                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                            sx: {
                                borderRadius: R.xl,
                                border: `1px solid ${borderSoft}`,
                                background: isDark
                                    ? `linear-gradient(180deg, ${alpha(
                                          "#FFFFFF",
                                          0.06
                                      )} 0%, ${alpha("#FFFFFF", 0.03)} 100%)`
                                    : "#FFFFFF",
                                boxShadow: isDark
                                    ? "0 18px 40px rgba(0,0,0,0.45)"
                                    : "0 18px 40px rgba(18,18,18,0.12)",
                                mt: 1,
                                minWidth: 220,
                            },
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                router.push("/profile"); // change if needed
                            }}
                        >
                            My Profile
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout} disabled={loggingOut}>
                            {loggingOut ? "Logging out…" : "Logout"}
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {isMdDown ? (
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            "& .MuiDrawer-paper": {
                                width: drawerWidth,
                                boxSizing: "border-box",
                                borderRight: `1px solid ${borderSoft}`,
                                background: isDark
                                    ? `linear-gradient(180deg, ${alpha(
                                          "#0F1115",
                                          0.9
                                      )} 0%, ${alpha("#0F1115", 0.75)} 100%)`
                                    : theme.palette.background.paper,
                            },
                        }}
                    >
                        {drawer}
                    </Drawer>
                ) : (
                    <Drawer
                        variant="permanent"
                        open
                        sx={{
                            "& .MuiDrawer-paper": {
                                width: drawerWidth,
                                boxSizing: "border-box",
                                borderRight: `1px solid ${borderSoft}`,
                                backgroundColor: theme.palette.background.paper,
                            },
                        }}
                    >
                        {drawer}
                    </Drawer>
                )}
            </Box>

            {/* Main */}
            <Box
                component="main"
                sx={{ flex: 1, pt: 10, px: { xs: 2, md: 3 }, pb: 3 }}
            >
                {children}
            </Box>
        </Box>
    );
}

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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

import ColorModeToggle from "./ColorModeToggle";
import { useAuth } from "../context/AuthContext";
import { navItems } from "../lib/navItems";
import { isRoleAllowed } from "../lib/roles";

const drawerWidth = 264;

function initialsFromName(name) {
    const s = String(name || "").trim();
    if (!s) return "U";
    const parts = s.split(/\s+/).filter(Boolean);
    const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
    return letters.join("") || "U";
}

export default function AppShell({ title = "Dashboard", children }) {
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const openMenu = Boolean(anchorEl);

    const { supabase, user, profile, role } = useAuth();

    const [loggingOut, setLoggingOut] = React.useState(false);
    const { signOut } = useAuth();

    const visibleNav = React.useMemo(
        () => navItems.filter((item) => isRoleAllowed(role, item.roles)),
        [role]
    );

    const displayName =
        profile?.full_name || profile?.username || user?.email || "Account";

    const avatarText = initialsFromName(
        profile?.full_name || profile?.username
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

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2.25, py: 2 }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, letterSpacing: 0.2 }}
                >
                    <Box component="span" sx={{ color: "primary.main" }}>
                        LIBRA
                    </Box>
                </Typography>
            </Box>

            <Divider />

            <Box sx={{ px: 1.25, py: 1 }}>
                <List sx={{ gap: 0.5, display: "grid" }}>
                    {visibleNav.map((item) => {
                        const active =
                            pathname === item.href ||
                            pathname?.startsWith(item.href + "/");
                        return (
                            <ListItemButton
                                key={item.label}
                                component={Link}
                                href={item.href}
                                onClick={() => isMdDown && setMobileOpen(false)}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: active
                                        ? "action.selected"
                                        : "transparent",
                                    "&:hover": {
                                        backgroundColor: "action.hover",
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 40,
                                        color: active
                                            ? "primary.main"
                                            : "inherit",
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        sx: { fontWeight: active ? 800 : 600 },
                                    }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ flex: 1 }} />

            <Box sx={{ p: 2 }}>
                <Paper
                    variant="outlined"
                    sx={{
                        p: 1.5,
                        borderRadius: 3,
                        background:
                            theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,106,61,0.06)",
                        borderColor:
                            theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(255,106,61,0.18)",
                    }}
                >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        On-the-Go Management
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ mt: 0.5, color: "text.secondary" }}
                    >
                        Manage books, members, and payments anywhere.
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100dvh" }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor: "transparent",
                    color: "text.primary",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    backdropFilter: "blur(10px)",
                }}
            >
                <Toolbar sx={{ gap: 1.5 }}>
                    {isMdDown && (
                        <IconButton
                            onClick={() => setMobileOpen(true)}
                            edge="start"
                            aria-label="open drawer"
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 800,
                            display: { xs: "none", sm: "block" },
                        }}
                    >
                        {title}
                    </Typography>

                    <Box sx={{ flex: 1 }} />

                    <Paper
                        component="form"
                        variant="outlined"
                        onSubmit={(e) => e.preventDefault()}
                        sx={{
                            display: { xs: "none", sm: "flex" },
                            alignItems: "center",
                            gap: 1,
                            px: 1.25,
                            py: 0.75,
                            borderRadius: 3,
                            width: { sm: 320, md: 420 },
                        }}
                    >
                        <SearchIcon fontSize="small" />
                        <InputBase
                            placeholder="Search anything…"
                            sx={{ flex: 1, fontSize: 14 }}
                        />
                    </Paper>

                    <ColorModeToggle />

                    <Chip
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        avatar={
                            <Avatar sx={{ width: 28, height: 28 }}>
                                {avatarText}
                            </Avatar>
                        }
                        label={displayName}
                        variant="outlined"
                        sx={{ borderRadius: 3, cursor: "pointer" }}
                    />

                    <Menu
                        anchorEl={anchorEl}
                        open={openMenu}
                        onClose={() => setAnchorEl(null)}
                    >
                        <MenuItem
                            onClick={() => {
                                setAnchorEl(null);
                                router.push("/profile"); // change if needed
                            }}
                        >
                            My Profile
                        </MenuItem>
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
                        sx={{ "& .MuiDrawer-paper": { width: drawerWidth } }}
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
                                borderRight: `1px solid ${theme.palette.divider}`,
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

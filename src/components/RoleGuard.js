"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isRoleAllowed } from "@/lib/roles";

export default function RoleGuard({ allowedRoles = [], children }) {
    const router = useRouter();
    const pathname = usePathname();

    const {
        loading,
        user,
        role,
        isActive,
        profileLoading,
        profile,
        refreshProfile,
        resyncAuth,
    } = useAuth();

    // failsafe timer to avoid infinite spinner
    const [stuck, setStuck] = React.useState(false);

    React.useEffect(() => {
        setStuck(false);
        let t = null;

        if (!loading && user && profileLoading && !profile) {
            t = setTimeout(() => setStuck(true), 8000);
        }

        return () => {
            if (t) clearTimeout(t);
        };
    }, [loading, user, profileLoading, profile]);

    React.useEffect(() => {
        if (!loading && !user) {
            router.replace(
                `/login?next=${encodeURIComponent(pathname || "/")}`
            );
        }
    }, [loading, user, router, pathname]);

    // Loading
    if (loading || (profileLoading && !profile && !stuck)) {
        return (
            <Paper variant="outlined" sx={{ borderRadius: 4, p: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <CircularProgress size={22} />
                    <Typography sx={{ fontWeight: 900 }}>Loading…</Typography>
                </Box>
            </Paper>
        );
    }

    // Stuck fallback
    if (!loading && user && profileLoading && !profile && stuck) {
        return (
            <Paper variant="outlined" sx={{ borderRadius: 4, p: 4 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                    Still loading your profile
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.75 }}
                >
                    This can happen after switching tabs if the network request
                    hangs. You can retry safely.
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                    <Button
                        variant="contained"
                        sx={{ borderRadius: 3 }}
                        onClick={async () => {
                            setStuck(false);
                            await resyncAuth();
                            await refreshProfile();
                        }}
                    >
                        Retry
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{ borderRadius: 3 }}
                        onClick={() => window.location.reload()}
                    >
                        Reload
                    </Button>
                </Box>
            </Paper>
        );
    }

    if (!user) return null;

    if (!isActive) {
        return (
            <Paper variant="outlined" sx={{ borderRadius: 4, p: 4 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                    Account disabled
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.75 }}
                >
                    Your account is currently disabled. Please contact the
                    administrator.
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                        component={Link}
                        href="/policies"
                        variant="contained"
                        sx={{ borderRadius: 3 }}
                    >
                        Policies
                    </Button>
                </Box>
            </Paper>
        );
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!isRoleAllowed(role, allowedRoles)) {
            return (
                <Paper variant="outlined" sx={{ borderRadius: 4, p: 4 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                        Access denied
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.75 }}
                    >
                        Your role does not have permission to view this page.
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                            component={Link}
                            href="/books"
                            variant="outlined"
                            sx={{ borderRadius: 3 }}
                        >
                            Browse Books
                        </Button>
                    </Box>
                </Paper>
            );
        }
    }

    return children;
}

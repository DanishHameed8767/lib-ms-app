import React from "react";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import { ROLES } from "./roles";

/**
 * Each nav item can declare which roles can see it.
 * If roles is omitted -> everyone sees it.
 */
export const navItems = [
    // Shared / general
    {
        label: "Dashboard",
        icon: <DashboardOutlinedIcon />,
        href: "/dashboard",
        roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF],
    },
    { label: "Books", icon: <MenuBookOutlinedIcon />, href: "/books" }, // everyone

    // Reader area
    {
        label: "Reader Dashboard",
        icon: <PersonOutlineOutlinedIcon />,
        href: "/reader/dashboard",
        roles: [ROLES.READER],
    },
    {
        label: "My Borrowings",
        icon: <HistoryOutlinedIcon />,
        href: "/reader/borrows",
        roles: [ROLES.READER],
    },
    {
        label: "My Subscriptions",
        icon: <SubscriptionsIcon />,
        href: "/reader/membership",
        roles: [ROLES.READER],
    },
    {
        label: "Reader Issues",
        icon: <HistoryOutlinedIcon />,
        href: "/borrows",
        roles: [ROLES.ADMIN, ROLES.LIBRARIAN],
    },
    {
        label: "My Fines",
        icon: <PaymentsOutlinedIcon />,
        href: "/reader/fines",
        roles: [ROLES.READER],
    },

    // Staff/Librarian workflows
    // {
    //     label: "Desk",
    //     icon: <SwapHorizOutlinedIcon />,
    //     href: "/desk",
    //     roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF],
    // },
    {
        label: "Members",
        icon: <PeopleAltOutlinedIcon />,
        href: "/members",
        roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF],
    },
    {
        label: "Orders",
        icon: <LocalShippingOutlinedIcon />,
        href: "/orders",
        roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF],
    },

    // Public readable info
    {
        label: "Policies",
        icon: <GavelOutlinedIcon />,
        href: "/policies",
        roles: [ROLES.READER, ROLES.LIBRARIAN],
    },
    {
        label: "Announcements",
        icon: <CampaignOutlinedIcon />,
        href: "/announcements",
        roles: [ROLES.READER, ROLES.LIBRARIAN],
    },

    // Admin area
    {
        label: "Admin Books",
        icon: <MenuBookOutlinedIcon />,
        href: "/admin/books",
        roles: [ROLES.ADMIN, ROLES.LIBRARIAN],
    },
    {
        label: "Branches",
        icon: <StorefrontOutlinedIcon />,
        href: "/admin/branches",
        roles: [ROLES.ADMIN],
    },
    {
        label: "Plans",
        icon: <CardMembershipIcon />,
        href: "/admin/plans",
        roles: [ROLES.ADMIN],
    },
    {
        label: "Admin Policies",
        icon: <GavelOutlinedIcon />,
        href: "/admin/policies",
        roles: [ROLES.ADMIN],
    },
    {
        label: "Admin Announcements",
        icon: <CampaignOutlinedIcon />,
        href: "/admin/announcements",
        roles: [ROLES.ADMIN],
    },
    {
        label: "Inventory",
        icon: <Inventory2OutlinedIcon />,
        href: "/inventory",
        roles: [ROLES.ADMIN, ROLES.STAFF], // adjust if you want librarian too
    },
    {
        label: "Payments",
        icon: <FactCheckOutlinedIcon />,
        href: "/payments",
        roles: [ROLES.ADMIN, ROLES.LIBRARIAN, ROLES.STAFF],
    },
];

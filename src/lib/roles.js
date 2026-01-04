export const ROLES = {
    READER: "Reader",
    LIBRARIAN: "Librarian",
    STAFF: "Staff",
    ADMIN: "Administrator",
};

export const ALL_ROLES = Object.values(ROLES);

/**
 * Role “rank” (optional). Useful for checks like “>= Librarian”.
 */
export const ROLE_RANK = {
    [ROLES.READER]: 1,
    [ROLES.LIBRARIAN]: 2,
    [ROLES.STAFF]: 3,
    [ROLES.ADMIN]: 4,
};

// src/lib/roles.js (or wherever isRoleAllowed is)
export function normalizeRole(r) {
    return String(r || "")
        .trim()
        .toLowerCase();
}

export function isRoleAllowed(role, allowedRoles) {
    // If item doesn't declare roles -> public
    if (!allowedRoles || allowedRoles.length === 0) return true;

    // If item declares roles but we don't know user's role -> hide
    if (!role) return false;

    const r = normalizeRole(role);
    return allowedRoles.some((x) => normalizeRole(x) === r);
}

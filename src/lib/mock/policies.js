export const mockPolicies = [
    {
        id: "pol_001",
        title: "Borrow Limit",
        category: "Borrowing",
        value: "Borrow limit depends on membership plan. Readers with unpaid fines cannot borrow new books.",
        updatedAt: "2026-01-02T09:15:00Z",
    },
    {
        id: "pol_002",
        title: "Renewals",
        category: "Borrowing",
        value: "Borrowed items may be renewed once if not overdue and if no reservation conflicts exist.",
        updatedAt: "2026-01-01T12:30:00Z",
    },
    {
        id: "pol_003",
        title: "Receipt Payments",
        category: "Payments",
        value: "All payments require receipt upload and approval by staff/admin. Rejected receipts must be re-uploaded.",
        updatedAt: "2026-01-03T11:10:00Z",
    },
];

export function fmtDT(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
    });
}

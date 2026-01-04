export const mockReservations = [
    {
        id: "res_001",
        username: "mia.sharp",
        bookTitle: "Dune Whisper",
        status: "Pending",
        queue: 2,
    },
    {
        id: "res_002",
        username: "mia.sharp",
        bookTitle: "Floral Dreams",
        status: "Ready",
        queue: 1,
    },
    {
        id: "res_003",
        username: "ezra.nolan",
        bookTitle: "Where the Flowers Bloom",
        status: "Pending",
        queue: 5,
    },
];

export const mockMemberPayments = [
    {
        id: "pm_001",
        username: "mia.sharp",
        type: "Fine",
        ref: "FINE-1042",
        amount: 10,
        status: "Rejected",
        date: "2026-01-03T10:20:00Z",
    },
    {
        id: "pm_002",
        username: "mia.sharp",
        type: "Subscription",
        ref: "SUB-2201",
        amount: 50,
        status: "Pending",
        date: "2026-01-03T14:05:00Z",
    },
    {
        id: "pm_003",
        username: "ezra.nolan",
        type: "Subscription",
        ref: "SUB-2190",
        amount: 30,
        status: "Approved",
        date: "2026-01-02T10:15:00Z",
    },
];

export function formatMoney(amount) {
    return `$${Number(amount || 0).toFixed(2)}`;
}

export function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

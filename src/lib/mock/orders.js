export const mockOrders = [
    {
        id: "ord_001",
        bookTitle: "The Silent Garden",
        quantity: 4,
        orderedBy: "librarian.a",
        status: "Pending",
        orderDate: "2026-01-03T10:10:00Z",
    },
    {
        id: "ord_002",
        bookTitle: "Dune Whisper",
        quantity: 2,
        orderedBy: "staff.k",
        status: "Received",
        orderDate: "2026-01-01T09:00:00Z",
    },
    {
        id: "ord_003",
        bookTitle: "Floral Dreams",
        quantity: 3,
        orderedBy: "librarian.a",
        status: "Cancelled",
        orderDate: "2026-01-02T12:20:00Z",
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

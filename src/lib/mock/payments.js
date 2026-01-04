export const mockPaymentReceipts = [
    {
        id: "pay_001",
        entityType: "Fine",
        entityRef: "FINE-1042",
        payerName: "Mia Sharp",
        payerUsername: "mia.sharp",
        amount: 10.0,
        method: "Bank transfer",
        status: "Pending",
        submittedAt: "2026-01-03T10:20:00Z",
        receiptPath: "receipts/uuid/receipt_001.png",
        note: "",
    },
    {
        id: "pay_002",
        entityType: "Subscription",
        entityRef: "SUB-2201",
        payerName: "Ezra Nolan",
        payerUsername: "ezra.nolan",
        amount: 50.0,
        method: "Cash deposit",
        status: "Pending",
        submittedAt: "2026-01-03T14:05:00Z",
        receiptPath: "receipts/uuid/receipt_002.pdf",
        note: "",
    },
    {
        id: "pay_003",
        entityType: "Fine",
        entityRef: "FINE-1099",
        payerName: "Noah Trent",
        payerUsername: "noah.trent",
        amount: 5.0,
        method: "UPI",
        status: "Approved",
        submittedAt: "2026-01-01T08:30:00Z",
        reviewedAt: "2026-01-01T12:00:00Z",
        reviewedBy: "Admin",
        receiptPath: "receipts/uuid/receipt_003.png",
        note: "Verified with bank statement.",
    },
    {
        id: "pay_004",
        entityType: "Subscription",
        entityRef: "SUB-2190",
        payerName: "Ava Lin",
        payerUsername: "ava.lin",
        amount: 30.0,
        method: "Bank transfer",
        status: "Rejected",
        submittedAt: "2026-01-02T09:10:00Z",
        reviewedAt: "2026-01-02T10:15:00Z",
        reviewedBy: "Librarian",
        receiptPath: "receipts/uuid/receipt_004.png",
        note: "Receipt unclear — please re-upload.",
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

export const mockPaymentInbox = [
    {
        id: "pay_001",
        type: "Fine",
        entityId: "fine_001",
        memberUsername: "mia.sharp",
        memberName: "Mia Sharp",
        amount: 10.0,
        method: "Bank transfer",
        status: "Pending", // Pending | Approved | Rejected
        submittedAt: "2026-01-03T14:10:00Z",
        receiptPath: "receipts/mia.sharp/fine_001/rcpt_20260103.png",
        noteFromUser: "Paid via bank transfer, ref: TXN-9912",
        reviewerNote: "",
    },
    {
        id: "pay_002",
        type: "Subscription",
        entityId: "sub_2201",
        memberUsername: "mia.sharp",
        memberName: "Mia Sharp",
        amount: 50.0,
        method: "UPI",
        status: "Pending",
        submittedAt: "2026-01-03T15:30:00Z",
        receiptPath: "receipts/mia.sharp/sub_2201/rcpt_20260103.pdf",
        noteFromUser: "UPI ref: 99881231",
        reviewerNote: "",
    },
    {
        id: "pay_003",
        type: "Fine",
        entityId: "fine_777",
        memberUsername: "ezra.nolan",
        memberName: "Ezra Nolan",
        amount: 5.0,
        method: "Cash deposit",
        status: "Approved",
        submittedAt: "2026-01-02T09:00:00Z",
        receiptPath: "receipts/ezra.nolan/fine_777/rcpt_20260102.jpg",
        noteFromUser: "Paid at counter.",
        reviewerNote: "Verified by staff.",
    },
    {
        id: "pay_004",
        type: "Fine",
        entityId: "fine_1042",
        memberUsername: "mia.sharp",
        memberName: "Mia Sharp",
        amount: 10.0,
        method: "Bank transfer",
        status: "Rejected",
        submittedAt: "2026-01-03T10:20:00Z",
        receiptPath: "receipts/mia.sharp/fine_1042/rcpt_20260103.png",
        noteFromUser: "Paid",
        reviewerNote: "Receipt unclear — please re-upload.",
    },
];

export function fmtDateTime(iso) {
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

export function money(n) {
    return `$${Number(n || 0).toFixed(2)}`;
}

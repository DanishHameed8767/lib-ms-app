export const mockReaderFines = [
    {
        id: "fine_001",
        borrowId: "br_1003",
        amount: 10.0,
        fineType: "Overdue",
        status: "Unpaid", // Unpaid | Partially Paid | Paid | Waived
        dueDate: "2026-01-05",
        payment: null,
    },
    {
        id: "fine_777",
        borrowId: "br_1002",
        amount: 5.0,
        fineType: "Damage",
        status: "Paid",
        dueDate: "2025-12-20",
        payment: {
            receiptFileName: "rcpt_damage.jpg",
            submittedAt: "2025-12-18T10:10:00Z",
            approvalStatus: "Approved", // Pending | Approved | Rejected
            reviewerNote: "Verified by staff.",
        },
    },
    {
        id: "fine_1042",
        borrowId: "br_1001",
        amount: 10.0,
        fineType: "Overdue",
        status: "Unpaid",
        dueDate: "2026-01-02",
        payment: {
            receiptFileName: "rcpt_overdue.png",
            submittedAt: "2026-01-03T10:20:00Z",
            approvalStatus: "Rejected",
            reviewerNote: "Receipt unclear — please re-upload.",
        },
    },
];

export function money(n) {
    return `$${Number(n || 0).toFixed(2)}`;
}

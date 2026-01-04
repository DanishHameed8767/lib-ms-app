export const readerProfile = {
    id: "u_reader_001",
    username: "noah.trent",
    fullName: "Noah Trent",
    email: "noahtrent@example.com",
    contact: "+1 555 222 0022",
    address: "42 Grove Street, Springfield",
    planName: "Standard",
    planExpires: "2026-03-05",
    borrowLimit: 2,
};

export const readerBorrows = [
    {
        id: "brw_r_001",
        bookTitle: "Where the Flowers Bloom",
        bookId: "where-the-flowers-bloom",
        branch: "Main Branch",
        startDate: "2025-12-25",
        dueDate: "2026-01-04",
        returnDate: null,
        status: "Borrowed",
        renewalCount: 0,
    },
    {
        id: "brw_r_002",
        bookTitle: "My Story",
        bookId: "my-story",
        branch: "Main Branch",
        startDate: "2025-12-10",
        dueDate: "2025-12-20",
        returnDate: null,
        status: "Overdue",
        renewalCount: 0,
    },
    {
        id: "brw_r_003",
        bookTitle: "Floral Dreams",
        bookId: "floral-dreams",
        branch: "City Branch",
        startDate: "2025-11-03",
        dueDate: "2025-11-13",
        returnDate: "2025-11-12",
        status: "Returned",
        renewalCount: 0,
    },
];

export const readerFines = [
    {
        id: "fine_001",
        borrowId: "brw_r_002",
        bookTitle: "My Story",
        amount: 10.0,
        paid: 0,
        outstanding: 10.0,
        status: "Unpaid",
        type: "Overdue",
        dueDate: "2026-01-05",
        receipts: [
            {
                id: "rcpt_001",
                submittedAt: "2026-01-03T10:20:00Z",
                status: "Rejected",
                note: "Receipt unclear — please re-upload.",
                receiptPath: "receipts/uuid/receipt_004.png",
            },
        ],
    },
    {
        id: "fine_002",
        borrowId: "brw_r_001",
        bookTitle: "Where the Flowers Bloom",
        amount: 5.0,
        paid: 5.0,
        outstanding: 0,
        status: "Paid",
        type: "Overdue",
        dueDate: "2025-12-30",
        receipts: [
            {
                id: "rcpt_010",
                submittedAt: "2025-12-29T08:00:00Z",
                status: "Approved",
                note: "Verified.",
                receiptPath: "receipts/uuid/receipt_003.png",
            },
        ],
    },
];

export function money(n) {
    return `$${Number(n || 0).toFixed(2)}`;
}

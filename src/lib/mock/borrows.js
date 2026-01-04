export const mockBorrows = [
    {
        id: "brw_001",
        readerUsername: "mia.sharp",
        readerName: "Mia Sharp",
        bookTitle: "Where the Flowers Bloom",
        bookId: "where-the-flowers-bloom",
        branch: "Main Branch",
        startDate: "2025-12-25",
        dueDate: "2026-01-04",
        status: "Borrowed",
        renewalCount: 0,
    },
    {
        id: "brw_002",
        readerUsername: "mia.sharp",
        readerName: "Mia Sharp",
        bookTitle: "My Story",
        bookId: "my-story",
        branch: "Main Branch",
        startDate: "2025-12-10",
        dueDate: "2025-12-20",
        status: "Overdue",
        renewalCount: 0,
    },
    {
        id: "brw_003",
        readerUsername: "ezra.nolan",
        readerName: "Ezra Nolan",
        bookTitle: "Dune Whisper",
        bookId: "dune-whisper",
        branch: "City Branch",
        startDate: "2025-12-28",
        dueDate: "2026-01-07",
        status: "Borrowed",
        renewalCount: 0,
    },
];

export function searchBorrows(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return mockBorrows;
    return mockBorrows.filter(
        (b) =>
            b.id.toLowerCase().includes(q) ||
            b.readerUsername.toLowerCase().includes(q) ||
            b.readerName.toLowerCase().includes(q) ||
            b.bookTitle.toLowerCase().includes(q)
    );
}

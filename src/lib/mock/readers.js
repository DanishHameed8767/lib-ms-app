export const mockReaders = [
    {
        id: "u_mia",
        username: "mia.sharp",
        fullName: "Mia Sharp",
        email: "mia@example.com",
        contact: "+1 555 220 9921",
        planName: "Gold",
        planExpires: "2026-02-12",
        borrowLimit: 5,
        activeBorrows: 2,
        unpaidFinesCount: 1,
        unpaidFinesAmount: 10.0,
    },
    {
        id: "u_ezra",
        username: "ezra.nolan",
        fullName: "Ezra Nolan",
        email: "ezra@example.com",
        contact: "+1 555 998 1002",
        planName: "Silver",
        planExpires: "2026-01-20",
        borrowLimit: 3,
        activeBorrows: 1,
        unpaidFinesCount: 0,
        unpaidFinesAmount: 0,
    },
    {
        id: "u_noah",
        username: "noah.trent",
        fullName: "Noah Trent",
        email: "noah@example.com",
        contact: "+1 555 111 2233",
        planName: "Standard",
        planExpires: "2026-03-05",
        borrowLimit: 2,
        activeBorrows: 2,
        unpaidFinesCount: 0,
        unpaidFinesAmount: 0,
    },
];

export function searchReaders(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return mockReaders;
    return mockReaders.filter(
        (r) =>
            r.fullName.toLowerCase().includes(q) ||
            r.username.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
    );
}

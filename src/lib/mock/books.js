export const mockBooks = [
    {
        id: "where-the-flowers-bloom",
        title: "Where the Flowers Bloom",
        author: "Olivia Wilson",
        genre: "Contemporary Fiction",
        isbn: "9781234567890",
        year: 2020,
        publisher: "Horizon House",
        edition: "1st",
        pages: 320,
        language: "English",
        stockTotal: 10,
        stockAvailable: 3,
        tags: ["contemporary", "literary", "women"],
        description:
            "A heartfelt story about renewal, community, and the quiet courage it takes to begin again.",
    },
    {
        id: "my-story",
        title: "My Story",
        author: "Leo Vance",
        genre: "Memoir",
        isbn: "9780987654321",
        year: 2018,
        publisher: "Papertrail",
        edition: "2nd",
        pages: 256,
        language: "English",
        stockTotal: 6,
        stockAvailable: 0,
        tags: ["memoir", "inspiring"],
        description:
            "An intimate memoir tracing a journey through resilience, family, and finding purpose.",
    },
    {
        id: "dune-whisper",
        title: "Dune Whisper",
        author: "Kai Rowan",
        genre: "Sci-Fi",
        isbn: "9781111111111",
        year: 2022,
        publisher: "Nebula Press",
        edition: "1st",
        pages: 410,
        language: "English",
        stockTotal: 12,
        stockAvailable: 8,
        tags: ["sci-fi", "space", "adventure"],
        description:
            "A high-stakes expedition beyond the rim, where politics and survival collide.",
    },
    {
        id: "floral-dreams",
        title: "Floral Dreams",
        author: "Nyla Solis",
        genre: "Art & Design",
        isbn: "9782222222222",
        year: 2019,
        publisher: "Studio Ink",
        edition: "1st",
        pages: 180,
        language: "English",
        stockTotal: 4,
        stockAvailable: 2,
        tags: ["design", "illustration"],
        description:
            "A visual collection exploring botanical forms through modern illustration techniques.",
    },
];

export function getBookById(id) {
    return mockBooks.find((b) => b.id === id) || mockBooks[0];
}

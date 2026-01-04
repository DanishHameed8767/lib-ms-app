export const mockBranchTimings = {
    main: {
        branchName: "Main Branch",
        weekly: [
            { day: "Monday", open: "09:00", close: "18:00", isClosed: false },
            { day: "Tuesday", open: "09:00", close: "18:00", isClosed: false },
            {
                day: "Wednesday",
                open: "09:00",
                close: "18:00",
                isClosed: false,
            },
            { day: "Thursday", open: "09:00", close: "18:00", isClosed: false },
            { day: "Friday", open: "09:00", close: "18:00", isClosed: false },
            { day: "Saturday", open: "10:00", close: "16:00", isClosed: false },
            { day: "Sunday", open: "", close: "", isClosed: true },
        ],
        overrides: [
            {
                id: "ov_001",
                startDate: "2026-01-10",
                endDate: "2026-01-10",
                isClosed: true,
                note: "Maintenance",
            },
            {
                id: "ov_002",
                startDate: "2026-01-12",
                endDate: "2026-01-12",
                open: "12:00",
                close: "18:00",
                isClosed: false,
                note: "Late opening",
            },
        ],
    },

    city: {
        branchName: "City Branch",
        weekly: [
            { day: "Monday", open: "10:00", close: "19:00", isClosed: false },
            { day: "Tuesday", open: "10:00", close: "19:00", isClosed: false },
            {
                day: "Wednesday",
                open: "10:00",
                close: "19:00",
                isClosed: false,
            },
            { day: "Thursday", open: "10:00", close: "19:00", isClosed: false },
            { day: "Friday", open: "10:00", close: "19:00", isClosed: false },
            { day: "Saturday", open: "11:00", close: "16:00", isClosed: false },
            { day: "Sunday", open: "", close: "", isClosed: true },
        ],
        overrides: [],
    },

    north: {
        branchName: "North Branch",
        weekly: [
            { day: "Monday", open: "09:00", close: "17:00", isClosed: false },
            { day: "Tuesday", open: "09:00", close: "17:00", isClosed: false },
            {
                day: "Wednesday",
                open: "09:00",
                close: "17:00",
                isClosed: false,
            },
            { day: "Thursday", open: "09:00", close: "17:00", isClosed: false },
            { day: "Friday", open: "09:00", close: "17:00", isClosed: false },
            { day: "Saturday", open: "", close: "", isClosed: true },
            { day: "Sunday", open: "", close: "", isClosed: true },
        ],
        overrides: [
            {
                id: "ov_050",
                startDate: "2026-01-08",
                endDate: "2026-01-08",
                isClosed: true,
                note: "Public holiday",
            },
        ],
    },
};

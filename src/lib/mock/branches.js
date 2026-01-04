export const mockBranches = [
    { id: "main", name: "Main Branch" },
    { id: "city", name: "City Branch" },
    { id: "north", name: "North Branch" },
];

// UI-only placeholder for opening hours check.
// Later this comes from timings table + rules.
export function getBranchOpenState() {
    // set to false to see "closed" banner UI
    return { isOpen: true, nextOpenText: "Tomorrow 9:00 AM" };
}

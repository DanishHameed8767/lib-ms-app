export function normalizeBook(b) {
    return {
        id: String(b?.id ?? ""),
        title: b?.title ?? "",
        author: b?.author ?? "",
        genre: b?.genre ?? "",
        isbn: b?.isbn ?? "",
        price: Number(b?.price || 0),
        stockTotal: Number(b?.stockTotal ?? b?.stock_total ?? 0),
        stockAvailable: Number(b?.stockAvailable ?? b?.stock_available ?? 0),
        coverImageUrl: b?.coverImageUrl || b?.cover_image_url || "",
    };
}

export function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

export function addDaysISO(days) {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString().slice(0, 10);
}

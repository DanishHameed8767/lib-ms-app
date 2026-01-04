// src/lib/supabase/booksApi.js
export async function fetchBooks(supabase) {
    const { data, error } = await supabase
        .from("books")
        .select(
            `
      id,
      title,
      genre,
      isbn,
      edition,
      publisher,
      publication_year,
      price,
      stock_total,
      stock_available,
      cover_image_url,
      created_at
    `
        )
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
}

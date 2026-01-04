// src/lib/supabase/staffBorrowApi.js
// Librarian/Admin borrow/return helpers (client-side).

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function withTimeout(promise, ms, label = "Request") {
    let t;
    const timeout = new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function listBranches(supabase) {
    const res = await withTimeout(
        supabase
            .from("library_branches")
            .select("id,name,address")
            .order("name", { ascending: true }),
        9000,
        "Load branches"
    );
    if (res.error) throw res.error;
    return res.data || [];
}

export async function searchReaders(supabase, q) {
    const query = String(q || "").trim();
    if (!query) return [];

    // Only show Reader accounts (optional but typical)
    // RLS: librarian/admin can read profiles
    const res = await withTimeout(
        supabase
            .from("profiles")
            .select("id,username,full_name,is_active,role")
            .eq("role", "Reader")
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(20),
        9000,
        "Search readers"
    );
    if (res.error) throw res.error;

    return (res.data || []).filter((p) => p.is_active);
}

export async function searchBooks(supabase, q) {
    const query = String(q || "").trim();
    if (!query) return [];

    const res = await withTimeout(
        supabase
            .from("books")
            .select(
                "id,title,isbn,genre,stock_available,stock_total,cover_image_url"
            )
            .or(`title.ilike.%${query}%,isbn.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(20),
        9000,
        "Search books"
    );
    if (res.error) throw res.error;
    return res.data || [];
}

export async function createBorrowForReader({
    supabase,
    readerId,
    bookId,
    branchId,
}) {
    const res = await withTimeout(
        supabase
            .from("borrows")
            .insert({
                reader_id: readerId,
                book_id: bookId,
                branch_id: branchId,
            })
            .select(
                "id,status,start_date,due_date,return_date,renewal_count,reader_id,book_id,branch_id"
            )
            .single(),
        12000,
        "Create borrow"
    );
    if (res.error) throw res.error;
    return res.data;
}

export async function returnBorrow({
    supabase,
    borrowId,
    branchId, // optional; if you pass it, triggers will use this branch for open-hours check
    status, // 'Returned' | 'Lost' | 'Damaged'
}) {
    const payload = {
        status,
        return_date: isoDate(),
    };
    if (branchId) payload.branch_id = branchId;

    const res = await withTimeout(
        supabase
            .from("borrows")
            .update(payload)
            .eq("id", borrowId)
            .select("id,status,start_date,due_date,return_date,renewal_count")
            .single(),
        12000,
        "Return borrow"
    );
    if (res.error) throw res.error;
    return res.data;
}

export async function renewBorrowOnce({ supabase, borrowId }) {
    // Need current renewal_count to increment safely (no RPC in your schema)
    const cur = await withTimeout(
        supabase
            .from("borrows")
            .select("id,renewal_count")
            .eq("id", borrowId)
            .single(),
        9000,
        "Load borrow"
    );
    if (cur.error) throw cur.error;

    const nextCount = Number(cur.data?.renewal_count || 0) + 1;

    const res = await withTimeout(
        supabase
            .from("borrows")
            .update({ renewal_count: nextCount })
            .eq("id", borrowId)
            .select("id,status,start_date,due_date,return_date,renewal_count")
            .single(),
        12000,
        "Renew borrow"
    );
    if (res.error) throw res.error;
    return res.data;
}

export async function fetchActiveBorrows(supabase, { limit = 100 } = {}) {
    // Show active-ish list for staff
    const res = await withTimeout(
        supabase
            .from("borrows")
            .select(
                `
        id,status,start_date,due_date,return_date,renewal_count,
        profiles ( id, username, full_name ),
        books ( id, title, isbn, stock_available ),
        library_branches ( id, name )
      `
            )
            .in("status", ["Borrowed", "Overdue"])
            .order("start_date", { ascending: false })
            .limit(limit),
        12000,
        "Load borrows list"
    );
    if (res.error) throw res.error;
    return res.data || [];
}

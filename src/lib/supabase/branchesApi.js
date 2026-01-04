// src/lib/supabase/branchesApi.js

function withTimeout(promise, ms, label = "Request") {
    let t;
    const timeout = new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

export async function fetchBranches(supabase) {
    const res = await withTimeout(
        supabase
            .from("library_branches")
            .select(
                `
        id,
        name,
        address,
        manager_id,
        profiles:manager_id ( id, username, full_name )
      `
            )
            .order("name", { ascending: true }),
        12000,
        "Load branches"
    );
    if (res.error) throw res.error;
    return res.data || [];
}

export async function createBranch(supabase, payload) {
    const res = await withTimeout(
        supabase
            .from("library_branches")
            .insert({
                name: String(payload?.name || "").trim(),
                address: String(payload?.address || "").trim(),
                manager_id: payload?.manager_id || null,
            })
            .select(
                `
        id,
        name,
        address,
        manager_id,
        profiles:manager_id ( id, username, full_name )
      `
            )
            .single(),
        12000,
        "Create branch"
    );
    if (res.error) throw res.error;
    return res.data;
}

export async function updateBranch(supabase, id, payload) {
    const res = await withTimeout(
        supabase
            .from("library_branches")
            .update({
                name: String(payload?.name || "").trim(),
                address: String(payload?.address || "").trim(),
                manager_id: payload?.manager_id || null,
            })
            .eq("id", id)
            .select(
                `
        id,
        name,
        address,
        manager_id,
        profiles:manager_id ( id, username, full_name )
      `
            )
            .single(),
        12000,
        "Update branch"
    );
    if (res.error) throw res.error;
    return res.data;
}

export async function deleteBranch(supabase, id) {
    const res = await withTimeout(
        supabase.from("library_branches").delete().eq("id", id),
        12000,
        "Delete branch"
    );
    if (res.error) throw res.error;
    return true;
}

// Manager picker: librarian/admin can read profiles via RLS
export async function searchStaffManagers(supabase, q) {
    const query = String(q || "").trim();
    if (!query) return [];

    const res = await withTimeout(
        supabase
            .from("profiles")
            .select("id, username, full_name, role, is_active")
            .in("role", ["Librarian", "Staff", "Administrator"])
            .eq("is_active", true)
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(20),
        12000,
        "Search managers"
    );
    if (res.error) throw res.error;
    return res.data || [];
}

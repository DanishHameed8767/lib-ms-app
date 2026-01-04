// src/lib/supabase/readerApi.js
// Reader-facing Supabase helpers (client-side).
// Works with your RLS policies and receipts storage policy (bucket: 'receipts').

function isoDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function sanitizeFilename(name = "receipt") {
    return String(name)
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9._-]/g, "");
}

function withTimeout(promise, ms, label = "Request") {
    let t;
    const timeout = new Promise((_, reject) => {
        t = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

async function getUserIdFromClient(supabase, userId) {
    if (userId) return userId;

    const res = await withTimeout(
        supabase.auth.getUser(),
        7000,
        "Auth getUser"
    );

    if (res.error) throw res.error;
    return res.data?.user?.id || null;
}

// ------------------------------
// Dashboard (from earlier)
// ------------------------------
export async function fetchReaderDashboardStats(supabase, userId) {
    const uid = await getUserIdFromClient(supabase, userId);
    if (!uid) {
        return {
            activeBorrows: 0,
            overdueBorrows: 0,
            unpaidFinesCount: 0,
            unpaidTotal: 0,
            pendingApprovals: 0,
        };
    }

    const today = isoDate();

    const borrowsP = supabase
        .from("borrows")
        .select("id,status,due_date,return_date")
        .eq("reader_id", uid)
        .in("status", ["Borrowed", "Overdue"])
        .is("return_date", null)
        .limit(500);

    const finesP = supabase
        .from("fines")
        .select("id,amount,amount_paid,status,borrow_id")
        .in("status", ["Unpaid", "Partially Paid"])
        .limit(500);

    const receiptsP = supabase
        .from("payment_receipts")
        .select("id", { count: "exact", head: true })
        .eq("payer_id", uid)
        .eq("status", "Pending");

    const [
        { data: borrows, error: bErr },
        { data: fines, error: fErr },
        recRes,
    ] = await withTimeout(
        Promise.all([borrowsP, finesP, receiptsP]),
        9000,
        "Dashboard stats"
    );

    if (bErr) throw bErr;
    if (fErr) throw fErr;
    if (recRes?.error) throw recRes.error;

    const activeBorrows = (borrows || []).length;

    const overdueBorrows = (borrows || []).filter((b) => {
        if (b.status === "Overdue") return true;
        const due = b.due_date ? String(b.due_date) : "";
        return due && due < today;
    }).length;

    const unpaidAmounts = (fines || []).map((f) => {
        const amount = Number(f.amount || 0);
        const paid = Number(f.amount_paid || 0);
        return Math.max(amount - paid, 0);
    });

    const unpaidTotal = unpaidAmounts.reduce((acc, x) => acc + x, 0);

    const unpaidFinesCount = (fines || []).filter((f) => {
        const amount = Number(f.amount || 0);
        const paid = Number(f.amount_paid || 0);
        return amount - paid > 0;
    }).length;

    const pendingApprovals = recRes?.count ?? 0;

    return {
        activeBorrows,
        overdueBorrows,
        unpaidFinesCount,
        unpaidTotal,
        pendingApprovals,
    };
}

export async function fetchMySubscriptionSummary(supabase, userId) {
    const uid = await getUserIdFromClient(supabase, userId);
    if (!uid) return null;

    const subRes = await withTimeout(
        supabase
            .from("subscriptions")
            .select(
                "id,status,plan_id,plan_name,start_date,end_date,amount_paid,created_at"
            )
            .eq("reader_id", uid)
            .order("end_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        8000,
        "Load subscription"
    );

    if (subRes.error) throw subRes.error;
    const sub = subRes.data;
    if (!sub) return null;

    let plan = null;
    if (sub.plan_id) {
        const planRes = await withTimeout(
            supabase
                .from("membership_plans")
                .select(
                    "id,name,price,borrow_limit,borrow_duration_days,fine_amount_per_day,grace_period_days,is_active"
                )
                .eq("id", sub.plan_id)
                .maybeSingle(),
            8000,
            "Load plan"
        );

        if (!planRes.error) plan = planRes.data || null;
    }

    return { sub, plan };
}

// ------------------------------
// Reader Borrows
// ------------------------------
export async function fetchMyBorrows(supabase, userId) {
    const uid = await getUserIdFromClient(supabase, userId);
    if (!uid) return [];

    // Alias relationships so your UI can read b.books and b.branches
    const res = await withTimeout(
        supabase
            .from("borrows")
            .select(
                `
        id,
        status,
        start_date,
        due_date,
        return_date,
        renewal_count,
        book_id,
        branch_id,
        books:books ( id, title, isbn, genre ),
        branches:library_branches ( id, name )
      `
            )
            .eq("reader_id", uid)
            .order("start_date", { ascending: false })
            .limit(500),
        9000,
        "Load borrows"
    );

    if (res.error) throw res.error;
    return res.data || [];
}

// ------------------------------
// Reader Fines + Receipts
// ------------------------------
export async function fetchMyFines(supabase, userId) {
    const uid = await getUserIdFromClient(supabase, userId);
    if (!uid) return [];

    // RLS already ensures "own fines only" via borrows policy,
    // but filtering via joins is not necessary.
    const res = await withTimeout(
        supabase
            .from("fines")
            .select(
                "id,borrow_id,amount,amount_paid,fine_type,status,due_date,created_at,updated_at"
            )
            .order("created_at", { ascending: false })
            .limit(500),
        9000,
        "Load fines"
    );

    if (res.error) throw res.error;
    return res.data || [];
}

export async function fetchMyFineReceipts(supabase, userId) {
    const uid = await getUserIdFromClient(supabase, userId);
    if (!uid) return [];

    const res = await withTimeout(
        supabase
            .from("payment_receipts")
            .select(
                "id,payer_id,entity_type,entity_id,amount,receipt_path,status,submitted_at,reviewed_at,review_note,reviewed_by"
            )
            .eq("payer_id", uid)
            .eq("entity_type", "Fine")
            .order("submitted_at", { ascending: false })
            .limit(1000),
        9000,
        "Load fine receipts"
    );

    if (res.error) throw res.error;
    return res.data || [];
}

export function attachLatestReceiptToFines(fines = [], receipts = []) {
    const latestByEntity = new Map();

    // receipts are ordered desc by submitted_at, so first wins
    for (const r of receipts || []) {
        const key = r.entity_id;
        if (!latestByEntity.has(key)) latestByEntity.set(key, r);
    }

    return (fines || []).map((f) => ({
        ...f,
        latestReceipt: latestByEntity.get(f.id) || null,
    }));
}

export function getOutstandingAmount(fine) {
    const amount = Number(fine?.amount || 0);
    const paid = Number(fine?.amount_paid || 0);
    return Math.max(amount - paid, 0);
}

// Upload to Storage bucket: 'receipts' (policy requires name starts with `${auth.uid()}/`)
// Then insert into public.payment_receipts with status Pending.
export async function uploadReceiptAndCreatePayment({
    supabase,
    userId,
    entityType, // 'Fine' | 'Subscription'
    entityId,
    amount,
    file,
}) {
    if (!supabase) throw new Error("Supabase client missing");
    const uid = await getUserIdFromClient(supabase, userId);
    if (!uid) throw new Error("Not authenticated");

    if (!entityType || !entityId) throw new Error("Missing payment target");
    if (!file) throw new Error("Please choose a receipt file");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("Invalid amount");
    }

    const safeName = sanitizeFilename(file.name || "receipt");
    const ext = safeName.includes(".") ? safeName.split(".").pop() : "png";
    const key = `${uid}/${String(
        entityType
    ).toLowerCase()}_${entityId}_${Date.now()}.${ext}`;

    // 1) Upload to Storage
    const uploadRes = await withTimeout(
        supabase.storage.from("receipts").upload(key, file, {
            upsert: false,
            cacheControl: "3600",
            contentType: file.type || undefined,
        }),
        15000,
        "Receipt upload"
    );

    if (uploadRes.error) throw uploadRes.error;

    // 2) Insert payment_receipts row
    const insertRes = await withTimeout(
        supabase
            .from("payment_receipts")
            .insert({
                payer_id: uid,
                entity_type: entityType,
                entity_id: entityId,
                amount: numericAmount,
                receipt_path: key,
                status: "Pending",
            })
            .select("*")
            .single(),
        9000,
        "Create payment receipt row"
    );

    if (insertRes.error) {
        // best-effort cleanup
        try {
            await supabase.storage.from("receipts").remove([key]);
        } catch (_) {}
        throw insertRes.error;
    }

    return insertRes.data;
}

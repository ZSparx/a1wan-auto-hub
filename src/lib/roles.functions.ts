import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const ADMIN_LIMIT = 2;

function adminClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function countAdmins(db: ReturnType<typeof adminClient>) {
  const { count, error } = await db
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Public: how many admin seats are left, so signup can hide the option when full. */
export const adminSeats = createServerFn({ method: "GET" }).handler(async () => {
  const db = adminClient();
  const used = await countAdmins(db);
  return { used, limit: ADMIN_LIMIT, remaining: Math.max(0, ADMIN_LIMIT - used) };
});

/** Public: has the shop admin been claimed yet? */
export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const db = adminClient();
  return { exists: (await countAdmins(db)) > 0 };
});

const createSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  role: z.enum(["customer", "mechanic"]),
});

/** Admin-only: create a real login account for a customer or mechanic. */
export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isAdmin) throw new Error("Forbidden");

    const db = adminClient();
    const { data: created, error } = await db.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone ?? "" },
    });
    if (error) throw new Error(error.message);
    const newId = created.user!.id;

    await db.from("profiles").upsert({
      id: newId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
    });
    await db.from("user_roles").delete().eq("user_id", newId);
    const { error: rErr } = await db.from("user_roles").insert({ user_id: newId, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { success: true, id: newId };
  });

/** Admin-only: list mechanics for assignment dropdowns. */
export const listMechanics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const db = adminClient();
    const { data: roles } = await db.from("user_roles").select("user_id").eq("role", "mechanic");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    return profiles ?? [];
  });

/** Admin-only: list every account with its role. */
export const listAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const db = adminClient();
    const { data: profiles } = await db
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .order("created_at", { ascending: true });
    const { data: roles } = await db.from("user_roles").select("user_id, role");
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    return (profiles ?? []).map((p) => ({
      ...p,
      role: (roleMap.get(p.id) ?? "customer") as "admin" | "mechanic" | "customer",
      isSelf: p.id === context.userId,
    }));
  });

/** Admin-only: change a user's role (admin seats capped at 2). */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(["admin", "mechanic", "customer"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const db = adminClient();
    const { data: current } = await db.from("user_roles").select("role").eq("user_id", data.user_id);
    const currentRole = current?.[0]?.role;
    if (currentRole === data.role) return { success: true };

    if (data.role === "admin" && (await countAdmins(db)) >= ADMIN_LIMIT) {
      throw new Error(`Only ${ADMIN_LIMIT} admin accounts are allowed.`);
    }
    if (currentRole === "admin" && data.role !== "admin") {
      if (data.user_id === context.userId) throw new Error("You cannot remove your own admin access.");
      if ((await countAdmins(db)) <= 1) throw new Error("The shop must keep at least one admin.");
    }

    await db.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await db.from("user_roles").insert({ user_id: data.user_id, role: data.role });
    if (error) throw new Error(error.message);
    return { success: true };
  });

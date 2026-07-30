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

/** Signed-in user redeems the shop's admin code to claim one of the 2 admin seats. */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ code: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data, context }) => {
    const expected = process.env.ADMIN_SIGNUP_CODE;
    if (!expected) throw new Error("Admin signup is not configured.");
    if (data.code.trim() !== expected.trim()) throw new Error("Invalid admin code.");

    const db = adminClient();
    if ((await countAdmins(db)) >= ADMIN_LIMIT) {
      throw new Error("Both admin seats are already taken.");
    }

    const { data: existing } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (existing?.some((r) => r.role === "admin")) return { success: true };

    await db.from("user_roles").delete().eq("user_id", context.userId);
    const { error } = await db.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { success: true };
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

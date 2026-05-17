import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const tokenSchema = z.object({ token: z.string().uuid() });

export const getWorkOrderByToken = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: wo, error } = await supabaseAdmin
      .from("work_orders")
      .select("id, customer_name, vehicle_description, description, status, created_at, updated_at")
      .eq("public_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!wo) throw new Error("Not found");
    return wo;
  });

export const getInvoiceByToken = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: inv, error } = await supabaseAdmin
      .from("invoices")
      .select("id, customer_name, customer_email, subtotal_cents, tax_cents, total_cents, status, due_date, paid_at, created_at")
      .eq("public_token", data.token)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!inv) throw new Error("Not found");
    const { data: items } = await supabaseAdmin
      .from("invoice_items")
      .select("id, description, quantity, unit_price_cents")
      .eq("invoice_id", inv.id);
    return { invoice: inv, items: items ?? [] };
  });

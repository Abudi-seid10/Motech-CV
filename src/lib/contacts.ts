import { supabase } from "./supabase";

export type ContactStatus = "new" | "contacted" | "archived";
export type ContactSource = "card" | "cv";

export interface ContactRow {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: ContactSource;
  status: ContactStatus;
  notes: string | null;
  created_at: string;
}

export interface SubmitContactInput {
  ownerId: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: ContactSource;
  /** The profile owner's info, used only to address the notification email — never stored on the contact row. */
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerSlug?: string;
}

/**
 * Saves a visitor's shared contact info for the profile owner, then
 * best-effort triggers a "someone wants to connect" email via the
 * send-hello Edge Function. The save always happens even if the email
 * can't be sent (no Edge Function deployed, no RESEND_API_KEY, etc.) —
 * email is a notification, not the source of truth.
 */
export async function submitContact(input: SubmitContactInput) {
  // No .select() here: anonymous visitors can insert but have no SELECT
  // policy, so asking for the row back would fail RLS.
  const { error } = await supabase
    .from("contacts")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      message: input.message || null,
      source: input.source ?? "card",
    });

  if (error) throw error;

  if (input.ownerEmail) {
    try {
      await supabase.functions.invoke("send-hello", {
        body: {
          ownerEmail: input.ownerEmail,
          ownerName: input.ownerName ?? "",
          ownerSlug: input.ownerSlug ?? "",
          visitorName: input.name,
          visitorEmail: input.email,
          visitorPhone: input.phone ?? "",
          message: input.message ?? "",
        },
      });
    } catch {
      // Non-fatal — the contact is already saved in the CRM either way.
      // Common causes: the Edge Function isn't deployed yet, or
      // RESEND_API_KEY isn't set. Nothing for the visitor to see or retry.
    }
  }
}

export async function fetchOwnContacts(ownerId: string) {
  return supabase
    .from("contacts")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
}

export function updateContactStatus(id: string, status: ContactStatus) {
  return supabase.from("contacts").update({ status }).eq("id", id).select().single();
}

export function updateContactNotes(id: string, notes: string) {
  return supabase.from("contacts").update({ notes }).eq("id", id).select().single();
}

export function deleteContact(id: string) {
  return supabase.from("contacts").delete().eq("id", id);
}

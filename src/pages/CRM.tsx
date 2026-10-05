import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { fetchOwnProfile, Plan } from "@/lib/api";
import { PLANS, contactLimitFor, canExportContacts } from "@/lib/plans";
import { exportContactsCSV, exportContactsVCard } from "@/lib/exportContacts";
import { ContactRow, ContactStatus, fetchOwnContacts, updateContactStatus, deleteContact } from "@/lib/contacts";

const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "New",
  contacted: "Contacted",
  archived: "Archived",
};

export default function CRM() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();

  const [contacts, setContacts] = useState<ContactRow[] | null>(null);
  const [filter, setFilter] = useState<ContactStatus | "all">("all");
  const [plan, setPlan] = useState<Plan>("free");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      navigate("/login");
      return;
    }

    fetchOwnProfile(session.user.id).then(({ data: row, error: profileError }) => {
      if (profileError) {
        setError(profileError.message);
        return;
      }
      if (!row || row.slug !== slug) {
        setError(`You're signed in as /${row?.slug ?? "?"} — sign out to view /${slug}'s CRM.`);
        return;
      }
      setPlan(row.plan);
      fetchOwnContacts(session.user.id).then(({ data: rows, error: contactsError }) => {
        if (contactsError) {
          setError(contactsError.message);
          return;
        }
        setContacts((rows ?? []) as ContactRow[]);
      });
    });
  }, [session, sessionLoading, slug, navigate]);

  async function setStatus(id: string, status: ContactStatus) {
    const { data, error: updateError } = await updateContactStatus(id, status);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setContacts((prev) => (prev ?? []).map((c) => (c.id === id ? (data as ContactRow) : c)));
  }

  async function remove(id: string) {
    const { error: deleteError } = await deleteContact(id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setContacts((prev) => (prev ?? []).filter((c) => c.id !== id));
  }

  if (sessionLoading || (!contacts && !error)) {
    return <div className="min-h-screen grid place-items-center font-mono text-sm text-muted">Loading…</div>;
  }

  const limit = contactLimitFor(plan);
  const planName = PLANS.find((p) => p.id === plan)?.name ?? "Starter";
  const used = contacts?.length ?? 0;
  const full = limit !== null && used >= limit;
  const canExport = canExportContacts(plan);
  const visible = (contacts ?? []).filter((c) => filter === "all" || c.status === filter);
  const counts = {
    all: contacts?.length ?? 0,
    new: contacts?.filter((c) => c.status === "new").length ?? 0,
    contacted: contacts?.filter((c) => c.status === "contacted").length ?? 0,
    archived: contacts?.filter((c) => c.status === "archived").length ?? 0,
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-10 bg-ink/90 backdrop-blur border-b border-border px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl sm:text-2xl tracking-wide">CRM — /{slug}</h1>
        <div className="flex items-center gap-4 font-mono text-xs">
          <Link to={`/${slug}/edit`} className="text-muted hover:text-gold">Edit CV ↗</Link>
          <Link to={`/card/${slug}`} className="text-muted hover:text-gold">Card ↗</Link>
        </div>
      </header>

      {error && <p className="px-4 sm:px-6 py-2 font-mono text-xs text-red-400">{error}</p>}

      {contacts && (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
          <p className="text-muted text-sm mb-6">
            People who shared their contact info on your{" "}
            <Link to={`/card/${slug}`} className="text-gold-dim hover:text-gold">card</Link> show up here.
          </p>

          {limit !== null && (
            <div className="card p-4 mb-6">
              <div className="flex items-baseline justify-between font-mono text-xs mb-2">
                <span className="text-muted">{planName} plan</span>
                <span className={full ? "text-red-400" : "text-gold-soft"}>
                  {used} / {limit} contacts
                </span>
              </div>
              <div className="h-1.5 bg-raised rounded-full overflow-hidden">
                <div className={`h-full ${full ? "bg-red-400" : "bg-gold"}`} style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
              </div>
              {full ? (
                <p className="text-xs text-red-400 mt-3 leading-relaxed">
                  Your CRM is full — new visitors can't send you their details until you delete some contacts
                  or upgrade your plan.
                </p>
              ) : (
                used >= limit * 0.8 && (
                  <p className="text-xs text-muted mt-3">You're close to your limit. Delete old contacts to make room.</p>
                )
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3 font-mono text-xs">
            <span className="text-muted uppercase tracking-widest2 mr-1">Export</span>
            {(
              [
                ["CSV", exportContactsCSV],
                ["vCard", exportContactsVCard],
              ] as const
            ).map(([label, run]) => (
              <button
                key={label}
                disabled={!canExport || visible.length === 0}
                onClick={() => run(visible, slug ?? "contacts")}
                title={canExport ? `Download ${visible.length} contact(s)` : "Available on Basic and Pro"}
                className="border border-gold/50 px-3 py-1.5 rounded-full uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold-soft"
              >
                {label}
              </button>
            ))}
            {!canExport && <span className="text-muted">Upgrade to Basic or Pro to export.</span>}
            {canExport && <span className="text-muted">Exports the contacts in the current filter ({visible.length}).</span>}
          </div>

          <div className="flex flex-wrap gap-2 mb-6 font-mono text-xs">
            {(["all", "new", "contacted", "archived"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`border px-3 py-1.5 rounded-full uppercase tracking-widest2 transition-colors ${
                  filter === f ? "border-gold text-gold-soft" : "border-border text-muted hover:text-gold"
                }`}
              >
                {f === "all" ? "All" : STATUS_LABEL[f]} ({counts[f]})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-muted text-sm">No contacts here yet.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((c) => (
                <div key={c.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-bone font-medium">{c.name}</p>
                      <p className="font-mono text-xs text-muted">
                        <a href={`mailto:${c.email}`} className="hover:text-gold">{c.email}</a>
                        {c.phone && <> · <a href={`tel:${c.phone}`} className="hover:text-gold">{c.phone}</a></>}
                      </p>
                      {c.message && <p className="text-sm text-bone/80 mt-2 max-w-md">{c.message}</p>}
                      <p className="font-mono text-[10px] text-muted mt-2">
                        via {c.source} · {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={c.status}
                        onChange={(e) => setStatus(c.id, e.target.value as ContactStatus)}
                        className="bg-raised border border-border rounded-sm px-2 py-1 text-xs font-mono"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        onClick={() => remove(c.id)}
                        className="font-mono text-[11px] text-muted hover:text-red-400"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

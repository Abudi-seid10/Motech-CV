type FieldType = "text" | "textarea" | "list";

interface FieldDef<T> {
  key: keyof T;
  label: string;
  type?: FieldType; // "list" = string[] rendered as one-per-line textarea
}

interface ArrayEditorProps<T> {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  fields: FieldDef<T>[];
  emptyItem: T;
}

/**
 * Renders add / edit / remove / reorder controls for any array of flat
 * objects in CVData (experience, education, competencies, certifications,
 * awards, languages). Driven entirely by `fields`, so new CV sections don't
 * need a bespoke editor component.
 */
export default function ArrayEditor<T extends object>({
  label,
  items,
  onChange,
  fields,
  emptyItem,
}: ArrayEditorProps<T>) {
  function update(index: number, key: keyof T, value: string | string[]) {
    const next = items.slice();
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="eyebrow">{label}</h3>
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem])}
          className="font-mono text-xs text-gold-dim hover:text-gold"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="flex justify-end gap-3 font-mono text-[11px] text-muted">
              <button type="button" onClick={() => move(i, -1)} className="hover:text-gold">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="hover:text-gold">↓</button>
              <button type="button" onClick={() => remove(i)} className="hover:text-red-400">remove</button>
            </div>
            {fields.map((f) => {
              const raw = item[f.key];
              if (f.type === "list") {
                const value = Array.isArray(raw) ? (raw as string[]).join("\n") : "";
                return (
                  <div key={String(f.key)}>
                    <label className="block font-mono text-[11px] text-muted mb-1">{f.label} (one per line)</label>
                    <textarea
                      className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm text-bone min-h-[90px]"
                      value={value}
                      onChange={(e) => update(i, f.key, e.target.value.split("\n"))}
                    />
                  </div>
                );
              }
              return (
                <div key={String(f.key)}>
                  <label className="block font-mono text-[11px] text-muted mb-1">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm text-bone min-h-[70px]"
                      value={(raw as string) ?? ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                    />
                  ) : (
                    <input
                      className="w-full bg-raised border border-border rounded-sm px-3 py-2 text-sm text-bone"
                      value={(raw as string) ?? ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {items.length === 0 && <p className="text-muted text-sm">Nothing yet — click + Add.</p>}
      </div>
    </div>
  );
}

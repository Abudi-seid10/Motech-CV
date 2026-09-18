import { useState } from "react";
import { CustomSection } from "@/lib/types";
import { makeId } from "@/lib/id";
import ArrayEditor from "./ArrayEditor";

export default function CustomSectionsEditor({
  sections,
  onChange,
}: {
  sections: CustomSection[];
  onChange: (sections: CustomSection[]) => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  function addSection() {
    const title = newTitle.trim();
    if (!title) return;
    onChange([...sections, { id: makeId(), title, entries: [] }]);
    setNewTitle("");
  }

  function updateSection(i: number, patch: Partial<CustomSection>) {
    const next = sections.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }

  function removeSection(i: number) {
    onChange(sections.filter((_, idx) => idx !== i));
  }

  function moveSection(i: number, dir: -1 | 1) {
    const target = i + dir;
    if (target < 0 || target >= sections.length) return;
    const next = sections.slice();
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  return (
    <section>
      <h2 className="eyebrow mb-1">Custom Sections</h2>
      <p className="text-muted text-xs mb-4">
        Add anything the built-in fields don't cover — Projects, Recommendations, Publications,
        Volunteer Work, anything. Each becomes its own section on your CV and PDF.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          placeholder="New section title (e.g. Projects)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSection())}
          className="flex-1 bg-raised border border-border rounded-sm px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addSection}
          className="border border-gold/50 px-4 py-2 font-mono text-xs uppercase tracking-widest2 text-gold-soft hover:bg-gold hover:text-ink transition-colors shrink-0"
        >
          + Add
        </button>
      </div>

      <div className="space-y-8">
        {sections.map((s, i) => (
          <div key={s.id} className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                value={s.title}
                onChange={(e) => updateSection(i, { title: e.target.value })}
                className="flex-1 font-display text-lg tracking-wide bg-transparent border-b border-border focus:border-gold/50 outline-none px-1 py-1"
              />
              <div className="flex gap-3 font-mono text-[11px] text-muted shrink-0">
                <button type="button" onClick={() => moveSection(i, -1)} className="hover:text-gold">↑</button>
                <button type="button" onClick={() => moveSection(i, 1)} className="hover:text-gold">↓</button>
                <button type="button" onClick={() => removeSection(i)} className="hover:text-red-400">remove section</button>
              </div>
            </div>

            <ArrayEditor
              label={`${s.title || "Section"} entries`}
              items={s.entries}
              onChange={(entries) => updateSection(i, { entries })}
              fields={[
                { key: "heading", label: "Heading (e.g. project name, recommender's name)" },
                { key: "subheading", label: "Subheading (e.g. role, company, tech stack)" },
                { key: "meta", label: "Meta (date, year — shown at right)" },
                { key: "body", label: "Description / quote", type: "textarea" },
                { key: "bullets", label: "Highlights", type: "list" },
              ]}
              emptyItem={{ heading: "", subheading: "", meta: "", body: "", bullets: [] }}
            />
          </div>
        ))}
        {sections.length === 0 && (
          <p className="text-muted text-sm">No custom sections yet.</p>
        )}
      </div>
    </section>
  );
}

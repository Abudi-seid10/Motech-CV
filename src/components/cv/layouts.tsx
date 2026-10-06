import { ReactNode } from "react";
import { CVData, Personal } from "@/lib/types";
import DownloadButton from "@/components/DownloadButton";

/**
 * Alternative CV formats (classic / profile / teal / navy). Each one is a
 * self-contained "paper sheet" with its own fixed palette — they ignore the
 * color theme, which only styles the Editorial layout.
 */

type Props = { data: CVData; filename?: string };

export const bare = (u: string) => u.replace(/^https?:\/\//, "");

export function Icon({ d, className = "w-4 h-4" }: { d: string[]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {d.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}
export const ICONS = {
  phone: ["M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"],
  mail: ["M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", "M22 6l-10 7L2 6"],
  pin: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"],
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
};

export function contacts(p: Personal) {
  return [
    p.phone && { icon: ICONS.phone, text: p.phone },
    p.email && { icon: ICONS.mail, text: p.email },
    p.location && { icon: ICONS.pin, text: p.location },
    p.linkedin && { icon: ICONS.link, text: bare(p.linkedin) },
    p.github && { icon: ICONS.link, text: bare(p.github) },
  ].filter(Boolean) as { icon: string[]; text: string }[];
}

export const skillItems = (d: CVData) => d.competencies.flatMap((g) => g.items).filter(Boolean);

export function Photo({ src, className }: { src?: string; className: string }) {
  if (!src) return <div className={`${className} bg-neutral-300`} aria-hidden />;
  return <img src={src} alt="" className={`${className} object-cover`} />;
}

export function Dot({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={`list-disc pl-5 space-y-1 ${className ?? ""}`}>
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

export function Download({ data, filename, className }: Props & { className: string }) {
  return (
    <div className="mt-8 print:hidden">
      <DownloadButton data={data} filename={filename} className={className} />
    </div>
  );
}

/** Gray stage + white paper, shared by all alternative layouts. */
export function Stage({ children }: { children: ReactNode }) {
  return <div className="bg-neutral-200 py-6 sm:py-10 px-2 sm:px-6">{children}</div>;
}

export const customWith = (d: CVData, render: (title: string, body: ReactNode, key: string) => ReactNode) =>
  d.customSections
    .filter((s) => s.entries.length > 0)
    .map((s) =>
      render(
        s.title,
        s.entries.map((e, i) => (
          <div key={i} className="mb-4">
            <p className="font-bold">
              {e.heading}
              {e.subheading ? ` — ${e.subheading}` : ""}
              {e.meta ? <span className="font-normal opacity-60"> | {e.meta}</span> : null}
            </p>
            {e.body && <p className="leading-relaxed">{e.body}</p>}
            <Dot items={e.bullets ?? []} />
          </div>
        )),
        s.id
      )
    );

export const certLines = (d: CVData) =>
  d.certifications.map((c, i) => (
    <p key={i}>
      <b>{c.name}</b>
      {c.issuer && ` — ${c.issuer}`}
      {c.year && ` (${c.year})`}
    </p>
  ));

export const awardLines = (d: CVData) =>
  d.awards.map((a, i) => (
    <p key={i}>
      <b>{a.name}</b>
      {a.issuer && ` — ${a.issuer}`}
      {a.year && ` (${a.year})`}
      {a.project && ` — ${a.project}`}
    </p>
  ));

/* ------------------------------------------------------------------ */
/* Classic                                                             */
/* ------------------------------------------------------------------ */

export function ClassicLayout({ data, filename }: Props) {
  const p = data.personal;
  const Sec = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="py-6 border-b border-neutral-800 last:border-b-0">
      <h2 className="font-extrabold uppercase tracking-[0.18em] text-lg mb-3">{title}</h2>
      {children}
    </section>
  );
  const skills = skillItems(data);
  return (
    <Stage>
      <div className="mx-auto max-w-[820px] bg-white text-neutral-800 shadow-lg px-6 sm:px-14 py-10 sm:py-14 text-[15px] leading-relaxed">
        <header className="text-center">
          <h1 className="font-extrabold uppercase tracking-wide text-3xl sm:text-5xl text-neutral-900">{p.name || "Your Name"}</h1>
          {p.title && <p className="text-lg sm:text-xl mt-1 tracking-wide">{p.title}</p>}
          <div className="mt-5 pb-3 border-b border-neutral-800 flex flex-wrap justify-between gap-x-6 gap-y-2 text-sm text-neutral-600">
            {contacts(p).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <Icon d={c.icon} className="w-3.5 h-3.5 text-neutral-800" />
                {c.text}
              </span>
            ))}
          </div>
        </header>

        {data.summary && (
          <Sec title="About me">
            <p>{data.summary}</p>
          </Sec>
        )}
        {data.education.length > 0 && (
          <Sec title="Education">
            {data.education.map((e, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="text-neutral-500">
                  {e.school}
                  {e.dates && ` | ${e.dates}`}
                </p>
                <p className="font-bold">{e.degree}</p>
                {e.details && <p>{e.details}</p>}
              </div>
            ))}
          </Sec>
        )}
        {data.experience.length > 0 && (
          <Sec title="Work Experience">
            {data.experience.map((e, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <p className="text-neutral-500">
                  {e.company}
                  {e.dates && ` | ${e.dates}`}
                  {e.location && ` | ${e.location}`}
                </p>
                <p className="font-bold">{e.role}</p>
                <Dot items={e.bullets} />
              </div>
            ))}
          </Sec>
        )}
        {skills.length > 0 && (
          <Sec title="Skills">
            <ul className="list-disc pl-5 grid sm:grid-cols-3 gap-x-6 gap-y-1">
              {skills.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </Sec>
        )}
        {data.certifications.length > 0 && <Sec title="Certifications">{certLines(data)}</Sec>}
        {data.awards.length > 0 && <Sec title="Awards">{awardLines(data)}</Sec>}
        {(data.languages.length > 0 || data.strengths.length > 0) && (
          <Sec title="Languages & Strengths">
            {data.languages.length > 0 && <p>{data.languages.map((l) => `${l.name} (${l.level})`).join(" • ")}</p>}
            {data.strengths.length > 0 && <p className="text-neutral-600">{data.strengths.join(" • ")}</p>}
          </Sec>
        )}
        {customWith(data, (title, body, key) => (
          <Sec key={key} title={title}>
            {body}
          </Sec>
        ))}

        <Download
          data={data}
          filename={filename}
          className="rounded border border-neutral-800 px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors disabled:opacity-50"
        />
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Profile (photo + personal data left, content right)                 */
/* ------------------------------------------------------------------ */

export function ProfileLayout({ data, filename }: Props) {
  const p = data.personal;
  const Side = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="mt-8">
      <h3 className="font-semibold text-lg text-neutral-900 mb-3">{title}</h3>
      {children}
    </div>
  );
  const Sec = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="py-6 border-b border-neutral-200 first:pt-0 last:border-b-0">
      <h2 className="font-semibold text-xl text-neutral-900 mb-3">{title}</h2>
      {children}
    </section>
  );
  const skills = skillItems(data);
  return (
    <Stage>
      <div className="mx-auto max-w-[1000px] bg-white text-neutral-800 shadow-lg px-6 sm:px-12 py-10 sm:py-14 text-[15px] leading-relaxed font-sans">
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900">{p.name || "Your Name"}</h1>
        {p.title && <h2 className="text-xl sm:text-2xl font-semibold mt-5 pb-5 border-b border-neutral-200">{p.title}</h2>}

        <div className="grid md:grid-cols-[250px_1fr] gap-10 mt-8">
          <aside>
            <Photo src={p.photo} className="w-48 h-48 md:w-full md:h-auto md:aspect-square rounded-full" />
            <Side title="Personal Data">
              <ul className="space-y-3 break-words">
                {contacts(p).map((c, i) => (
                  <li key={i}>{c.text}</li>
                ))}
              </ul>
            </Side>
            {skills.length > 0 && (
              <Side title="Skills">
                <Dot items={skills} />
              </Side>
            )}
            {data.languages.length > 0 && (
              <Side title="Languages">
                <Dot items={data.languages.map((l) => `${l.name} – ${l.level}`)} />
              </Side>
            )}
            {data.strengths.length > 0 && (
              <Side title="Strengths">
                <Dot items={data.strengths} />
              </Side>
            )}
          </aside>

          <div>
            {data.summary && (
              <Sec title="Summary">
                <p>{data.summary}</p>
              </Sec>
            )}
            {data.experience.length > 0 && (
              <Sec title="Professional Experience">
                {data.experience.map((e, i) => (
                  <div key={i} className="mb-5 last:mb-0">
                    <p className="font-bold">
                      {e.role}
                      {e.role && e.company && " - "}
                      {e.company}
                    </p>
                    <p className="font-bold">{e.dates}</p>
                    {e.location && <p className="text-neutral-500">{e.location}</p>}
                    <div className="mt-2">
                      <Dot items={e.bullets} />
                    </div>
                  </div>
                ))}
              </Sec>
            )}
            {data.education.length > 0 && (
              <Sec title="Education">
                {data.education.map((e, i) => (
                  <div key={i} className="mb-3 last:mb-0">
                    <p className="font-bold">
                      {e.degree}
                      {e.degree && e.school && " - "}
                      {e.school}
                    </p>
                    <p className="text-neutral-500">{e.dates}</p>
                    {e.details && <p>{e.details}</p>}
                  </div>
                ))}
              </Sec>
            )}
            {data.certifications.length > 0 && <Sec title="Certifications">{certLines(data)}</Sec>}
            {data.awards.length > 0 && <Sec title="Awards">{awardLines(data)}</Sec>}
            {customWith(data, (title, body, key) => (
              <Sec key={key} title={title}>
                {body}
              </Sec>
            ))}
            <Download
              data={data}
              filename={filename}
              className="rounded-md bg-neutral-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Teal Ribbon                                                         */
/* ------------------------------------------------------------------ */

const TEAL = "#1f3d4d";
const GOLD = "#b8914a";
const GOLD_GRADIENT = "linear-gradient(90deg,#a9803a,#e6c982 55%,#b8914a)";

export function TealLayout({ data, filename }: Props) {
  const p = data.personal;
  const [first, ...rest] = (p.name || "Your Name").split(" ");
  const SideHead = ({ children }: { children: ReactNode }) => (
    <h3
      className="rounded-full border-2 text-center text-white font-bold tracking-[0.3em] uppercase text-sm py-2 mb-4 mt-8"
      style={{ borderColor: GOLD }}
    >
      {children}
    </h3>
  );
  const MainHead = ({ children }: { children: ReactNode }) => (
    <h2
      className="rounded-full text-center text-white font-bold tracking-[0.3em] uppercase text-sm py-2 mb-5 mx-auto w-4/5"
      style={{ background: GOLD }}
    >
      {children}
    </h2>
  );
  const sq = "list-[square] pl-5 space-y-1";
  const skills = skillItems(data);
  return (
    <Stage>
      <div className="mx-auto max-w-[860px] bg-white text-neutral-800 shadow-lg overflow-hidden text-[14px] leading-relaxed">
        <header
          style={{ background: TEAL }}
          className="relative px-6 sm:px-10 pt-8 pb-12 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
        >
          <Photo src={p.photo} className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[3px] shrink-0 border-[#b8914a]" />
          <div className="text-center sm:text-left">
            <h1 className="font-extrabold uppercase tracking-[0.15em] text-3xl sm:text-4xl">
              <span style={{ color: GOLD }}>{first}</span> <span className="text-white">{rest.join(" ")}</span>
            </h1>
            {p.title && <p className="text-white font-semibold tracking-[0.2em] text-sm mt-1">{p.title}</p>}
            {data.summary && <p className="text-white/90 mt-3 text-[13px]">{data.summary}</p>}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-3" style={{ background: GOLD_GRADIENT }} />
        </header>

        <div className="grid md:grid-cols-[250px_1fr]">
          <aside style={{ background: TEAL }} className="text-white px-6 pb-10 pt-2">
            <ul className="space-y-5 mt-6 break-words">
              {contacts(p).map((c, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Icon d={c.icon} className="w-5 h-5 shrink-0" />
                  <span className="text-[13px]">{c.text}</span>
                </li>
              ))}
            </ul>
            {skills.length > 0 && (
              <>
                <SideHead>Skills</SideHead>
                <ul className={sq}>
                  {skills.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
            {data.languages.length > 0 && (
              <>
                <SideHead>Languages</SideHead>
                <ul className={sq}>
                  {data.languages.map((l, i) => (
                    <li key={i}>
                      {l.name} – {l.level}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {data.strengths.length > 0 && (
              <>
                <SideHead>Strengths</SideHead>
                <ul className={sq}>
                  {data.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
          </aside>

          <main className="px-6 sm:px-9 py-8 space-y-8">
            {data.experience.length > 0 && (
              <section>
                <MainHead>Experience</MainHead>
                {data.experience.map((e, i) => (
                  <div key={i} className="mb-6">
                    <p className="font-bold tracking-[0.15em] text-neutral-900">{e.role}</p>
                    <p className="mb-2">
                      {e.company}
                      {e.location && `, ${e.location}`}
                      {e.dates && ` | ${e.dates}`}
                    </p>
                    <ul className={sq}>
                      {e.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
            {data.education.length > 0 && (
              <section>
                <MainHead>Education</MainHead>
                {data.education.map((e, i) => (
                  <div key={i} className="mb-3">
                    <p>
                      <b>{e.degree}</b>
                      {e.dates && ` | ${e.dates}`}
                    </p>
                    <p>{e.school}</p>
                    {e.details && <p className="text-neutral-600">{e.details}</p>}
                  </div>
                ))}
              </section>
            )}
            {data.certifications.length > 0 && (
              <section>
                <MainHead>Certifications</MainHead>
                {certLines(data)}
              </section>
            )}
            {data.awards.length > 0 && (
              <section>
                <MainHead>Awards</MainHead>
                {awardLines(data)}
              </section>
            )}
            {customWith(data, (title, body, key) => (
              <section key={key}>
                <MainHead>{title}</MainHead>
                {body}
              </section>
            ))}
            <Download
              data={data}
              filename={filename}
              className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-[0.25em] text-white hover:opacity-80 transition-opacity disabled:opacity-50 bg-[#b8914a]"
            />
          </main>
        </div>
        <div className="h-3" style={{ background: GOLD_GRADIENT }} />
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Navy Timeline                                                       */
/* ------------------------------------------------------------------ */

const NAVY = "#12104a";
const NAVY_LIGHT = "#2b2a73";

export function NavyLayout({ data, filename }: Props) {
  const p = data.personal;
  const SideHead = ({ children }: { children: ReactNode }) => (
    <h3 className="font-extrabold uppercase text-lg mb-3 mt-8">{children}</h3>
  );
  const Head = ({ children }: { children: ReactNode }) => (
    <h2 className="font-extrabold uppercase tracking-wide text-lg text-neutral-900 mb-4">{children}</h2>
  );
  const Timeline = ({ children }: { children: ReactNode }) => (
    <div className="relative border-l-2 border-neutral-900 ml-[5px] pl-6 space-y-6">{children}</div>
  );
  const Node = ({ children }: { children: ReactNode }) => (
    <div className="relative">
      <span className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-neutral-900" />
      {children}
    </div>
  );
  const skills = skillItems(data);
  return (
    <Stage>
      <div className="mx-auto max-w-[860px] bg-white text-neutral-800 shadow-lg text-[14px] leading-relaxed grid md:grid-cols-[230px_1fr]">
        <aside style={{ background: NAVY }} className="text-white p-4 md:m-5 md:mr-0 md:self-start">
          <Photo src={p.photo} className="w-full aspect-[4/5]" />
          <div style={{ background: NAVY_LIGHT }} className="px-4 py-3">
            <p className="font-extrabold uppercase tracking-wide text-lg leading-tight">{p.name || "Your Name"}</p>
            {p.title && <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-90">{p.title}</p>}
          </div>
          <div className="px-2 pb-4">
            {skills.length > 0 && (
              <>
                <SideHead>Skills</SideHead>
                <Dot items={skills} />
              </>
            )}
            {data.strengths.length > 0 && (
              <>
                <SideHead>Strengths</SideHead>
                <Dot items={data.strengths} />
              </>
            )}
            {data.languages.length > 0 && (
              <>
                <SideHead>Language</SideHead>
                <Dot items={data.languages.map((l) => `${l.name} – ${l.level}`)} />
              </>
            )}
          </div>
        </aside>

        <main className="p-6 sm:p-8">
          <ul className="space-y-1 mb-4 break-words text-[13px]">
            <li className="font-extrabold uppercase text-sm">Contact me</li>
            {contacts(p).map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <Icon d={c.icon} className="w-3.5 h-3.5 shrink-0" />
                {c.text}
              </li>
            ))}
          </ul>
          {data.summary && (
            <div style={{ background: NAVY }} className="text-white px-4 py-3 mb-8 text-[13px]">
              <p className="font-extrabold uppercase mb-1">About me</p>
              <p>{data.summary}</p>
            </div>
          )}
          {data.experience.length > 0 && (
            <section className="mb-8">
              <Head>Work Experience</Head>
              <Timeline>
                {data.experience.map((e, i) => (
                  <Node key={i}>
                    <p className="font-bold uppercase text-neutral-900">{e.role}</p>
                    <p className="text-neutral-500 text-[13px]">
                      {e.company}
                      {e.location && `, ${e.location}`}
                      {e.dates && ` · ${e.dates}`}
                    </p>
                    <Dot items={e.bullets} className="mt-1 text-[13px]" />
                  </Node>
                ))}
              </Timeline>
            </section>
          )}
          {data.education.length > 0 && (
            <section className="mb-8">
              <Head>Education</Head>
              <Timeline>
                {data.education.map((e, i) => (
                  <Node key={i}>
                    <p className="font-bold uppercase text-neutral-900">
                      {e.school}
                      {e.dates && <span className="font-normal normal-case text-neutral-500"> · {e.dates}</span>}
                    </p>
                    <p className="text-neutral-600">{e.degree}</p>
                    {e.details && <p className="text-[13px]">{e.details}</p>}
                  </Node>
                ))}
              </Timeline>
            </section>
          )}
          {data.certifications.length > 0 && (
            <section className="mb-8">
              <Head>Certifications</Head>
              {certLines(data)}
            </section>
          )}
          {data.awards.length > 0 && (
            <section className="mb-8">
              <Head>Awards</Head>
              {awardLines(data)}
            </section>
          )}
          {customWith(data, (title, body, key) => (
            <section key={key} className="mb-8">
              <Head>{title}</Head>
              {body}
            </section>
          ))}
          <Download
            data={data}
            filename={filename}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:opacity-80 transition-opacity disabled:opacity-50 bg-[#12104a]"
          />
        </main>
      </div>
    </Stage>
  );
}

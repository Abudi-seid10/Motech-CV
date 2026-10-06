import { ReactNode } from "react";
import { CVData } from "@/lib/types";
import {
  Icon,
  contacts,
  skillItems,
  Photo,
  Dot,
  Download,
  Stage,
  customWith,
  certLines,
  awardLines,
} from "./layouts";

/**
 * More CV formats: modern (colour band), executive (serif, ruled label column)
 * and creative (photo header, two columns). Same contract as ./layouts —
 * self-contained paper sheets with fixed palettes.
 */

type Props = { data: CVData; filename?: string };
type SecProps = { title: string; children: ReactNode };

const langLine = (d: CVData) => d.languages.map((l) => `${l.name} (${l.level})`).join(" • ");

/** Experience / education entries, shared by the single-column layouts. */
function Experience({ data, metaClass }: { data: CVData; metaClass: string }) {
  return (
    <>
      {data.experience.map((e, i) => (
        <div key={i} className="mb-5 last:mb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="font-bold text-neutral-900">{e.role}</p>
            {e.dates && <p className={`text-sm ${metaClass}`}>{e.dates}</p>}
          </div>
          <p className={`text-sm ${metaClass}`}>
            {e.company}
            {e.location && ` · ${e.location}`}
          </p>
          <Dot items={e.bullets} className="mt-1.5" />
        </div>
      ))}
    </>
  );
}

function Education({ data, metaClass }: { data: CVData; metaClass: string }) {
  return (
    <>
      {data.education.map((e, i) => (
        <div key={i} className="mb-4 last:mb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="font-bold text-neutral-900">{e.degree}</p>
            {e.dates && <p className={`text-sm ${metaClass}`}>{e.dates}</p>}
          </div>
          <p className={`text-sm ${metaClass}`}>{e.school}</p>
          {e.details && <p>{e.details}</p>}
        </div>
      ))}
    </>
  );
}

/** Renders every section in order through a layout-specific heading wrapper. */
function Sections({ data, Sec, metaClass, skills }: { data: CVData; Sec: (p: SecProps) => ReactNode; metaClass: string; skills: ReactNode }) {
  const hasSkills = skillItems(data).length > 0;
  return (
    <>
      {data.summary && <Sec title="Profile"><p>{data.summary}</p></Sec>}
      {data.experience.length > 0 && <Sec title="Experience"><Experience data={data} metaClass={metaClass} /></Sec>}
      {data.education.length > 0 && <Sec title="Education"><Education data={data} metaClass={metaClass} /></Sec>}
      {hasSkills && <Sec title="Skills">{skills}</Sec>}
      {data.certifications.length > 0 && <Sec title="Certifications">{certLines(data)}</Sec>}
      {data.awards.length > 0 && <Sec title="Awards">{awardLines(data)}</Sec>}
      {(data.languages.length > 0 || data.strengths.length > 0) && (
        <Sec title="Languages & Strengths">
          {data.languages.length > 0 && <p>{langLine(data)}</p>}
          {data.strengths.length > 0 && <p className={metaClass}>{data.strengths.join(" • ")}</p>}
        </Sec>
      )}
      {customWith(data, (title, body, key) => (
        <Sec key={key} title={title}>{body}</Sec>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modern — indigo band, pill skills                                   */
/* ------------------------------------------------------------------ */

const INDIGO = "#4338ca";

export function ModernLayout({ data, filename }: Props) {
  const p = data.personal;
  const Sec = ({ title, children }: SecProps) => (
    <section className="mb-7">
      <h2 className="mb-3 flex items-center gap-3 text-sm font-extrabold uppercase tracking-[0.2em]" style={{ color: INDIGO }}>
        <span className="h-4 w-1 rounded-full" style={{ background: INDIGO }} />
        {title}
      </h2>
      <div className="pl-4 border-l border-neutral-200">{children}</div>
    </section>
  );
  return (
    <Stage>
      <div className="mx-auto max-w-[860px] overflow-hidden bg-white text-[15px] leading-relaxed text-neutral-700 shadow-lg">
        <header className="px-6 py-10 text-white sm:px-12" style={{ background: `linear-gradient(135deg, ${INDIGO}, #6d5cf0)` }}>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{p.name || "Your Name"}</h1>
          {p.title && <p className="mt-2 text-lg font-medium text-white/85 sm:text-xl">{p.title}</p>}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            {contacts(p).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                <Icon d={c.icon} className="h-3.5 w-3.5" />
                {c.text}
              </span>
            ))}
          </div>
        </header>
        <div className="px-6 py-10 sm:px-12">
          <Sections
            data={data}
            Sec={Sec}
            metaClass="text-neutral-500"
            skills={
              <div className="flex flex-wrap gap-2">
                {skillItems(data).map((sk, i) => (
                  <span key={i} className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: "#eceafd", color: INDIGO }}>
                    {sk}
                  </span>
                ))}
              </div>
            }
          />
          <Download
            data={data}
            filename={filename}
            className="rounded-full bg-[#4338ca] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          />
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Executive — serif, centred header, label column                     */
/* ------------------------------------------------------------------ */

const BURGUNDY = "#7a1f2b";

export function ExecutiveLayout({ data, filename }: Props) {
  const p = data.personal;
  const Sec = ({ title, children }: SecProps) => (
    <section className="grid gap-2 border-t border-neutral-300 py-6 md:grid-cols-[170px_1fr] md:gap-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: BURGUNDY }}>{title}</h2>
      <div>{children}</div>
    </section>
  );
  return (
    <Stage>
      <div
        className="mx-auto max-w-[860px] bg-white px-6 py-12 text-[15px] leading-relaxed text-neutral-800 shadow-lg sm:px-14 sm:py-16"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-normal uppercase tracking-[0.12em] text-neutral-900 sm:text-5xl">{p.name || "Your Name"}</h1>
          {p.title && <p className="mt-2 text-lg italic text-neutral-600">{p.title}</p>}
          <div className="mx-auto mt-5 h-[3px] w-24" style={{ background: BURGUNDY }} />
          <p className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-neutral-600">
            {contacts(p).map((c, i) => (
              <span key={i}>{c.text}</span>
            ))}
          </p>
        </header>
        <Sections
          data={data}
          Sec={Sec}
          metaClass="italic text-neutral-500"
          skills={
            <p>
              {skillItems(data).map((sk, i, a) => (
                <span key={i}>
                  {sk}
                  {i < a.length - 1 && <span style={{ color: BURGUNDY }}> ◆ </span>}
                </span>
              ))}
            </p>
          }
        />
        <Download
          data={data}
          filename={filename}
          className="border px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors hover:text-white disabled:opacity-50 hover:bg-[#7a1f2b] border-[#7a1f2b] text-[#7a1f2b]"
        />
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Creative — coral accent, photo header, two columns                  */
/* ------------------------------------------------------------------ */

const CORAL = "#e8604c";
const SLATE = "#1f2937";

export function CreativeLayout({ data, filename }: Props) {
  const p = data.personal;
  const SideHead = ({ children }: { children: string }) => (
    <h3 className="mb-2 mt-6 text-xs font-extrabold uppercase tracking-[0.2em] first:mt-0" style={{ color: CORAL }}>{children}</h3>
  );
  const MainHead = ({ children }: { children: string }) => (
    <h2 className="mb-3 inline-block rounded-full px-4 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-white" style={{ background: SLATE }}>{children}</h2>
  );
  const skills = skillItems(data);
  const custom = customWith(data, (title, body, key) => (
    <section key={key} className="mb-7">
      <MainHead>{title}</MainHead>
      {body}
    </section>
  ));
  return (
    <Stage>
      <div className="mx-auto max-w-[940px] overflow-hidden bg-white text-[15px] leading-relaxed text-neutral-700 shadow-lg">
        <header className="flex flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:px-10" style={{ background: SLATE }}>
          <Photo src={p.photo} className="h-32 w-32 shrink-0 rounded-full border-4 border-[#e8604c]" />
          <div className="text-center text-white sm:text-left">
            <h1 className="text-3xl font-extrabold sm:text-5xl">{p.name || "Your Name"}</h1>
            {p.title && <p className="mt-2 text-lg font-medium sm:text-xl" style={{ color: CORAL }}>{p.title}</p>}
          </div>
        </header>
        <div className="grid md:grid-cols-[1fr_270px]">
          <div className="order-2 px-6 py-8 sm:px-10 md:order-1">
            {data.summary && (
              <section className="mb-7">
                <MainHead>About</MainHead>
                <p>{data.summary}</p>
              </section>
            )}
            {data.experience.length > 0 && (
              <section className="mb-7">
                <MainHead>Experience</MainHead>
                <Experience data={data} metaClass="text-neutral-500" />
              </section>
            )}
            {data.education.length > 0 && (
              <section className="mb-7">
                <MainHead>Education</MainHead>
                <Education data={data} metaClass="text-neutral-500" />
              </section>
            )}
            {custom}
          </div>
          <aside className="order-1 bg-neutral-100 px-6 py-8 md:order-2">
            <SideHead>Contact</SideHead>
            <ul className="space-y-2 text-sm">
              {contacts(p).map((c, i) => (
                <li key={i} className="flex items-start gap-2 break-all">
                  <Icon d={c.icon} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {c.text}
                </li>
              ))}
            </ul>
            {skills.length > 0 && (
              <>
                <SideHead>Skills</SideHead>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((sk, i) => (
                    <span key={i} className="rounded bg-white px-2 py-1 text-xs font-medium" style={{ color: SLATE }}>{sk}</span>
                  ))}
                </div>
              </>
            )}
            {data.certifications.length > 0 && (
              <>
                <SideHead>Certifications</SideHead>
                <div className="space-y-1 text-sm">{certLines(data)}</div>
              </>
            )}
            {data.awards.length > 0 && (
              <>
                <SideHead>Awards</SideHead>
                <div className="space-y-1 text-sm">{awardLines(data)}</div>
              </>
            )}
            {data.languages.length > 0 && (
              <>
                <SideHead>Languages</SideHead>
                <p className="text-sm">{langLine(data)}</p>
              </>
            )}
            {data.strengths.length > 0 && (
              <>
                <SideHead>Strengths</SideHead>
                <p className="text-sm">{data.strengths.join(" • ")}</p>
              </>
            )}
          </aside>
        </div>
        <div className="px-6 pb-8 sm:px-10">
          <Download
            data={data}
            filename={filename}
            className="rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50 bg-[#e8604c]"
          />
        </div>
      </div>
    </Stage>
  );
}

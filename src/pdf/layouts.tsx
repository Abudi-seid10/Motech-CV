import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { ReactNode } from "react";
import { CVData } from "@/lib/types";

/**
 * PDF counterparts of the alternative web layouts (classic / profile / teal /
 * navy). Sidebar layouts use the same trick: a `fixed` full-height background
 * strip repeats on every page, while the sidebar's *content* is absolutely
 * positioned and so only appears on page 1; the main column flows with the
 * page's left padding, so later pages simply continue in the right column.
 * Built-in Helvetica only (no font fetching), real selectable text.
 */

const TEXT = "#26262b";
const MUTED = "#6b6b73";

const bare = (u: string) => u.replace(/^https?:\/\//, "");
const skillItems = (d: CVData) => d.competencies.flatMap((g) => g.items).filter(Boolean);
const contactLines = (d: CVData) =>
  [d.personal.phone, d.personal.email, d.personal.location, d.personal.linkedin && bare(d.personal.linkedin), d.personal.github && bare(d.personal.github)].filter(
    Boolean
  ) as string[];

const s = StyleSheet.create({
  body: { fontSize: 9.5, lineHeight: 1.45 },
  bold: { fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row" },
  bulletRow: { flexDirection: "row", marginTop: 2 },
  bulletDot: { width: 10, fontSize: 9.5 },
  bulletText: { flex: 1, fontSize: 9.5, lineHeight: 1.4 },
});

function Bullets({ items, color, glyph = "•" }: { items?: string[]; color?: string; glyph?: string }) {
  if (!items?.length) return null;
  return (
    <View>
      {items.map((b, i) => (
        <View key={i} style={s.bulletRow} wrap={false}>
          <Text style={[s.bulletDot, { color }]}>{glyph}</Text>
          <Text style={[s.bulletText, { color }]}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function Doc({ data, children }: { data: CVData; children: ReactNode }) {
  const { personal } = data;
  return (
    <Document title={personal.name ? `${personal.name} — CV` : "CV"} author={personal.name || undefined}>
      {children}
    </Document>
  );
}

/** Shared "lesser" sections: certifications, awards, custom — styled by each layout's heading. */
function ExtraSections({ data, Head }: { data: CVData; Head: (p: { children: string }) => JSX.Element }) {
  return (
    <>
      {data.certifications.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Head>Certifications</Head>
          {data.certifications.map((c, i) => (
            <Text key={i} style={[s.body, { marginBottom: 2 }]}>
              <Text style={s.bold}>{c.name}</Text>
              {c.issuer ? ` — ${c.issuer}` : ""}
              {c.year ? ` (${c.year})` : ""}
            </Text>
          ))}
        </View>
      )}
      {data.awards.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Head>Awards</Head>
          {data.awards.map((a, i) => (
            <Text key={i} style={[s.body, { marginBottom: 2 }]}>
              <Text style={s.bold}>{a.name}</Text>
              {a.issuer ? ` — ${a.issuer}` : ""}
              {a.year ? ` (${a.year})` : ""}
              {a.project ? ` — ${a.project}` : ""}
            </Text>
          ))}
        </View>
      )}
      {data.customSections
        .filter((sec) => sec.entries.length > 0)
        .map((sec) => (
          <View key={sec.id} style={{ marginTop: 14 }}>
            <Head>{sec.title}</Head>
            {sec.entries.map((e, i) => (
              <View key={i} style={{ marginBottom: 7 }} wrap={false}>
                <Text style={[s.body, s.bold]}>
                  {e.heading}
                  {e.subheading ? ` — ${e.subheading}` : ""}
                  {e.meta ? `  |  ${e.meta}` : ""}
                </Text>
                {e.body ? <Text style={s.body}>{e.body}</Text> : null}
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Classic                                                             */
/* ------------------------------------------------------------------ */

export function ClassicDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const c = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, color: TEXT, padding: 46 },
    name: { fontSize: 26, fontFamily: "Helvetica-Bold", textAlign: "center", letterSpacing: 1.5, textTransform: "uppercase" },
    title: { fontSize: 13, textAlign: "center", marginTop: 3 },
    contact: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#222", fontSize: 8.5, color: MUTED },
    sec: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#222" },
    head: { fontSize: 11.5, fontFamily: "Helvetica-Bold", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
    meta: { color: MUTED },
  });
  const Sec = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={c.sec}>
      <Text style={c.head} minPresenceAhead={50}>{title}</Text>
      {children}
    </View>
  );
  const skills = skillItems(data);
  const lines = contactLines(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <Text style={c.name}>{p.name || "Your Name"}</Text>
        {p.title ? <Text style={c.title}>{p.title}</Text> : null}
        {lines.length > 0 && (
          <View style={c.contact}>
            {lines.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>
        )}
        {data.summary ? (
          <Sec title="About me">
            <Text style={s.body}>{data.summary}</Text>
          </Sec>
        ) : null}
        {data.education.length > 0 && (
          <Sec title="Education">
            {data.education.map((e, i) => (
              <View key={i} style={{ marginBottom: 7 }} wrap={false}>
                <Text style={[s.body, c.meta]}>
                  {e.school}
                  {e.dates ? ` | ${e.dates}` : ""}
                </Text>
                <Text style={[s.body, s.bold]}>{e.degree}</Text>
                {e.details ? <Text style={s.body}>{e.details}</Text> : null}
              </View>
            ))}
          </Sec>
        )}
        {data.experience.length > 0 && (
          <Sec title="Work Experience">
            {data.experience.map((e, i) => (
              <View key={i} style={{ marginBottom: 8 }} wrap={false}>
                <Text style={[s.body, c.meta]}>
                  {e.company}
                  {e.dates ? ` | ${e.dates}` : ""}
                  {e.location ? ` | ${e.location}` : ""}
                </Text>
                <Text style={[s.body, s.bold]}>{e.role}</Text>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </Sec>
        )}
        {skills.length > 0 && (
          <Sec title="Skills">
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {skills.map((sk, i) => (
                <View key={i} style={[s.bulletRow, { width: "33%" }]}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{sk}</Text>
                </View>
              ))}
            </View>
          </Sec>
        )}
        {data.languages.length > 0 || data.strengths.length > 0 ? (
          <Sec title="Languages & Strengths">
            {data.languages.length > 0 && <Text style={s.body}>{data.languages.map((l) => `${l.name} (${l.level})`).join("  •  ")}</Text>}
            {data.strengths.length > 0 && <Text style={[s.body, c.meta]}>{data.strengths.join("  •  ")}</Text>}
          </Sec>
        ) : null}
        <ExtraSections data={data} Head={({ children }) => <Text style={c.head} minPresenceAhead={50}>{children}</Text>} />
      </Page>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export function ProfileDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const M = 40;
  const LW = 150;
  const TOP = 40;
  const HEADER_H = 78;
  const c = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, color: TEXT, paddingTop: TOP, paddingBottom: 40, paddingLeft: M + LW + 26, paddingRight: M },
    header: { position: "absolute", top: TOP, left: M, right: M, height: HEADER_H, borderBottomWidth: 1, borderBottomColor: "#d8d8dc" },
    name: { fontSize: 24, fontFamily: "Helvetica-Bold" },
    title: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 8 },
    side: { position: "absolute", top: TOP + HEADER_H + 18, left: M, width: LW },
    photo: { width: LW, height: LW, borderRadius: LW / 2, objectFit: "cover" },
    sideHead: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 18, marginBottom: 6 },
    head: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 },
    sec: { paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#e4e4e8" },
  });
  const Head = ({ children }: { children: string }) => <Text style={c.head} minPresenceAhead={50}>{children}</Text>;
  const skills = skillItems(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <View style={c.header}>
          <Text style={c.name}>{p.name || "Your Name"}</Text>
          {p.title ? <Text style={c.title}>{p.title}</Text> : null}
        </View>
        <View style={c.side}>
          {p.photo ? <Image src={p.photo} style={c.photo} /> : null}
          <Text style={c.sideHead}>Personal Data</Text>
          {contactLines(data).map((l, i) => (
            <Text key={i} style={[s.body, { marginBottom: 5 }]}>
              {l}
            </Text>
          ))}
          {skills.length > 0 && (
            <>
              <Text style={c.sideHead}>Skills</Text>
              <Bullets items={skills} />
            </>
          )}
          {data.languages.length > 0 && (
            <>
              <Text style={c.sideHead}>Languages</Text>
              <Bullets items={data.languages.map((l) => `${l.name} – ${l.level}`)} />
            </>
          )}
          {data.strengths.length > 0 && (
            <>
              <Text style={c.sideHead}>Strengths</Text>
              <Bullets items={data.strengths} />
            </>
          )}
        </View>

        {/* Pushes the flowing column below the absolute header on page 1 only. */}
        <View style={{ height: HEADER_H + 18 }} />
        {data.summary ? (
          <View style={c.sec}>
            <Head>Summary</Head>
            <Text style={s.body}>{data.summary}</Text>
          </View>
        ) : null}
        {data.experience.length > 0 && (
          <View style={c.sec}>
            <Head>Professional Experience</Head>
            {data.experience.map((e, i) => (
              <View key={i} style={{ marginBottom: 9 }} wrap={false}>
                <Text style={[s.body, s.bold]}>
                  {e.role}
                  {e.role && e.company ? " - " : ""}
                  {e.company}
                </Text>
                <Text style={[s.body, s.bold]}>{e.dates}</Text>
                {e.location ? <Text style={[s.body, { color: MUTED }]}>{e.location}</Text> : null}
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}
        {data.education.length > 0 && (
          <View style={c.sec}>
            <Head>Education</Head>
            {data.education.map((e, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={[s.body, s.bold]}>
                  {e.degree}
                  {e.degree && e.school ? " - " : ""}
                  {e.school}
                </Text>
                <Text style={[s.body, { color: MUTED }]}>{e.dates}</Text>
                {e.details ? <Text style={s.body}>{e.details}</Text> : null}
              </View>
            ))}
          </View>
        )}
        <ExtraSections data={data} Head={Head} />
      </Page>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Teal Ribbon                                                         */
/* ------------------------------------------------------------------ */

const TEAL = "#1f3d4d";
const GOLD = "#b8914a";

export function TealDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const SW = 172;
  const HEADER_H = 168;
  const PT = 34;
  const [first, ...rest] = (p.name || "Your Name").split(" ");
  // The header has a fixed height, so keep a very long summary from overflowing
  // it — the full text then moves into a "Profile" section in the main column.
  const SUMMARY_MAX = 360;
  const headerSummary = data.summary.length > SUMMARY_MAX ? data.summary.slice(0, SUMMARY_MAX).trimEnd() + "…" : data.summary;
  const c = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, color: TEXT, paddingTop: PT, paddingBottom: 34, paddingLeft: SW + 24, paddingRight: 30 },
    sideBg: { position: "absolute", top: 0, bottom: 0, left: 0, width: SW, backgroundColor: TEAL },
    header: { position: "absolute", top: 0, left: 0, right: 0, height: HEADER_H, backgroundColor: TEAL, flexDirection: "row", paddingTop: 26, paddingLeft: 26, paddingRight: 26 },
    ribbon: { position: "absolute", left: 0, right: 0, bottom: 0, height: 8, backgroundColor: GOLD },
    photo: { width: 100, height: 100, borderRadius: 50, borderWidth: 2.5, borderColor: GOLD, objectFit: "cover" },
    headText: { flex: 1, marginLeft: 18 },
    name: { fontSize: 24, fontFamily: "Helvetica-Bold", letterSpacing: 2, textTransform: "uppercase" },
    jobTitle: { fontSize: 9.5, color: "#fff", fontFamily: "Helvetica-Bold", letterSpacing: 1.5, marginTop: 3 },
    headSummary: { fontSize: 8.5, color: "#e8eef2", lineHeight: 1.45, marginTop: 8 },
    side: { position: "absolute", top: HEADER_H + 20, left: 0, width: SW, paddingHorizontal: 18 },
    sidePill: { borderWidth: 1.5, borderColor: GOLD, borderRadius: 14, paddingVertical: 5, marginTop: 20, marginBottom: 9 },
    sidePillText: { color: "#fff", fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 2.5, textAlign: "center", textTransform: "uppercase" },
    sideText: { color: "#fff", fontSize: 8.5, marginBottom: 6 },
    pill: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 5, marginBottom: 10, marginHorizontal: 30 },
    pillText: { color: "#fff", fontSize: 9, fontFamily: "Helvetica-Bold", letterSpacing: 2.5, textAlign: "center", textTransform: "uppercase" },
    footer: { position: "absolute", left: 0, right: 0, bottom: 0, height: 8, backgroundColor: GOLD },
  });
  const Head = ({ children }: { children: string }) => (
    <View style={c.pill} minPresenceAhead={50}>
      <Text style={c.pillText}>{children}</Text>
    </View>
  );
  const SideHead = ({ children }: { children: string }) => (
    <View style={c.sidePill}>
      <Text style={c.sidePillText}>{children}</Text>
    </View>
  );
  const skills = skillItems(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <View fixed style={c.sideBg} />
        <View fixed style={c.footer} />
        <View style={c.header}>
          {p.photo ? <Image src={p.photo} style={c.photo} /> : null}
          <View style={c.headText}>
            <Text style={c.name}>
              <Text style={{ color: GOLD }}>{first} </Text>
              <Text style={{ color: "#fff" }}>{rest.join(" ")}</Text>
            </Text>
            {p.title ? <Text style={c.jobTitle}>{p.title}</Text> : null}
            {headerSummary ? <Text style={c.headSummary}>{headerSummary}</Text> : null}
          </View>
          <View style={c.ribbon} />
        </View>

        <View style={c.side}>
          {contactLines(data).map((l, i) => (
            <Text key={i} style={[c.sideText, { marginBottom: 9 }]}>
              {l}
            </Text>
          ))}
          {skills.length > 0 && (
            <>
              <SideHead>Skills</SideHead>
              <Bullets items={skills} color="#fff" />
            </>
          )}
          {data.languages.length > 0 && (
            <>
              <SideHead>Languages</SideHead>
              <Bullets items={data.languages.map((l) => `${l.name} – ${l.level}`)} color="#fff" />
            </>
          )}
          {data.strengths.length > 0 && (
            <>
              <SideHead>Strengths</SideHead>
              <Bullets items={data.strengths} color="#fff" />
            </>
          )}
        </View>

        <View style={{ height: HEADER_H + 20 - PT }} />
        {data.summary.length > SUMMARY_MAX && (
          <View style={{ marginBottom: 14 }}>
            <Head>Profile</Head>
            <Text style={s.body}>{data.summary}</Text>
          </View>
        )}
        {data.experience.length > 0 && (
          <View>
            <Head>Experience</Head>
            {data.experience.map((e, i) => (
              <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                <Text style={[s.body, s.bold, { letterSpacing: 1 }]}>{e.role}</Text>
                <Text style={s.body}>
                  {e.company}
                  {e.location ? `, ${e.location}` : ""}
                  {e.dates ? ` | ${e.dates}` : ""}
                </Text>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}
        {data.education.length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Head>Education</Head>
            {data.education.map((e, i) => (
              <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                <Text style={s.body}>
                  <Text style={s.bold}>{e.degree}</Text>
                  {e.dates ? ` | ${e.dates}` : ""}
                </Text>
                <Text style={s.body}>{e.school}</Text>
                {e.details ? <Text style={[s.body, { color: MUTED }]}>{e.details}</Text> : null}
              </View>
            ))}
          </View>
        )}
        <ExtraSections data={data} Head={Head} />
      </Page>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Navy Timeline                                                       */
/* ------------------------------------------------------------------ */

const NAVY = "#12104a";
const NAVY_LIGHT = "#2b2a73";

export function NavyDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const SW = 168;
  const c = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, color: TEXT, paddingTop: 36, paddingBottom: 36, paddingLeft: SW + 26, paddingRight: 32 },
    sideBg: { position: "absolute", top: 18, bottom: 18, left: 18, width: SW - 18, backgroundColor: NAVY },
    side: { position: "absolute", top: 18, left: 18, width: SW - 18 },
    photo: { width: SW - 18, height: 150, objectFit: "cover" },
    nameBox: { backgroundColor: NAVY_LIGHT, paddingVertical: 9, paddingHorizontal: 12 },
    name: { color: "#fff", fontSize: 14, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
    jobTitle: { color: "#fff", fontSize: 7, fontFamily: "Helvetica-Bold", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3 },
    sideHead: { color: "#fff", fontSize: 11, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginTop: 16, marginBottom: 6 },
    head: { fontSize: 12, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    banner: { backgroundColor: NAVY, padding: 10, marginBottom: 16 },
    tl: { borderLeftWidth: 1.5, borderLeftColor: "#111", marginLeft: 4, paddingLeft: 14, paddingBottom: 10 },
    dot: { position: "absolute", left: -5.5, top: 2, width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#111" },
  });
  const Head = ({ children }: { children: string }) => <Text style={c.head} minPresenceAhead={50}>{children}</Text>;
  const skills = skillItems(data);
  const lines = contactLines(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <View fixed style={c.sideBg} />
        <View style={c.side}>
          {p.photo ? <Image src={p.photo} style={c.photo} /> : null}
          <View style={c.nameBox}>
            <Text style={c.name}>{p.name || "Your Name"}</Text>
            {p.title ? <Text style={c.jobTitle}>{p.title}</Text> : null}
          </View>
          <View style={{ paddingHorizontal: 12 }}>
            {skills.length > 0 && (
              <>
                <Text style={c.sideHead}>Skills</Text>
                <Bullets items={skills} color="#fff" />
              </>
            )}
            {data.strengths.length > 0 && (
              <>
                <Text style={c.sideHead}>Strengths</Text>
                <Bullets items={data.strengths} color="#fff" />
              </>
            )}
            {data.languages.length > 0 && (
              <>
                <Text style={c.sideHead}>Language</Text>
                <Bullets items={data.languages.map((l) => `${l.name} – ${l.level}`)} color="#fff" />
              </>
            )}
          </View>
        </View>

        {lines.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={[s.body, s.bold, { textTransform: "uppercase" }]}>Contact me</Text>
            {lines.map((l, i) => (
              <Text key={i} style={[s.body, { fontSize: 9 }]}>
                {l}
              </Text>
            ))}
          </View>
        )}
        {data.summary ? (
          <View style={c.banner}>
            <Text style={{ color: "#fff", fontSize: 10, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 3 }}>About me</Text>
            <Text style={[s.body, { color: "#fff", fontSize: 9 }]}>{data.summary}</Text>
          </View>
        ) : null}
        {data.experience.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Head>Work Experience</Head>
            {data.experience.map((e, i) => (
              <View key={i} style={c.tl} wrap={false}>
                <View style={c.dot} />
                <Text style={[s.body, s.bold, { textTransform: "uppercase" }]}>{e.role}</Text>
                <Text style={[s.body, { color: MUTED, fontSize: 9 }]}>
                  {e.company}
                  {e.location ? `, ${e.location}` : ""}
                  {e.dates ? ` · ${e.dates}` : ""}
                </Text>
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        )}
        {data.education.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Head>Education</Head>
            {data.education.map((e, i) => (
              <View key={i} style={c.tl} wrap={false}>
                <View style={c.dot} />
                <Text style={[s.body, s.bold, { textTransform: "uppercase" }]}>
                  {e.school}
                  <Text style={{ fontFamily: "Helvetica", textTransform: "none", color: MUTED }}>{e.dates ? `  ·  ${e.dates}` : ""}</Text>
                </Text>
                <Text style={s.body}>{e.degree}</Text>
                {e.details ? <Text style={[s.body, { fontSize: 9 }]}>{e.details}</Text> : null}
              </View>
            ))}
          </View>
        )}
        <ExtraSections data={data} Head={Head} />
      </Page>
    </Doc>
  );
}

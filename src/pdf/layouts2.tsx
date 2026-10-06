import { Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { ReactNode } from "react";
import { CVData } from "@/lib/types";
import { TEXT, MUTED, s, skillItems, contactLines, Bullets, Doc, ExtraSections } from "./layouts";

/**
 * PDF counterparts of the modern / executive / creative web layouts.
 * Built-in fonts only (Helvetica, Times-Roman); real selectable text.
 */

const INDIGO = "#4338ca";
const BURGUNDY = "#7a1f2b";
const CORAL = "#e8604c";
const SLATE = "#1f2937";

const langLine = (d: CVData) => d.languages.map((l) => `${l.name} (${l.level})`).join("  •  ");

function ExperienceBlock({ data, font, boldFont }: { data: CVData; font?: string; boldFont?: string }) {
  const f = font ? { fontFamily: font } : {};
  const b = { fontFamily: boldFont ?? "Helvetica-Bold" };
  return (
    <>
      {data.experience.map((e, i) => (
        <View key={i} style={{ marginBottom: 9 }} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[s.body, b, { flex: 1 }]}>{e.role}</Text>
            {e.dates ? <Text style={[s.body, f, { color: MUTED }]}>{e.dates}</Text> : null}
          </View>
          <Text style={[s.body, f, { color: MUTED }]}>
            {e.company}
            {e.location ? ` · ${e.location}` : ""}
          </Text>
          <Bullets items={e.bullets} />
        </View>
      ))}
    </>
  );
}

function EducationBlock({ data, font, boldFont }: { data: CVData; font?: string; boldFont?: string }) {
  const f = font ? { fontFamily: font } : {};
  const b = { fontFamily: boldFont ?? "Helvetica-Bold" };
  return (
    <>
      {data.education.map((e, i) => (
        <View key={i} style={{ marginBottom: 7 }} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={[s.body, b, { flex: 1 }]}>{e.degree}</Text>
            {e.dates ? <Text style={[s.body, f, { color: MUTED }]}>{e.dates}</Text> : null}
          </View>
          <Text style={[s.body, f, { color: MUTED }]}>{e.school}</Text>
          {e.details ? <Text style={[s.body, f]}>{e.details}</Text> : null}
        </View>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modern                                                              */
/* ------------------------------------------------------------------ */

export function ModernDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const c = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, color: TEXT, paddingBottom: 40 },
    band: { backgroundColor: INDIGO, paddingHorizontal: 40, paddingVertical: 28, color: "#fff" },
    name: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#fff" },
    title: { fontSize: 13, marginTop: 4, color: "#e0dcff" },
    contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, fontSize: 8.5, color: "#fff" },
    body: { paddingHorizontal: 40, paddingTop: 22 },
    head: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: INDIGO, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 6 },
    sec: { marginBottom: 14 },
    pill: { backgroundColor: "#eceafd", color: INDIGO, fontSize: 8.5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginRight: 5, marginBottom: 5 },
  });
  const Head = ({ children }: { children: string }) => <Text style={c.head} minPresenceAhead={50}>{children}</Text>;
  const skills = skillItems(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <View style={c.band}>
          <Text style={c.name}>{p.name || "Your Name"}</Text>
          {p.title ? <Text style={c.title}>{p.title}</Text> : null}
          <View style={c.contact}>
            {contactLines(data).map((l, i) => (
              <Text key={i} style={{ marginRight: 14 }}>{l}</Text>
            ))}
          </View>
        </View>
        <View style={c.body}>
          {data.summary ? (
            <View style={c.sec}>
              <Head>Profile</Head>
              <Text style={s.body}>{data.summary}</Text>
            </View>
          ) : null}
          {data.experience.length > 0 && (
            <View style={c.sec}>
              <Head>Experience</Head>
              <ExperienceBlock data={data} />
            </View>
          )}
          {data.education.length > 0 && (
            <View style={c.sec}>
              <Head>Education</Head>
              <EducationBlock data={data} />
            </View>
          )}
          {skills.length > 0 && (
            <View style={c.sec}>
              <Head>Skills</Head>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {skills.map((sk, i) => (
                  <Text key={i} style={c.pill}>{sk}</Text>
                ))}
              </View>
            </View>
          )}
          {data.languages.length > 0 || data.strengths.length > 0 ? (
            <View style={c.sec}>
              <Head>Languages & Strengths</Head>
              {data.languages.length > 0 && <Text style={s.body}>{langLine(data)}</Text>}
              {data.strengths.length > 0 && <Text style={[s.body, { color: MUTED }]}>{data.strengths.join("  •  ")}</Text>}
            </View>
          ) : null}
          <ExtraSections data={data} Head={Head} />
        </View>
      </Page>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Executive                                                           */
/* ------------------------------------------------------------------ */

export function ExecutiveDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const SERIF = "Times-Roman";
  const SERIF_B = "Times-Bold";
  const c = StyleSheet.create({
    page: { fontFamily: SERIF, fontSize: 10.5, color: TEXT, padding: 46 },
    name: { fontSize: 25, textAlign: "center", letterSpacing: 2.5, textTransform: "uppercase", fontFamily: SERIF },
    title: { fontSize: 13, textAlign: "center", fontFamily: "Times-Italic", color: MUTED, marginTop: 4 },
    rule: { height: 2.5, width: 70, backgroundColor: BURGUNDY, alignSelf: "center", marginTop: 12, marginBottom: 10 },
    contact: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", fontSize: 9, color: MUTED, marginBottom: 14 },
    row: { flexDirection: "row", borderTopWidth: 0.75, borderTopColor: "#bbb", paddingVertical: 11 },
    label: { width: 120, fontSize: 8.5, fontFamily: SERIF_B, letterSpacing: 1.6, textTransform: "uppercase", color: BURGUNDY, paddingTop: 1 },
    content: { flex: 1 },
    body: { fontSize: 10.5, lineHeight: 1.45, fontFamily: SERIF },
  });
  const Row = ({ title, children }: { title: string; children: ReactNode }) => (
    <View style={c.row}>
      <Text style={c.label}>{title}</Text>
      <View style={c.content}>{children}</View>
    </View>
  );
  const skills = skillItems(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <Text style={c.name}>{p.name || "Your Name"}</Text>
        {p.title ? <Text style={c.title}>{p.title}</Text> : null}
        <View style={c.rule} />
        <View style={c.contact}>
          {contactLines(data).map((l, i) => (
            <Text key={i} style={{ marginHorizontal: 7 }}>{l}</Text>
          ))}
        </View>
        {data.summary ? (
          <Row title="Profile">
            <Text style={c.body}>{data.summary}</Text>
          </Row>
        ) : null}
        {data.experience.length > 0 && (
          <Row title="Experience">
            <ExperienceBlock data={data} font={SERIF} boldFont={SERIF_B} />
          </Row>
        )}
        {data.education.length > 0 && (
          <Row title="Education">
            <EducationBlock data={data} font={SERIF} boldFont={SERIF_B} />
          </Row>
        )}
        {skills.length > 0 && (
          <Row title="Skills">
            <Text style={c.body}>{skills.join("  |  ")}</Text>
          </Row>
        )}
        {data.certifications.length > 0 && (
          <Row title="Certifications">
            {data.certifications.map((x, i) => (
              <Text key={i} style={c.body}>
                <Text style={{ fontFamily: SERIF_B }}>{x.name}</Text>
                {x.issuer ? ` — ${x.issuer}` : ""}
                {x.year ? ` (${x.year})` : ""}
              </Text>
            ))}
          </Row>
        )}
        {data.awards.length > 0 && (
          <Row title="Awards">
            {data.awards.map((a, i) => (
              <Text key={i} style={c.body}>
                <Text style={{ fontFamily: SERIF_B }}>{a.name}</Text>
                {a.issuer ? ` — ${a.issuer}` : ""}
                {a.year ? ` (${a.year})` : ""}
                {a.project ? ` — ${a.project}` : ""}
              </Text>
            ))}
          </Row>
        )}
        {data.languages.length > 0 || data.strengths.length > 0 ? (
          <Row title="Languages">
            {data.languages.length > 0 && <Text style={c.body}>{langLine(data)}</Text>}
            {data.strengths.length > 0 && <Text style={[c.body, { color: MUTED }]}>{data.strengths.join("  •  ")}</Text>}
          </Row>
        ) : null}
        {data.customSections
          .filter((sec) => sec.entries.length > 0)
          .map((sec) => (
            <Row key={sec.id} title={sec.title}>
              {sec.entries.map((e, i) => (
                <View key={i} style={{ marginBottom: 6 }} wrap={false}>
                  <Text style={[c.body, { fontFamily: SERIF_B }]}>
                    {e.heading}
                    {e.subheading ? ` — ${e.subheading}` : ""}
                    {e.meta ? `  |  ${e.meta}` : ""}
                  </Text>
                  {e.body ? <Text style={c.body}>{e.body}</Text> : null}
                  <Bullets items={e.bullets} />
                </View>
              ))}
            </Row>
          ))}
      </Page>
    </Doc>
  );
}

/* ------------------------------------------------------------------ */
/* Creative                                                            */
/* ------------------------------------------------------------------ */

export function CreativeDocument({ data }: { data: CVData }) {
  const p = data.personal;
  const SIDE = 175;
  const c = StyleSheet.create({
    page: { fontFamily: "Helvetica", fontSize: 10, color: TEXT, paddingBottom: 36 },
    header: { backgroundColor: SLATE, flexDirection: "row", alignItems: "center", paddingHorizontal: 36, paddingVertical: 24 },
    photo: { width: 76, height: 76, borderRadius: 38, objectFit: "cover", borderWidth: 3, borderColor: CORAL, marginRight: 18 },
    name: { fontSize: 25, fontFamily: "Helvetica-Bold", color: "#fff" },
    title: { fontSize: 12.5, color: CORAL, marginTop: 4 },
    cols: { flexDirection: "row" },
    main: { flex: 1, paddingLeft: 36, paddingRight: 22, paddingTop: 20 },
    side: { width: SIDE, backgroundColor: "#f3f4f6", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
    mainHead: { alignSelf: "flex-start", backgroundColor: SLATE, color: "#fff", fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.6, textTransform: "uppercase", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9, marginBottom: 7 },
    sideHead: { fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 1.6, textTransform: "uppercase", color: CORAL, marginTop: 14, marginBottom: 5 },
    sec: { marginBottom: 14 },
    chip: { backgroundColor: "#fff", color: SLATE, fontSize: 8, paddingHorizontal: 5, paddingVertical: 2.5, borderRadius: 3, marginRight: 4, marginBottom: 4 },
  });
  const MainHead = ({ children }: { children: string }) => <Text style={c.mainHead} minPresenceAhead={50}>{children}</Text>;
  const SideHead = ({ children }: { children: string }) => <Text style={c.sideHead}>{children}</Text>;
  const skills = skillItems(data);
  return (
    <Doc data={data}>
      <Page size="A4" style={c.page} wrap>
        <View style={c.header} fixed={false}>
          {p.photo ? <Image src={p.photo} style={c.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={c.name}>{p.name || "Your Name"}</Text>
            {p.title ? <Text style={c.title}>{p.title}</Text> : null}
          </View>
        </View>
        <View style={c.cols}>
          <View style={c.main}>
            {data.summary ? (
              <View style={c.sec}>
                <MainHead>About</MainHead>
                <Text style={s.body}>{data.summary}</Text>
              </View>
            ) : null}
            {data.experience.length > 0 && (
              <View style={c.sec}>
                <MainHead>Experience</MainHead>
                <ExperienceBlock data={data} />
              </View>
            )}
            {data.education.length > 0 && (
              <View style={c.sec}>
                <MainHead>Education</MainHead>
                <EducationBlock data={data} />
              </View>
            )}
            {data.customSections
              .filter((sec) => sec.entries.length > 0)
              .map((sec) => (
                <View key={sec.id} style={c.sec}>
                  <MainHead>{sec.title}</MainHead>
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
          </View>
          <View style={c.side}>
            <SideHead>Contact</SideHead>
            {contactLines(data).map((l, i) => (
              <Text key={i} style={[s.body, { marginBottom: 3, fontSize: 9 }]}>{l}</Text>
            ))}
            {skills.length > 0 && (
              <>
                <SideHead>Skills</SideHead>
                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {skills.map((sk, i) => (
                    <Text key={i} style={c.chip}>{sk}</Text>
                  ))}
                </View>
              </>
            )}
            {data.certifications.length > 0 && (
              <>
                <SideHead>Certifications</SideHead>
                {data.certifications.map((x, i) => (
                  <Text key={i} style={[s.body, { fontSize: 9, marginBottom: 3 }]}>
                    <Text style={s.bold}>{x.name}</Text>
                    {x.issuer ? ` — ${x.issuer}` : ""}
                    {x.year ? ` (${x.year})` : ""}
                  </Text>
                ))}
              </>
            )}
            {data.awards.length > 0 && (
              <>
                <SideHead>Awards</SideHead>
                {data.awards.map((a, i) => (
                  <Text key={i} style={[s.body, { fontSize: 9, marginBottom: 3 }]}>
                    <Text style={s.bold}>{a.name}</Text>
                    {a.issuer ? ` — ${a.issuer}` : ""}
                    {a.year ? ` (${a.year})` : ""}
                  </Text>
                ))}
              </>
            )}
            {data.languages.length > 0 && (
              <>
                <SideHead>Languages</SideHead>
                <Text style={[s.body, { fontSize: 9 }]}>{langLine(data)}</Text>
              </>
            )}
            {data.strengths.length > 0 && (
              <>
                <SideHead>Strengths</SideHead>
                <Text style={[s.body, { fontSize: 9 }]}>{data.strengths.join("  •  ")}</Text>
              </>
            )}
          </View>
        </View>
      </Page>
    </Doc>
  );
}

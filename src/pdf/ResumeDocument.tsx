import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { CVData } from "@/lib/types";
import { layoutOf } from "@/themes";
import { ClassicDocument, ProfileDocument, TealDocument, NavyDocument } from "./layouts";

/**
 * Deliberately plain and theme-independent: this is what gets parsed by an
 * ATS and attached to job applications, so it favors readability and real
 * extractable text over the site's visual themes. Uses @react-pdf/renderer's
 * built-in Helvetica — no font registration, no network fetch at PDF-build
 * time, and Helvetica is about as universally ATS-safe as fonts get.
 *
 * Unlike the old html2canvas pipeline, this produces a genuine text layer
 * (selectable, copyable, machine-readable) and paginates via real document
 * flow — no manual page-break-point math needed. `wrap={false}` on an entry
 * keeps that one entry from being split across a page boundary; the engine
 * handles everything else.
 */

const COLOR_TEXT = "#17171a";
const COLOR_MUTED = "#5b5b63";
const COLOR_FAINT = "#7a7a82";
const COLOR_ACCENT = "#a6862a";
const COLOR_RULE = "#e4e1d8";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLOR_TEXT,
    paddingTop: 42,
    paddingBottom: 42,
    paddingHorizontal: 48,
  },
  name: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 11, color: COLOR_MUTED, marginTop: 2 },
  contactLine: { fontSize: 9, color: COLOR_FAINT, marginTop: 6 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: COLOR_ACCENT,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_RULE,
    paddingBottom: 3,
    marginBottom: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entry: { marginBottom: 9 },
  entryTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  entrySubtitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  entryMeta: { fontSize: 9, color: COLOR_FAINT },
  entrySub: { fontSize: 9, color: COLOR_FAINT, marginTop: 1 },
  body: { fontSize: 9.5, lineHeight: 1.4, marginTop: 2 },
  bulletRow: { flexDirection: "row", marginTop: 2 },
  bulletDot: { width: 10, fontSize: 9.5 },
  bulletText: { fontSize: 9.5, lineHeight: 1.35, flex: 1 },
  compLine: { fontSize: 9.5, lineHeight: 1.5, marginBottom: 2 },
  compLabel: { fontFamily: "Helvetica-Bold" },
});

function ContactLine({ personal }: { personal: CVData["personal"] }) {
  const parts = [personal.location, personal.phone, personal.email, personal.linkedin, personal.github].filter(
    Boolean
  );
  if (!parts.length) return null;
  return <Text style={styles.contactLine}>{parts.join("   •   ")}</Text>;
}

function Bullets({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View>
      {items.map((b, i) => (
        <View key={i} style={styles.bulletRow} wrap={false}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function PlainResume({ data }: { data: CVData }) {
  const { personal } = data;

  return (
    <Document title={personal.name ? `${personal.name} — CV` : "CV"} author={personal.name || undefined}>
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.name}>{personal.name || "Your Name"}</Text>
        {personal.title ? <Text style={styles.title}>{personal.title}</Text> : null}
        <ContactLine personal={personal} />

        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.body}>{data.summary}</Text>
          </View>
        ) : null}

        {data.competencies?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Competencies</Text>
            {data.competencies.map((g, i) => (
              <Text key={i} style={styles.compLine}>
                <Text style={styles.compLabel}>{g.category}: </Text>
                {g.items.join(" • ")}
              </Text>
            ))}
          </View>
        ) : null}

        {data.experience?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.experience.map((e, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.entryTitle}>
                    {e.role}
                    {e.role && e.company ? " — " : ""}
                    {e.company}
                  </Text>
                  <Text style={styles.entryMeta}>{e.dates}</Text>
                </View>
                {e.location ? <Text style={styles.entrySub}>{e.location}</Text> : null}
                <Bullets items={e.bullets} />
              </View>
            ))}
          </View>
        ) : null}

        {data.education?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((e, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.entryTitle}>{e.school}</Text>
                  <Text style={styles.entryMeta}>{e.dates}</Text>
                </View>
                {e.degree ? <Text style={styles.entrySubtitle}>{e.degree}</Text> : null}
                {e.details ? <Text style={styles.body}>{e.details}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {data.certifications?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certifications.map((c, i) => (
              <Text key={i} style={styles.compLine}>
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.year ? ` (${c.year})` : ""}
              </Text>
            ))}
          </View>
        ) : null}

        {data.awards?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awards</Text>
            {data.awards.map((a, i) => (
              <Text key={i} style={styles.compLine}>
                <Text style={styles.compLabel}>{a.name}</Text>
                {a.issuer ? ` — ${a.issuer}` : ""}
                {a.year ? ` (${a.year})` : ""}
                {a.project ? ` — ${a.project}` : ""}
              </Text>
            ))}
          </View>
        ) : null}

        {data.languages?.length > 0 || data.strengths?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages &amp; Strengths</Text>
            {data.languages?.length > 0 ? (
              <Text style={styles.compLine}>{data.languages.map((l) => `${l.name} (${l.level})`).join(" • ")}</Text>
            ) : null}
            {data.strengths?.length > 0 ? (
              <Text style={[styles.compLine, { color: COLOR_MUTED }]}>{data.strengths.join(" • ")}</Text>
            ) : null}
          </View>
        ) : null}

        {(data.customSections ?? [])
          .filter((s) => s.entries.length > 0)
          .map((s) => (
            <View key={s.id} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              {s.entries.map((e, i) => (
                <View key={i} style={styles.entry} wrap={false}>
                  <View style={styles.row}>
                    <Text style={styles.entryTitle}>
                      {e.heading}
                      {e.subheading ? ` — ${e.subheading}` : ""}
                    </Text>
                    {e.meta ? <Text style={styles.entryMeta}>{e.meta}</Text> : null}
                  </View>
                  {e.body ? <Text style={styles.body}>{e.body}</Text> : null}
                  <Bullets items={e.bullets} />
                </View>
              ))}
            </View>
          ))}
      </Page>
    </Document>
  );
}

/** Picks the PDF that matches the CV's chosen layout (Editorial → the plain ATS-friendly one). */
export default function ResumeDocument({ data }: { data: CVData }) {
  switch (layoutOf(data)) {
    case "classic":
      return <ClassicDocument data={data} />;
    case "profile":
      return <ProfileDocument data={data} />;
    case "teal":
      return <TealDocument data={data} />;
    case "navy":
      return <NavyDocument data={data} />;
    default:
      return <PlainResume data={data} />;
  }
}

import { CVData } from "@/lib/types";
import Hero from "@/components/Hero";
import Summary from "@/components/Summary";
import Competencies from "@/components/Competencies";
import Experience from "@/components/Experience";
import Education from "@/components/Education";
import Certifications from "@/components/Certifications";
import Awards from "@/components/Awards";
import Languages from "@/components/Languages";
import CustomSections from "@/components/CustomSections";

/**
 * The full stack of CV sections, shared between the public /{slug} page and
 * the live preview pane in the editor — one place to add a new section.
 */
export default function CVPreview({ data, filename }: { data: CVData; filename?: string }) {
  return (
    <>
      <Hero data={data} filename={filename} />
      <Summary summary={data.summary} />
      <Competencies groups={data.competencies} />
      <Experience entries={data.experience} />
      <Education entries={data.education} />
      <Certifications entries={data.certifications} />
      <Awards entries={data.awards} />
      <Languages languages={data.languages} strengths={data.strengths} />
      <CustomSections sections={data.customSections} startIndex={8} />
    </>
  );
}

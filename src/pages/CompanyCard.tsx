import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SiteHeader, { navLink } from "@/components/brand/SiteHeader";
import SiteFooter from "@/components/brand/SiteFooter";
import StatusScreen from "@/components/brand/StatusScreen";
import CompanyCardView from "@/components/company/CompanyCardView";
import { CompanyCardData, fetchCompanyCardBySlug, normalizeCompanyCard } from "@/lib/companyCard";

export default function CompanyCard() {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = useState<CompanyCardData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setState("loading");
    fetchCompanyCardBySlug(slug).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data) {
        setState("missing");
        return;
      }
      setCard(normalizeCompanyCard(data.data));
      setState("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <StatusScreen>
        <p className="font-mono text-sm text-muted">Loading…</p>
      </StatusScreen>
    );
  }

  if (state === "missing" || !card) {
    return (
      <StatusScreen>
        <div>
          <h1 className="font-display text-3xl mb-3">No company card at /company/{slug}</h1>
          <Link to="/signup" className="btn-solid">Make your own →</Link>
        </div>
      </StatusScreen>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader title={card.companyName || "Company"}>
        <Link to="/signup" className={navLink}>Make your own</Link>
      </SiteHeader>
      <CompanyCardView card={card} className="flex-1" />
      <SiteFooter />
    </div>
  );
}

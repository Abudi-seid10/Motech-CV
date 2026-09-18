import { useEffect, useState, useCallback } from "react";
import { fetchProfileBySlug, ProfileRow } from "@/lib/api";
import { CVData, normalizeCVData } from "@/lib/types";
import { DEFAULT_THEME, ThemeId } from "@/themes";
import { useSession } from "@/hooks/useSession";
import demoData from "@/data/profile.example.json";

const DEMO_SLUG = "me";

interface UseProfileResult {
  row: ProfileRow | null;
  data: CVData | null;
  theme: ThemeId;
  ownerName: string | null;
  isOwner: boolean;
  /** true for the built-in /me and /card/me demo — bundled example data, not a real account */
  isDemo: boolean;
  loading: boolean;
  error: string | null;
  /** true when this slug has no CV at all (or isn't visible to this visitor) */
  notFound: boolean;
  refresh: () => void;
}

export function useProfile(slug: string | undefined): UseProfileResult {
  const { session } = useSession();
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tick, setTick] = useState(0);

  const isDemo = slug === DEMO_SLUG;
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!slug || isDemo) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);
      const { data, error: fetchError } = await fetchProfileBySlug(slug as string);
      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else if (!data) {
        setNotFound(true);
        setRow(null);
      } else {
        setRow(data as ProfileRow);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, tick, isDemo]);

  if (isDemo) {
    const data = normalizeCVData(demoData as Partial<CVData>);
    return {
      row: null,
      data,
      theme: DEFAULT_THEME,
      ownerName: data.personal.name,
      isOwner: false,
      isDemo: true,
      loading: false,
      error: null,
      notFound: false,
      refresh,
    };
  }

  const isOwner = Boolean(session && row && session.user.id === row.user_id);

  return {
    row,
    data: row ? normalizeCVData(row.data) : null,
    theme: row?.theme ?? DEFAULT_THEME,
    ownerName: row?.name ?? null,
    isOwner,
    isDemo: false,
    loading,
    error,
    notFound,
    refresh,
  };
}

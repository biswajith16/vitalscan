"use client";
import { useCallback, useEffect, useState } from "react";
import { scanStorage } from "@/lib/storage/scans";
import type { ScanRecord } from "@/types/scan";
export function useScans() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(
    () =>
      scanStorage
        .list()
        .then((records) => {
          setScans(records);
          setError(null);
        })
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : "Couldn’t load your scans.",
          ),
        )
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { scans, loading, error, refresh };
}

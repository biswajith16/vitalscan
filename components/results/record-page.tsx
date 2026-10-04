"use client";
import { useScans } from "@/hooks/use-scans";
import {
  EmptyState,
  ErrorNotice,
  LoadingState,
  PageHeading,
} from "@/components/common/ui";
import { ScanReport } from "@/components/results/scan-report";
export function RecordPage({ id }: { id?: string }) {
  const { scans, loading, error, refresh } = useScans();
  if (loading) return <LoadingState />;
  if (error) return <ErrorNotice message={error} retry={refresh} />;
  const record = id
    ? scans.find((s) => s.id === id)
    : scans.find((s) => s.source === "real");
  if (!record)
    return (
      <>
        <PageHeading
          eyebrow="YOUR PERSONAL CHECK-IN"
          title="Your scan results."
          description="A little perspective, saved for you."
        />
        <EmptyState
          title={
            id ? "This scan isn’t here." : "Your next insight is a scan away."
          }
          description={
            id
              ? "It may have been deleted or saved in a different browser. Your history is local to this device and browser."
              : "Complete a camera scan to see your results here."
          }
        />
      </>
    );
  return <ScanReport record={record} scans={scans} />;
}

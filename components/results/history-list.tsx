"use client";
import { ArrowRight, Heart, ScanFace, ShieldCheck } from "lucide-react";
import { useScans } from "@/hooks/use-scans";
import {
  EmptyState,
  ErrorNotice,
  formatDate,
  LoadingState,
  PageHeading,
  QualityBadge,
} from "@/components/common/ui";
export function HistoryList() {
  const { scans, loading, error, refresh } = useScans();
  return (
    <>
      <div className="heading-with-action">
        <PageHeading
          eyebrow="YOUR MOMENTS, COLLECTED"
          title="A history of checking in."
          description="Small moments. A fuller picture over time."
        />
        <a href="/scan" className="button primary">
          <ScanFace size={18} />
          New scan
        </a>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorNotice message={error} retry={refresh} />
      ) : !scans.length ? (
        <div className="card">
          <EmptyState />
        </div>
      ) : (
        <>
          <p className="small muted history-count">
            {scans.length} saved {scans.length === 1 ? "scan" : "scans"} ·
            Stored on this device
          </p>
          <div className="history-list">
            {scans.map((scan) => (
              <a
                className="card history-card"
                key={scan.id}
                href={`/history/${scan.id}`}
              >
                <span className="icon-tile peach">
                  <Heart size={23} />
                </span>
                <div className="history-date">
                  <h2>{formatDate(scan.createdAt)}</h2>
                  <p>
                    {new Date(scan.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {scan.scanDurationSeconds}s scan{" "}
                    {scan.source === "demo" && (
                      <span className="badge caution">Demo Data</span>
                    )}
                  </p>
                </div>
                <div className="history-value">
                  <strong>
                    {scan.heartRate}
                    <small>BPM</small>
                  </strong>
                  <QualityBadge score={scan.signalQuality} />
                </div>
                <ArrowRight className="history-arrow" size={19} />
              </a>
            ))}
          </div>
        </>
      )}
      <div className="privacy-strip">
        <ShieldCheck size={20} />
        <p>
          Your history belongs to you. Open any scan to export or delete it.
        </p>
        <a href="/settings/privacy">
          Manage data
          <ArrowRight size={15} />
        </a>
      </div>
    </>
  );
}

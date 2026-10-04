"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Heart,
  Lightbulb,
  ScanFace,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import type { ScanRecord } from "@/types/scan";
import { comparison } from "@/lib/analytics/insights";
import { scanStorage } from "@/lib/storage/scans";
import {
  DISCLAIMER,
  ErrorNotice,
  formatDate,
  QualityBadge,
} from "@/components/common/ui";
export function ScanReport({
  record,
  scans,
}: {
  record: ScanRecord;
  scans: ScanRecord[];
}) {
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (
      !window.confirm(
        "Delete this scan permanently from this browser? This can’t be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      await scanStorage.delete(record.id);
      window.location.assign("/history");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t delete this scan.");
      setDeleting(false);
    }
  };
  return (
    <article className="scan-report">
      <a className="text-link no-print" href="/history">
        <ArrowLeft size={17} />
        All check-ins
      </a>
      <div className="result-heading">
        <span className="result-check">
          <Check size={26} />
        </span>
        <p className="eyebrow">A MOMENT, CAPTURED.</p>
        <h1 className="no-print">Scan complete</h1>
        <h1 className="print-only">VitalScan Wellness Scan</h1>
        <p className="subtitle">{formatDate(record.createdAt, true)}</p>
        {record.source === "demo" && (
          <span className="badge caution">Demo Data</span>
        )}
      </div>
      <div className="result-grid">
        <section className="card heart-result">
          <span className="icon-tile peach">
            <Heart size={24} />
          </span>
          <h2>Heart-rate estimate</h2>
          <div className="big-metric">
            {record.heartRate}
            <span>BPM</span>
          </div>
          <p>
            Experimental camera-based estimate
            <br />— not for medical use.
          </p>
          <div className="result-confidence">
            <ShieldCheck size={17} />
            {record.heartRateConfidence}% signal confidence
          </div>
        </section>
        <section className="card quality-result">
          <div className="section-title">
            <h2>Signal quality</h2>
            <QualityBadge score={record.signalQuality} />
          </div>
          <div className="quality-meter">
            <span style={{ width: `${record.signalQuality}%` }} />
          </div>
          <p className="small muted">
            How well your camera captured a usable signal.
          </p>
          <dl className="quality-breakdown">
            {[
              ["Lighting", record.lightingQuality],
              ["Stability", record.motionQuality],
              ["Face tracking", record.faceTrackingQuality],
              ["Usable samples", record.usablePercentage],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}%</dd>
              </div>
            ))}
          </dl>
          <p className="small muted">
            Confidence describes signal consistency, not clinical accuracy.
          </p>
        </section>
      </div>
      <section className="insight-card">
        <span className="icon-tile mint">
          <Lightbulb size={22} />
        </span>
        <div>
          <h2>A little perspective</h2>
          <p>{comparison(record, scans)}</p>
        </div>
      </section>
      <div className="card report-details">
        <h2>About this reading</h2>
        <dl>
          <div>
            <dt>Scan duration</dt>
            <dd>{record.scanDurationSeconds} seconds</dd>
          </div>
          <div>
            <dt>Algorithm</dt>
            <dd>{record.algorithmVersion}</dd>
          </div>
          <div>
            <dt>Spectral signal-to-noise</dt>
            <dd>{record.spectralSnrDb.toFixed(1)} dB</dd>
          </div>
          <div>
            <dt>Processing</dt>
            <dd>On this device</dd>
          </div>
        </dl>
      </div>
      {error && <ErrorNotice message={error} />}
      <div className="report-actions no-print">
        <button className="button primary" onClick={() => window.print()}>
          <Download size={18} />
          Export report
        </button>
        <a className="button secondary" href="/scan">
          <ScanFace size={18} />
          Scan again
          <ArrowRight size={16} />
        </a>
        <button
          className="button danger-quiet"
          disabled={deleting}
          onClick={remove}
        >
          <Trash2 size={17} />
          {deleting ? "Deleting…" : "Delete scan"}
        </button>
      </div>
      <div className="report-disclaimer">
        <p>
          Camera-based wellness estimate. Not intended for diagnosis or medical
          decision-making.
        </p>
        <p>{DISCLAIMER}</p>
      </div>
    </article>
  );
}

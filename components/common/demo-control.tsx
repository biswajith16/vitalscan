"use client";
import { useState } from "react";
import { scanStorage } from "@/lib/storage/scans";
import { ErrorNotice } from "@/components/common/ui";
export function DemoControl() {
  const [error, setError] = useState("");
  if (process.env.NODE_ENV !== "development") return null;
  const create = async () => {
    try {
      const id = crypto.randomUUID();
      await scanStorage.save({
        id,
        createdAt: new Date().toISOString(),
        heartRate: 72,
        heartRateConfidence: 88,
        signalQuality: 91,
        scanDurationSeconds: 30,
        lightingQuality: 94,
        motionQuality: 95,
        faceTrackingQuality: 98,
        usablePercentage: 96,
        spectralSnrDb: 12,
        algorithmVersion: "DEMO — not measured",
        source: "demo",
      });
      window.location.assign(`/history/${id}`);
    } catch {
      setError("Couldn’t save the demo record.");
    }
  };
  return (
    <section className="card settings-section">
      <span className="badge caution">Development only · Demo Data</span>
      <h2>Preview a sample report</h2>
      <p>
        Creates an explicitly labeled demo record. It is excluded from real
        trends and your latest check-in.
      </p>
      <button className="button secondary" onClick={create}>
        Create demo report
      </button>
      {error && <ErrorNotice message={error} />}
    </section>
  );
}

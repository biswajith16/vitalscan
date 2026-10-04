"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Lightbulb, ChartNoAxesCombined } from "lucide-react";
import { useScans } from "@/hooks/use-scans";
import { filterScans, insights, summarize } from "@/lib/analytics/insights";
import {
  EmptyState,
  ErrorNotice,
  formatDate,
  LoadingState,
  PageHeading,
} from "@/components/common/ui";
const TrendChart = dynamic(() => import("@/components/charts/trend-chart"), {
  ssr: false,
  loading: () => <LoadingState />,
});
const filters = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All", days: null },
];
export function TrendsDashboard() {
  const { scans, loading, error, refresh } = useScans();
  const [days, setDays] = useState<number | null>(30);
  const selected = filterScans(scans, days);
  const stats = summarize(selected);
  return (
    <>
      <PageHeading
        eyebrow="THE BIGGER PICTURE"
        title="Find your own rhythm."
        description="Your camera-based estimates, with a little more perspective."
      />
      <div className="trend-toolbar">
        <span className="small muted">
          <ChartNoAxesCombined size={17} />
          Your personal trends
        </span>
        <div className="segmented-control" aria-label="Time period">
          {filters.map((f) => (
            <button
              key={f.label}
              aria-pressed={days === f.days}
              className={days === f.days ? "selected" : ""}
              onClick={() => setDays(f.days)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorNotice message={error} retry={refresh} />
      ) : !selected.length ? (
        <div className="card">
          <EmptyState
            title="Give your patterns a little time."
            description="No real scans in this period yet. Try another time range or check in with a new scan."
          />
        </div>
      ) : (
        <>
          <div className="stats-grid">
            {[
              ["Average estimate", stats.average, "BPM"],
              ["Lowest estimate", stats.min, "BPM"],
              ["Highest estimate", stats.max, "BPM"],
              ["Your check-ins", stats.count, "scans"],
            ].map(([label, value, unit]) => (
              <div className="card stat-card" key={label}>
                <span>{label}</span>
                <strong>
                  {value}
                  <small>{unit}</small>
                </strong>
              </div>
            ))}
          </div>
          <div className="chart-grid">
            <section className="card">
              <h2>Heart-rate trend</h2>
              <p className="small muted">
                Experimental camera-based estimates · BPM
              </p>
              <TrendChart scans={selected} metric="heartRate" />
            </section>
            <section className="card">
              <h2>Signal quality trend</h2>
              <p className="small muted">Quality of your captured signal · %</p>
              <TrendChart scans={selected} metric="signalQuality" />
            </section>
          </div>
          <div className="insights-list">
            {insights(scans).map((text) => (
              <div className="insight-card" key={text}>
                <span className="icon-tile mint">
                  <Lightbulb size={21} />
                </span>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <details className="card readings-table">
            <summary>View exact readings ({selected.length})</summary>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Scan readings in the selected time period
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date & time</th>
                    <th scope="col">Estimate</th>
                    <th scope="col">Quality</th>
                    <th scope="col">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.createdAt, true)}</td>
                      <td>{s.heartRate} BPM</td>
                      <td>{s.signalQuality}%</td>
                      <td>
                        <a
                          href={`/history/${s.id}`}
                          aria-label={`Open scan from ${formatDate(s.createdAt, true)}`}
                        >
                          Open
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
      <p className="page-disclaimer">
        Patterns offer context, not a diagnosis. Compare scans taken in similar
        conditions. Demo data is excluded from trends.
      </p>
    </>
  );
}

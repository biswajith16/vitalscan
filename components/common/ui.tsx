import { ArrowRight, ScanFace, TriangleAlert } from "lucide-react";
import { qualityLabel } from "@/lib/analytics/insights";
export const DISCLAIMER =
  "This prototype provides wellness information and experimental camera-based estimates. It does not provide medical diagnosis or replace professional medical care.";
export function QualityBadge({ score }: { score: number }) {
  return (
    <span className={`badge ${score >= 75 ? "positive" : "caution"}`}>
      <span className="status-dot" />
      {qualityLabel(score)} · {score}%
    </span>
  );
}
export function EmptyState({
  title = "A little check-in. A fresh perspective.",
  description = "Your first scan is the start of your personal wellness story. Take 30 seconds for yourself.",
  action = true,
}: {
  title?: string;
  description?: string;
  action?: boolean;
}) {
  return (
    <div className="empty-state">
      <span className="icon-tile mint">
        <ScanFace size={28} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <a className="button primary" href="/scan">
          Take your first scan <ArrowRight size={17} />
        </a>
      )}
    </div>
  );
}
export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="error-notice" role="alert">
      <TriangleAlert size={20} />
      <div>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="loader" />
      Loading your local scans…
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="subtitle">{description}</p>
    </div>
  );
}
export function formatDate(value: string, time = false) {
  return new Date(value).toLocaleString(
    undefined,
    time
      ? {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      : { month: "short", day: "numeric", year: "numeric" },
  );
}

"use client";
import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ScanFace,
  ShieldCheck,
  Heart,
  Clock3,
  ChartNoAxesCombined,
  Sun,
  Lightbulb,
  LockKeyhole,
  Fingerprint,
  Check,
} from "lucide-react";
import { FaceIllustration } from "@/components/common/brand";
import {
  ErrorNotice,
  formatDate,
  LoadingState,
  QualityBadge,
} from "@/components/common/ui";
import { useScans } from "@/hooks/use-scans";
const subscribe = () => () => {};
const getGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
};
const features = [
  {
    icon: ScanFace,
    color: "mint",
    number: "01",
    title: "A camera. A little science.",
    text: "Facial color changes can carry a pulse signal. We look for that signal with on-device analysis.",
  },
  {
    icon: ChartNoAxesCombined,
    color: "blue",
    number: "02",
    title: "See your own patterns.",
    text: "Compare check-ins over time, with clear trends and the context behind every reading.",
  },
  {
    icon: Lightbulb,
    color: "peach",
    number: "03",
    title: "Perspective, not a diagnosis.",
    text: "Understand your estimates with thoughtful guidance and honest measurement limits.",
  },
  {
    icon: Fingerprint,
    color: "lavender",
    number: "04",
    title: "Personal stays personal.",
    text: "No account. No uploaded videos. Your readings stay in this browser, under your control.",
  },
];
export function HomeDashboard() {
  const { scans, loading, error, refresh } = useScans();
  const greeting = useSyncExternalStore(
    subscribe,
    getGreeting,
    () => "Welcome",
  );
  const real = scans.filter((s) => s.source === "real");
  const latest = real[0];
  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="greeting">
            <Sun size={16} />
            {greeting}
            <span className="greeting-line" />
          </p>
          <h1>
            A little more in tune
            <br className="mobile-break" /> with you.
          </h1>
          <p className="subtitle">
            Your space to pause, check in, and notice the patterns.
          </p>
        </div>
        <span className="welcome-badge">
          <span className="icon-tile mint">
            <ShieldCheck size={21} />
          </span>
          <span>
            Just for you<strong>No account needed</strong>
          </span>
        </span>
      </div>
      <div className="dashboard-grid">
        <section className="scan-hero" aria-labelledby="face-scan-title">
          <div className="hero-content">
            <span className="hero-eyebrow">
              <span className="status-dot" />
              Your daily check-in
            </span>
            <h2 id="face-scan-title">
              Small pause.
              <br />
              <span>Fresh perspective.</span>
            </h2>
            <p>
              Explore your pulse with a simple face scan.
              <br className="desktop-only" /> All it takes is your camera and 30
              seconds.
            </p>
            <a className="button mint-button" href="/scan">
              <ScanFace size={20} />
              Start a face scan
              <ArrowUpRight size={19} />
            </a>
            <div className="hero-meta">
              <span>
                <Clock3 size={15} />
                30 seconds
              </span>
              <span>
                <LockKeyhole size={14} />
                Processed on-device
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="scan-orbit orbit-one" />
            <div className="scan-orbit orbit-two" />
            <FaceIllustration />
            <span className="visual-chip">
              <span className="status-dot" />
              Camera-based pulse analysis
            </span>
          </div>
          <div className="hero-bottom-note">
            <ShieldCheck size={14} />
            Experimental wellness insights. Not a medical measurement.
          </div>
        </section>
        <section className="card latest-card">
          <div className="section-title">
            <span className="eyebrow">Your latest check-in</span>
            <span className="icon-tile peach">
              <Heart size={19} />
            </span>
          </div>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorNotice message={error} retry={refresh} />
          ) : latest ? (
            <>
              <a href={`/history/${latest.id}`} className="latest-reading">
                <span className="metric-number">
                  {latest.heartRate}
                  <small>BPM</small>
                </span>
                <p className="small muted">Experimental pulse estimate</p>
                <QualityBadge score={latest.signalQuality} />
                <p className="reading-date">
                  {formatDate(latest.createdAt, true)}
                </p>
              </a>
              <a className="card-footer-link" href={`/history/${latest.id}`}>
                View your scan report <ArrowUpRight size={17} />
              </a>
            </>
          ) : (
            <>
              <div className="empty-pulse" aria-hidden="true">
                <svg viewBox="0 0 260 58">
                  <path d="M0 30h68l12-9 15 18 19-34 23 48 16-30 13 7h94" />
                </svg>
              </div>
              <h2>
                Every pattern starts
                <br />
                with a first scan.
              </h2>
              <p className="latest-description">
                Your latest estimate and signal quality will appear here.
              </p>
              <a className="card-footer-link" href="/scan">
                Take your first scan <ArrowUpRight size={17} />
              </a>
            </>
          )}
        </section>
      </div>
      <div className="routine-strip">
        <div className="routine-intro">
          <span className="icon-tile mint">
            <Sun size={22} />
          </span>
          <div>
            <h2>A better scan starts here.</h2>
            <p>Three small things that make a difference.</p>
          </div>
        </div>
        <div className="routine-steps">
          <span>
            <Check size={15} />
            Even lighting
          </span>
          <span>
            <Check size={15} />A steady position
          </span>
          <span>
            <Check size={15} />A relaxed moment
          </span>
        </div>
        <a
          href="/about"
          className="icon-button"
          aria-label="Read how VitalScan works"
        >
          <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="section-title section-heading">
        <div>
          <p className="eyebrow">Designed with intention</p>
          <h2>A simpler way to check in.</h2>
        </div>
        <a className="text-link" href="/about">
          How it works
          <ArrowUpRight size={16} />
        </a>
      </div>
      <section className="feature-grid" aria-label="How VitalScan works">
        {features.map(({ icon: Icon, color, number, title, text }) => (
          <article className="card feature-card" key={number}>
            <div className="feature-top">
              <span className={`icon-tile ${color}`}>
                <Icon size={23} strokeWidth={1.6} />
              </span>
              <span className="feature-number">{number}</span>
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <div className="home-lower-grid">
        <section className="history-preview card">
          <div className="section-title">
            <h2>Recent moments</h2>
            <a className="text-link" href="/history">
              View history
              <ArrowRight size={15} />
            </a>
          </div>
          {real.length ? (
            real.slice(0, 3).map((record) => (
              <a
                className="recent-row"
                href={`/history/${record.id}`}
                key={record.id}
              >
                <span className="recent-icon">
                  <Heart size={18} />
                </span>
                <span>
                  <strong>{formatDate(record.createdAt)}</strong>
                  <small>
                    {new Date(record.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </small>
                </span>
                <span className="recent-bpm">
                  {record.heartRate}
                  <small>BPM</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            ))
          ) : (
            <div className="recent-empty">
              <span className="icon-tile neutral-tile">
                <Clock3 size={23} />
              </span>
              <div>
                <h3>A little history in the making.</h3>
                <p>Your completed scans will live here, ready to revisit.</p>
              </div>
            </div>
          )}
        </section>
        <aside className="daily-note">
          <span className="eyebrow">
            <Sun size={16} />A gentle reminder
          </span>
          <h2>A check-in, not a scorecard.</h2>
          <p>
            Notice how you feel, too. A camera estimate is just one small part
            of your day.
          </p>
          <span className="note-decoration" aria-hidden="true">
            <Sun size={90} strokeWidth={0.7} />
          </span>
        </aside>
      </div>
    </>
  );
}

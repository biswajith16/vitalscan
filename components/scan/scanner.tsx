"use client";
import { useRef, type CSSProperties } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Circle,
  Clock3,
  LockKeyhole,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Sun,
  UserRound,
  Waves,
  X,
} from "lucide-react";
import { useCameraScan } from "@/hooks/use-camera-scan";
import { FaceIllustration } from "@/components/common/brand";
import { ErrorNotice } from "@/components/common/ui";
export function Scanner() {
  const { videoRef, ...scan } = useCameraScan();
  const cameraStageRef = useRef<HTMLDivElement>(null);
  const start = () => {
    void scan.start();
    // Keep the preview visible after the user activates the camera on a phone.
    if (window.matchMedia("(max-width: 760px)").matches)
      cameraStageRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
  };
  const active = ["loading", "positioning", "scanning"].includes(scan.phase);
  const busy = scan.phase === "loading" || scan.phase === "analyzing";
  const exit = () => {
    if (
      scan.phase !== "scanning" ||
      window.confirm(
        "Cancel this scan? This unfinished reading won’t be saved.",
      )
    ) {
      scan.cancel();
      window.location.assign("/");
    }
  };
  const checks = [
    { label: "Face position", good: scan.quality.position, icon: UserRound },
    { label: "Lighting", good: scan.quality.lighting >= 55, icon: Sun },
    { label: "Stability", good: scan.quality.motion >= 65, icon: Waves },
  ];
  return (
    <section className="scanner">
      <div className="scan-top">
        <button className="text-button" onClick={exit}>
          <ArrowLeft size={18} />
          Back home
        </button>
        <span className="badge neutral">
          <LockKeyhole size={13} />
          Private scan
        </span>
      </div>
      <div className="scan-heading">
        <p className="eyebrow">YOUR 30-SECOND CHECK-IN</p>
        <h1>
          {scan.phase === "scanning"
            ? "Scanning…"
            : scan.phase === "analyzing"
              ? "Analyzing your signal…"
              : scan.phase === "failed"
                ? "We couldn’t get a reliable reading."
                : scan.unsaved
                  ? "Your scan is ready."
                  : "A moment, just for you."}
        </h1>
        <p>
          {scan.phase === "scanning"
            ? "Keep still and breathe normally."
            : "Find a comfortable seat and some soft, even light."}
        </p>
      </div>
      <div className="scanner-grid">
        <div
          ref={cameraStageRef}
          className={`camera-stage ${active ? "camera-active" : ""}`}
          style={
            {
              "--video-aspect": `${scan.videoSize.width} / ${scan.videoSize.height}`,
            } as CSSProperties
          }
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Live front-camera preview"
            className={active ? "" : "hidden-video"}
          />
          {!active && (
            <div className="camera-placeholder">
              <FaceIllustration />
              <span>
                {scan.phase === "analyzing"
                  ? "Finding the signal in your scan"
                  : "Your camera preview will appear here"}
              </span>
            </div>
          )}
          {active && (
            <div
              className={`face-guide ${scan.quality.ready ? "ready" : ""}`}
              aria-hidden="true"
            >
              <div />
            </div>
          )}
          <div className="camera-top-label">
            <span className="status-dot" />
            {scan.phase === "loading"
              ? "CONNECTING CAMERA"
              : active
                ? "CAMERA ON · LOCAL PROCESSING"
                : "CAMERA OFF"}
          </div>
          {busy && (
            <div className="camera-loading">
              <span className="loader" />
              <span role="status">
                {scan.phase === "loading"
                  ? scan.startupMessage
                  : "Analyzing your signal…"}
              </span>
            </div>
          )}
          {active && !busy && (
            <div className="camera-guidance" role="status">
              {scan.quality.guidance}
            </div>
          )}
          {scan.phase === "scanning" && (
            <div
              className="scan-progress"
              role="progressbar"
              aria-label="Scan progress"
              aria-valuenow={Math.round(scan.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <svg viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="27" className="progress-track" />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  className="progress-value"
                  strokeDasharray={170}
                  strokeDashoffset={170 * (1 - scan.progress / 100)}
                />
              </svg>
              <strong>
                {Math.round(scan.progress)}
                <small>%</small>
              </strong>
              <span>
                {Math.max(0, Math.ceil(30 * (1 - scan.progress / 100)))} seconds
                left
              </span>
            </div>
          )}
        </div>
        <div className="scan-sidebar">
          <div className="card scan-checks">
            <div className="section-title">
              <h2>
                {active
                  ? "Live quality checks"
                  : "Set yourself up for a good scan"}
              </h2>
              <ScanFace size={20} />
            </div>
            {active ? (
              checks.map(({ label, good, icon: Icon }) => (
                <div className="quality-check" key={label}>
                  <span>
                    <Icon size={19} />
                    {label}
                  </span>
                  <span className={good ? "check-good" : "check-wait"}>
                    {good ? <Check size={16} /> : <Circle size={12} />}{" "}
                    {good ? "Good" : "Adjust"}
                  </span>
                </div>
              ))
            ) : (
              <ol className="scan-tips">
                <li>
                  <span>01</span>
                  <div>
                    <strong>Let the light in</strong>
                    <p>
                      Face a window or a soft light. Avoid shadows and
                      backlighting.
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>Get comfortable</strong>
                    <p>
                      Keep your head still and your forehead and cheeks
                      uncovered.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>Stay in the moment</strong>
                    <p>
                      Keep this screen open. We’ll begin when your position
                      looks good.
                    </p>
                  </div>
                </li>
              </ol>
            )}
            {active && (
              <p className="small muted scan-auto-note">
                Your 30-second scan starts automatically when your position,
                lighting, and movement are stable.
              </p>
            )}
            {active && !busy && (
              <div className="camera-diagnostics">
                <span>Preview connected</span>
                <span>
                  {scan.videoSize.width} × {scan.videoSize.height} ·{" "}
                  {scan.frameRate} fps processing
                </span>
              </div>
            )}
          </div>
          <div className="scan-actions">
            {scan.phase === "failed" && <ErrorNotice message={scan.error} />}
            {scan.unsaved && (
              <>
                <ErrorNotice
                  message={`Your ${scan.unsaved.heartRate} BPM experimental estimate couldn’t be saved. ${scan.error}`}
                />
                <button
                  className="button primary full"
                  onClick={scan.retrySave}
                >
                  Retry saving
                </button>
                <p className="small muted">
                  Keep this page open until the reading is saved.
                </p>
              </>
            )}
            {!active && !busy && !scan.unsaved && (
              <button className="button primary full" onClick={start}>
                {scan.phase === "failed" ? (
                  <RefreshCw size={19} />
                ) : (
                  <Camera size={19} />
                )}{" "}
                {scan.phase === "failed"
                  ? "Try again"
                  : "Enable camera & start"}
                <ArrowRight size={18} />
              </button>
            )}
            {active && (
              <button
                className="button secondary full"
                onClick={() => {
                  if (
                    scan.phase !== "scanning" ||
                    window.confirm("Cancel this unfinished scan?")
                  )
                    scan.cancel();
                }}
              >
                <X size={18} />
                Cancel scan
              </button>
            )}
            <p className="scan-privacy">
              <ShieldCheck size={15} />
              Your camera frames never leave this device.
            </p>
          </div>
          <div className="scan-footnote">
            <Clock3 size={17} />
            <p>
              Experimental camera-based estimate — not for medical use. A weak
              signal will ask you to retry.
            </p>
          </div>
          <details className="camera-help">
            <summary>Camera not opening?</summary>
            <p>
              Allow camera access in your browser’s site settings, then try
              again. Close other apps using the camera.
            </p>
            <p>
              If you opened this inside another app, open the same link directly
              in Safari or Chrome. Camera access requires HTTPS or localhost.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}

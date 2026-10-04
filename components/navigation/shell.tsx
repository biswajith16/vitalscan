"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House,
  ScanFace,
  ChartNoAxesCombined,
  History,
  Settings,
  ShieldCheck,
  WifiOff,
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
} from "lucide-react";
import { BrandMark } from "@/components/common/brand";
import { Onboarding } from "@/components/common/onboarding";
const links = [
  { href: "/", label: "Home", icon: House },
  { href: "/scan", label: "Scan", icon: ScanFace },
  { href: "/trends", label: "Trends", icon: ChartNoAxesCombined },
  { href: "/history", label: "History", icon: History },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const scanning = path === "/scan";
  const title =
    path === "/"
      ? "Overview"
      : path.startsWith("/history/") || path === "/results"
        ? "Scan report"
        : path === "/settings/privacy"
          ? "Privacy"
          : path === "/about"
            ? "About VitalScan"
            : path.slice(1).replace(/^./, (c) => c.toUpperCase());
  const brand = (
    <a href="/" className="brand" aria-label="VitalScan home">
      <BrandMark />
      <span>
        VitalScan<span className="brand-dot">.</span>
      </span>
    </a>
  );
  const nav = links.map(({ href, label, icon: Icon }) => {
    const selected = href === "/" ? path === href : path.startsWith(href);
    return (
      <a
        key={href}
        href={href}
        className={`nav-link ${selected ? "active" : ""}`}
        aria-current={selected ? "page" : undefined}
      >
        <Icon size={20} strokeWidth={1.7} />
        <span>{label}</span>
        {selected && <span className="nav-indicator" />}
      </a>
    );
  });
  return (
    <div className={`app-shell ${scanning ? "focus-mode" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!scanning && (
        <aside className="sidebar">
          <div className="sidebar-brand">
            {brand}
            <span className="sidebar-caption">Your everyday check-in</span>
          </div>
          <p className="nav-group-label">Workspace</p>
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav}
          </nav>
          <div className="sidebar-bottom">
            <a className="sidebar-privacy" href="/settings/privacy">
              <span className="sidebar-shield">
                <ShieldCheck size={21} />
              </span>
              <strong>Private. By design.</strong>
              <p>
                On your device.
                <br />
                Always in your control.
              </p>
              <span>
                Our privacy promise <ArrowUpRight size={15} />
              </span>
            </a>
            <a
              className={`nav-link ${path.startsWith("/settings") ? "active" : ""}`}
              href="/settings"
            >
              <Settings size={19} />
              Settings
            </a>
            <a className="nav-link" href="/about">
              <CircleHelp size={19} />
              About VitalScan
            </a>
            <span className="sidebar-version">
              VitalScan · Research preview
            </span>
          </div>
        </aside>
      )}
      <div className="app-workspace">
        <header className="app-header">
          <div className="header-inner">
            <div className="mobile-brand">{brand}</div>
            <div className="header-breadcrumb">
              <span>My wellness</span>
              <ChevronRight size={14} />
              <strong>{title}</strong>
            </div>
            <div className="header-actions">
              <span className="private-label">
                <span className="status-dot" />
                On-device processing
              </span>
              <span className="header-divider" />
              {!scanning && (
                <a
                  href="/settings"
                  className="icon-button"
                  aria-label="Settings"
                >
                  <Settings size={19} />
                </a>
              )}
              {scanning && (
                <span className="badge neutral">
                  <ShieldCheck size={14} />
                  Private session
                </span>
              )}
            </div>
          </div>
        </header>
        {offline && (
          <div className="offline-banner" role="status">
            <WifiOff size={16} />
            You’re offline. Cached pages and local history are available.
          </div>
        )}
        <main id="main" className={scanning ? "scan-main" : "main-container"}>
          {children}
        </main>
        {!scanning && (
          <footer className="app-footer">
            <span>Built for a little more self-awareness.</span>
            <a href="/about">
              Experimental wellness estimates · Not for medical use{" "}
              <ArrowUpRight size={13} />
            </a>
          </footer>
        )}
      </div>
      {!scanning && (
        <nav className="bottom-nav" aria-label="Mobile navigation">
          {nav}
        </nav>
      )}
      {path === "/" && <Onboarding />}
    </div>
  );
}

import { ArrowRight, ShieldCheck, Info, Database } from "lucide-react";
import { PageHeading, DISCLAIMER } from "@/components/common/ui";
import { DataManagement } from "@/components/common/data-management";
import { InstallApp } from "@/components/common/install-app";
import { DemoControl } from "@/components/common/demo-control";
export default function SettingsPage() {
  return (
    <div className="narrow-page">
      <PageHeading
        eyebrow="JUST THE WAY YOU LIKE IT"
        title="Your space. Your settings."
        description="A few simple things to make VitalScan yours."
      />
      <a className="card settings-link" href="/settings/privacy">
        <span className="icon-tile mint">
          <ShieldCheck />
        </span>
        <div>
          <h2>Privacy, by design</h2>
          <p>Understand what stays on your device.</p>
        </div>
        <ArrowRight size={19} />
      </a>
      <section className="card settings-section">
        <span className="eyebrow">
          <Database size={16} />
          DATA MANAGEMENT
        </span>
        <h2>A fresh start, whenever you like.</h2>
        <p>
          Readings are saved only in this browser. Export individual reports
          from your history before clearing it.
        </p>
        <DataManagement />
      </section>
      <InstallApp />
      <section className="card settings-section">
        <span className="eyebrow">
          <Info size={16} />
          MEASUREMENT INFORMATION
        </span>
        <h2>A signal, with some boundaries.</h2>
        <p>
          VitalScan uses changes in facial color to estimate pulse. Lighting,
          movement, camera hardware, skin appearance, and frame rate can affect
          the result. Signal confidence is not a measure of clinical accuracy.
        </p>
        <h3>Research disclaimer</h3>
        <p>{DISCLAIMER}</p>
        <a className="text-link" href="/about">
          About VitalScan & the science <ArrowRight size={17} />
        </a>
      </section>
      {process.env.NODE_ENV === "development" && <DemoControl />}
    </div>
  );
}

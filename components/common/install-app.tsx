"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Smartphone, Check } from "lucide-react";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const subscribeDisplay = (callback: () => void) => {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installAccepted, setInstalled] = useState(false);
  const standalone = useSyncExternalStore(
    subscribeDisplay,
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  );
  const installed = installAccepted || standalone;
  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  return (
    <section className="card settings-section" id="install">
      <span className="icon-tile mint">
        <Smartphone size={24} />
      </span>
      <h2>Make a little space for wellness.</h2>
      <p>Add VitalScan to your home screen for an app-like experience.</p>
      {installed ? (
        <span className="badge positive">
          <Check size={14} />
          Running as an installed app
        </span>
      ) : (
        prompt && (
          <button
            className="button primary"
            onClick={async () => {
              await prompt.prompt();
              await prompt.userChoice;
              setPrompt(null);
            }}
          >
            <Download size={17} />
            Install VitalScan
          </button>
        )
      )}
      <div className="install-grid">
        <div>
          <h3>On iPhone</h3>
          <ol>
            <li>Open VitalScan in Safari.</li>
            <li>Tap the Share button.</li>
            <li>
              Select <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Confirm with <strong>Add</strong>.
            </li>
          </ol>
        </div>
        <div>
          <h3>On Android</h3>
          <ol>
            <li>Open VitalScan in Chrome.</li>
            <li>Open the browser menu (⋮).</li>
            <li>
              Tap <strong>Install app</strong> or{" "}
              <strong>Add to Home screen</strong>.
            </li>
            <li>Confirm the installation.</li>
          </ol>
        </div>
      </div>
      <p className="small muted">
        If your browser doesn’t offer installation, you can bookmark VitalScan.
        Offline availability depends on previously cached assets and available
        storage.
      </p>
    </section>
  );
}

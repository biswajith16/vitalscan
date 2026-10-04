import { Camera, HardDrive, LockKeyhole, ShieldCheck } from "lucide-react";
import { PageHeading } from "@/components/common/ui";
import { DataManagement } from "@/components/common/data-management";
export default function PrivacyPage() {
  return (
    <div className="narrow-page">
      <PageHeading
        eyebrow="OUR PRIVACY PROMISE"
        title="Personal stays personal."
        description="Wellness is personal. Your data should be, too."
      />
      {[
        {
          icon: Camera,
          title: "Your camera has one purpose.",
          text: "Camera access starts only after you choose to enable it. Frames are processed on your device during a scan. Camera tracks are released when you finish, cancel, leave, or move the app into the background.",
        },
        {
          icon: LockKeyhole,
          title: "Your face is never a file.",
          text: "We don’t save facial images, raw video, or individual camera frames. No frames or scan information are sent to an LLM, an analytics service, or a remote processing backend.",
        },
        {
          icon: HardDrive,
          title: "Your history lives here.",
          text: "Completed estimates and quality scores are stored in this browser’s IndexedDB. There is no account and no cloud sync. Clearing browser data, using private browsing, or switching devices can remove or hide your history. Anyone using this browser profile can see saved scans.",
        },
        {
          icon: ShieldCheck,
          title: "You’re in control.",
          text: "You can print or export a scan report, delete a single scan from its detail page, or remove all scan data below. Model and app assets are downloaded from this site, but contain no personal scan data.",
        },
      ].map(({ icon: Icon, title, text }) => (
        <section className="card privacy-card" key={title}>
          <span className="icon-tile mint">
            <Icon size={24} />
          </span>
          <div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        </section>
      ))}
      <section className="card settings-section">
        <h2>Delete your local history</h2>
        <p>Deletion is permanent. Export any reports you want to keep first.</p>
        <DataManagement />
      </section>
    </div>
  );
}

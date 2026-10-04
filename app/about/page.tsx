import { ArrowRight, ScanFace, Waves, ShieldCheck } from "lucide-react";
import { PageHeading, DISCLAIMER } from "@/components/common/ui";
export default function AboutPage() {
  return (
    <div className="narrow-page">
      <PageHeading
        eyebrow="A LITTLE SCIENCE. A HUMAN TOUCH."
        title="Get to know VitalScan."
        description="Contactless wellness insights from your camera."
      />
      <section className="card settings-section">
        <span className="icon-tile mint">
          <ScanFace />
        </span>
        <h2>A different kind of check-in.</h2>
        <p>
          VitalScan is a research and wellness prototype that explores remote
          photoplethysmography, or rPPG: subtle changes in light reflected from
          skin that can carry a pulse signal.
        </p>
        <p>
          A 30-second scan tracks your face, checks lighting and movement, and
          samples color from small forehead and cheek regions. It only offers an
          experimental heart-rate estimate when the signal passes quality
          checks.
        </p>
      </section>
      <section className="card settings-section">
        <span className="icon-tile blue">
          <Waves />
        </span>
        <h2>From camera frames to a signal.</h2>
        <p>
          MediaPipe Face Landmarker identifies facial geometry on your device.
          The Plane-Orthogonal-to-Skin (POS) method separates color variations,
          followed by filtering and frequency analysis. Consistency across the
          scan helps determine whether to accept the estimate.
        </p>
        <p>
          This implementation has not been clinically validated. A strong signal
          can still be inaccurate, and the prototype may reject a scan even in
          apparently good conditions.
        </p>
        <a
          className="text-link"
          href="https://pubmed.ncbi.nlm.nih.gov/28113245/"
          target="_blank"
          rel="noreferrer"
        >
          Read the POS research <ArrowRight size={16} />
        </a>
      </section>
      <section className="card settings-section">
        <span className="icon-tile peach">
          <ShieldCheck />
        </span>
        <h2>Clear about our limits.</h2>
        <p>{DISCLAIMER}</p>
        <p>
          VitalScan does not measure blood pressure, oxygen saturation, glucose,
          temperature, HRV, or respiratory rate. It does not diagnose health
          conditions.
        </p>
        <p>
          If you’re concerned about your health, seek professional medical
          advice rather than relying on a camera estimate.
        </p>
        <a className="text-link" href="/settings/privacy">
          Explore our privacy promise <ArrowRight size={16} />
        </a>
      </section>
    </div>
  );
}

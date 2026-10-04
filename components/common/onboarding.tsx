"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, ScanFace, Sun, Check } from "lucide-react";
const pages = [
  {
    icon: ScanFace,
    title: "Wellness insights from your camera",
    text: "A quiet moment to check in. Explore an experimental pulse estimate with a 30-second face scan.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Your camera is processed on this device. We don’t store photos or videos. Your scan history stays in this browser.",
  },
  {
    icon: Sun,
    title: "Before your first scan",
    text: "Find good, even lighting. Keep still, leave your forehead and cheeks unobstructed, and center your face in the guide.",
  },
];
export function Onboarding() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    try {
      if (!localStorage.getItem("vitalscan-onboarded"))
        dialog.current?.showModal();
    } catch {
      dialog.current?.showModal();
    }
  }, []);
  const finish = () => {
    try {
      localStorage.setItem("vitalscan-onboarded", "1");
    } catch {
      /* Session still works without localStorage. */
    }
    dialog.current?.close();
  };
  const page = pages[step];
  const Icon = page.icon;
  return (
    <dialog
      className="onboarding"
      ref={dialog}
      aria-labelledby="onboarding-title"
      onCancel={finish}
    >
      <div className="onboarding-art">
        <Icon size={52} strokeWidth={1.3} />
        <span className="onboarding-orbit" />
      </div>
      <p className="eyebrow">A moment for you · {step + 1} of 3</p>
      <h2 id="onboarding-title">{page.title}</h2>
      <p>{page.text}</p>
      <p className="small muted">
        Experimental wellness information. Not for medical use.
      </p>
      <div className="step-dots" aria-hidden="true">
        {pages.map((_, i) => (
          <span key={i} className={step === i ? "active" : ""} />
        ))}
      </div>
      <button
        className="button primary full"
        onClick={() => (step < 2 ? setStep(step + 1) : finish())}
      >
        {step < 2 ? "Continue" : "Get started"}
        {step < 2 ? <ArrowRight size={18} /> : <Check size={18} />}
      </button>
      {step < 2 && (
        <button className="text-button" onClick={finish}>
          Skip introduction
        </button>
      )}
    </dialog>
  );
}

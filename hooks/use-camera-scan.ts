"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { cameraError, createFaceTracker } from "@/lib/camera/face-tracker";
import {
  attachPreview,
  requestCamera,
  withDeadline,
} from "@/lib/camera/session";
import { ReadinessWindow } from "@/lib/camera/readiness";
import {
  positionQuality,
  sampleSkin,
  type FrameQuality,
  type Point,
} from "@/lib/camera/quality";
import { ALGORITHM_VERSION, analyze } from "@/lib/rppg/pipeline";
import { mean } from "@/lib/signal-processing/math";
import { scanStorage } from "@/lib/storage/scans";
import type { RGBSample, ScanRecord } from "@/types/scan";

type Phase =
  | "idle"
  | "loading"
  | "positioning"
  | "scanning"
  | "analyzing"
  | "failed"
  | "complete";
const INITIAL: FrameQuality = {
  position: false,
  lighting: 0,
  motion: 0,
  tracking: 0,
  ready: false,
  guidance: "Position your face inside the guide",
};
export function useCameraScan() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef(0);
  const generation = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const phaseRef = useRef<Phase>("idle");
  const [phase, setPhase] = useState<Phase>("idle");
  const [quality, setQuality] = useState(INITIAL);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [startupMessage, setStartupMessage] = useState("");
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [frameRate, setFrameRate] = useState(0);
  const [unsaved, setUnsaved] = useState<ScanRecord | null>(null);
  const transition = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const stop = useCallback(() => {
    generation.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    trackerRef.current?.close();
    trackerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const cancel = useCallback(() => {
    stop();
    transition("idle");
    setProgress(0);
    setQuality(INITIAL);
  }, [stop, transition]);

  useEffect(() => {
    const interrupt = () => {
      if (["loading", "scanning", "positioning"].includes(phaseRef.current)) {
        stop();
        setError(
          "Your scan was interrupted. Keep this tab open and visible for the full 30 seconds, then try again.",
        );
        transition("failed");
      }
    };
    const onVisibility = () => {
      if (document.hidden) interrupt();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (phaseRef.current === "scanning") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", interrupt);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", interrupt);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [stop, transition]);

  const persist = useCallback(
    async (record: ScanRecord) => {
      try {
        await scanStorage.save(record);
        transition("complete");
        window.location.assign(`/history/${record.id}?new=1`);
      } catch (e) {
        setUnsaved(record);
        setError(cameraError(e));
        transition("complete");
      }
    },
    [transition],
  );

  const start = useCallback(async () => {
    stop();
    const token = generation.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setError("");
    setUnsaved(null);
    setProgress(0);
    setQuality(INITIAL);
    setFrameRate(0);
    setStartupMessage("Allow camera access in your browser…");
    transition("loading");
    try {
      const stream = await requestCamera(controller.signal);
      if (generation.current !== token) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video)
        throw new Error("The preview couldn’t start. Please try again.");
      setStartupMessage("Starting your camera preview…");
      await attachPreview(video, stream, controller.signal);
      if (generation.current !== token) return;
      setVideoSize({ width: video.videoWidth, height: video.videoHeight });
      setStartupMessage("Loading on-device face tracking…");
      let tracker: FaceLandmarker;
      try {
        tracker = await withDeadline(
          createFaceTracker(),
          25000,
          controller.signal,
          "Face tracking took too long to load. Check your connection, then reload the page.",
          (tracker) => tracker.close(),
        );
      } catch {
        throw new Error(
          "The face-tracking model couldn’t load. Reconnect to the internet, reload VitalScan, and try again.",
        );
      }
      if (generation.current !== token) {
        tracker.close();
        return;
      }
      trackerRef.current = tracker;
      transition("positioning");
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = Math.round((320 * video.videoHeight) / video.videoWidth);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context)
        throw new Error("This browser couldn’t process camera frames.");
      const samples: RGBSample[] = [];
      const frameQualities: FrameQuality[] = [];
      let previous: Point[] | undefined;
      const readiness = new ReadinessWindow();
      let scanStarted = 0,
        lastFrame = 0,
        lastUI = 0,
        lastVideoTime = -1,
        lastFresh = performance.now();
      const finish = async () => {
        stop();
        const completionToken = generation.current;
        transition("analyzing");
        setProgress(100);
        // Yield a paint before the bounded final CPU analysis.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 60));
        if (completionToken !== generation.current) return;
        const q = {
          lighting: mean(frameQualities.map((f) => f.lighting)),
          motion: mean(frameQualities.map((f) => f.motion)),
          tracking: mean(frameQualities.map((f) => f.tracking)),
          usable: (samples.length / Math.max(frameQualities.length, 1)) * 100,
        };
        const result = analyze(samples, q);
        if (result.heartRate === null) {
          setError(result.reason!);
          transition("failed");
          return;
        }
        const record: ScanRecord = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          heartRate: result.heartRate,
          heartRateConfidence: result.confidence,
          signalQuality: result.quality,
          scanDurationSeconds: 30,
          lightingQuality: Math.round(q.lighting),
          motionQuality: Math.round(q.motion),
          faceTrackingQuality: Math.round(q.tracking),
          usablePercentage: Math.round(q.usable),
          spectralSnrDb: result.snrDb,
          algorithmVersion: ALGORITHM_VERSION,
          source: "real",
        };
        await persist(record);
      };
      const tick = (now: number) => {
        if (generation.current !== token) return;
        try {
          if (now - lastFresh > 2500 || !stream.active)
            throw new Error(
              "Your camera stopped providing frames. Check the camera connection and try again.",
            );
          if (scanStarted && now - scanStarted >= 30000) {
            void finish().catch((e: unknown) => {
              setError(cameraError(e));
              transition("failed");
            });
            return;
          }
          if (
            now - lastFrame >= 60 &&
            video.currentTime !== lastVideoTime &&
            video.readyState >= 2
          ) {
            const elapsedMs = lastFrame ? now - lastFrame : 1000 / 15;
            lastVideoTime = video.currentTime;
            lastFrame = now;
            lastFresh = now;
            const faces = tracker.detectForVideo(video, now).faceLandmarks;
            const position = positionQuality(faces, previous, elapsedMs);
            previous = faces.length === 1 ? faces[0] : undefined;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const skin =
              faces.length === 1
                ? sampleSkin(
                    context.getImageData(0, 0, canvas.width, canvas.height),
                    faces[0],
                  )
                : null;
            const lighting = skin?.lighting ?? 0;
            const ready =
              position.position && position.motion >= 65 && lighting >= 55;
            const guidance = !position.position
              ? position.guidance
              : lighting < 55
                ? "Improve lighting"
                : position.motion < 65
                  ? "Hold still"
                  : scanStarted
                    ? "Keep still and breathe normally"
                    : "Looking good. Hold this position…";
            const frame: FrameQuality = {
              ...position,
              lighting,
              ready,
              guidance,
            };
            if (!scanStarted) {
              if (readiness.update(now, ready)) {
                scanStarted = now;
                transition("scanning");
              }
            }
            if (scanStarted) {
              frameQualities.push(frame);
              if (ready && skin)
                samples.push({ t: now, r: skin.r, g: skin.g, b: skin.b });
            }
            if (now - lastUI >= 250) {
              lastUI = now;
              setQuality(frame);
              setFrameRate(Math.round(1000 / elapsedMs));
              setProgress(
                scanStarted ? Math.min(100, (now - scanStarted) / 300) : 0,
              );
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        } catch (e) {
          stop();
          setError(cameraError(e));
          transition("failed");
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      if (generation.current !== token) return;
      stop();
      setError(cameraError(e));
      transition("failed");
    }
  }, [persist, stop, transition]);
  return {
    videoRef,
    phase,
    quality,
    progress,
    error,
    startupMessage,
    videoSize,
    frameRate,
    unsaved,
    start,
    cancel,
    retrySave: () => unsaved && persist(unsaved),
  };
}

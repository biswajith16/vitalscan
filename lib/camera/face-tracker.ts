import type { FaceLandmarker } from "@mediapipe/tasks-vision";
export async function createFaceTracker(): Promise<FaceLandmarker> {
  const { FaceLandmarker, FilesetResolver } =
    await import("@mediapipe/tasks-vision");
  const files = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  return FaceLandmarker.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: "/mediapipe/face_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    numFaces: 2,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
}
export function cameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError")
      return "Camera access wasn’t allowed. Enable camera permission in your browser’s site settings, then try again. In an embedded app browser, open this page directly in Safari or Chrome.";
    if (error.name === "NotFoundError")
      return "No camera was found. Open VitalScan on a device with a front-facing camera.";
    if (error.name === "NotReadableError")
      return "Your camera is busy. Close other apps using it, then try again.";
    if (error.name === "SecurityError")
      return "This browser is blocking camera access. Open this HTTPS page directly in Safari or Chrome and allow the camera.";
  }
  return error instanceof Error
    ? error.message
    : "The camera couldn’t start. Reload the page and try again.";
}

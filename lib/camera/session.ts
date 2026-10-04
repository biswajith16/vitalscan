/** Bound browser operations and dispose resources that resolve after cancellation. */
export function withDeadline<T>(
  promise: Promise<T>,
  milliseconds: number,
  signal: AbortSignal,
  message: string,
  dispose?: (value: T) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: unknown, value?: T) => {
      if (settled) {
        if (value !== undefined) dispose?.(value);
        return;
      }
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(value as T);
    };
    const abort = () =>
      finish(new DOMException("Scan cancelled", "AbortError"));
    const timer = setTimeout(() => finish(new Error(message)), milliseconds);
    signal.addEventListener("abort", abort, { once: true });
    promise.then(
      (value) => finish(undefined, value),
      (error) => finish(error),
    );
    if (signal.aborted) abort();
  });
}
export function releaseStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

export async function requestCamera(signal: AbortSignal): Promise<MediaStream> {
  if (!window.isSecureContext)
    throw new Error(
      "Open VitalScan using its HTTPS address. Browsers block cameras on an unsecured connection, including a computer’s local IP address.",
    );
  if (!navigator.mediaDevices?.getUserMedia)
    throw new Error(
      "Camera access isn’t available here. Open VitalScan directly in Safari or Chrome, rather than an embedded app browser.",
    );
  const request = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
      });
    } catch (error) {
      // Some webcams / WebKit camera drivers reject even optional constraints.
      if (
        error instanceof DOMException &&
        ["OverconstrainedError", "ConstraintNotSatisfiedError"].includes(
          error.name,
        ) &&
        !signal.aborted
      ) {
        return navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "user" },
        });
      }
      throw error;
    }
  };
  return withDeadline(
    request(),
    45000,
    signal,
    "Camera permission is still pending. Allow access in your browser’s address bar, then try again. If no prompt appears, open this site directly in Safari or Chrome.",
    releaseStream,
  );
}

export async function attachPreview(
  video: HTMLVideoElement,
  stream: MediaStream,
  signal: AbortSignal,
) {
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.srcObject = stream;
  await withDeadline(
    video.play(),
    12000,
    signal,
    "Your camera opened, but the preview couldn’t play. Close other camera apps and try again in Safari or Chrome.",
  );
  if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2)
    return;
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("canplay", ready);
      signal.removeEventListener("abort", abort);
    };
    const ready = () => {
      if (video.videoWidth && video.videoHeight && video.readyState >= 2) {
        cleanup();
        resolve();
      }
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Scan cancelled", "AbortError"));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "Your camera isn’t sending video. Check your device’s camera permission and try again.",
        ),
      );
    }, 12000);
    video.addEventListener("loadeddata", ready);
    video.addEventListener("canplay", ready);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else ready();
  });
}

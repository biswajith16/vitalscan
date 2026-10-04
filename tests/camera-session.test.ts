import { afterEach, describe, expect, it, vi } from "vitest";
import { withDeadline, requestCamera } from "@/lib/camera/session";
import { ReadinessWindow } from "@/lib/camera/readiness";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("camera startup lifecycle", () => {
  it("returns resources resolved before the deadline", async () => {
    const dispose = vi.fn();
    await expect(
      withDeadline(
        Promise.resolve("camera"),
        100,
        new AbortController().signal,
        "timeout",
        dispose,
      ),
    ).resolves.toBe("camera");
    expect(dispose).not.toHaveBeenCalled();
  });
  it("times out and disposes a camera that arrives late", async () => {
    vi.useFakeTimers();
    let resolve!: (value: string) => void;
    const dispose = vi.fn();
    const operation = withDeadline(
      new Promise<string>((r) => {
        resolve = r;
      }),
      100,
      new AbortController().signal,
      "Camera timeout",
      dispose,
    );
    const result = expect(operation).rejects.toThrow("Camera timeout");
    await vi.advanceTimersByTimeAsync(100);
    await result;
    resolve("late camera");
    await Promise.resolve();
    expect(dispose).toHaveBeenCalledWith("late camera");
  });
  it("cancels immediately and disposes late resources", async () => {
    const controller = new AbortController();
    let resolve!: (value: string) => void;
    const dispose = vi.fn();
    const operation = withDeadline(
      new Promise<string>((r) => {
        resolve = r;
      }),
      100,
      controller.signal,
      "timeout",
      dispose,
    );
    controller.abort();
    await expect(operation).rejects.toMatchObject({ name: "AbortError" });
    resolve("late camera");
    await Promise.resolve();
    expect(dispose).toHaveBeenCalledOnce();
  });
  it("retries unsupported webcam constraints with a simple request", async () => {
    const stream = { getTracks: () => [] };
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException("Unsupported", "OverconstrainedError"),
      )
      .mockResolvedValueOnce(stream);
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    await expect(requestCamera(new AbortController().signal)).resolves.toBe(
      stream,
    );
    expect(getUserMedia).toHaveBeenNthCalledWith(2, {
      audio: false,
      video: { facingMode: "user" },
    });
  });
  it("does not retry a denied permission", async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    vi.stubGlobal("window", { isSecureContext: true });
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    await expect(
      requestCamera(new AbortController().signal),
    ).rejects.toMatchObject({ name: "NotAllowedError" });
    expect(getUserMedia).toHaveBeenCalledOnce();
  });
  it("explains insecure local-IP camera access", async () => {
    vi.stubGlobal("window", { isSecureContext: false });
    await expect(requestCamera(new AbortController().signal)).rejects.toThrow(
      "HTTPS",
    );
  });
});

describe("positioning readiness", () => {
  it("requires a sustained window, not a single good frame", () => {
    const readiness = new ReadinessWindow();
    for (let t = 0; t < 1500; t += 100)
      expect(readiness.update(t, true)).toBe(false);
    expect(readiness.update(1500, true)).toBe(true);
  });
  it("tolerates isolated tracking jitter but not poor positioning", () => {
    const readiness = new ReadinessWindow();
    for (let t = 0; t < 1500; t += 100) readiness.update(t, t !== 700);
    expect(readiness.update(1500, true)).toBe(true);
    expect(readiness.update(1600, false)).toBe(false);
    expect(readiness.update(1700, false)).toBe(false);
    expect(readiness.update(1800, false)).toBe(false);
    expect(readiness.update(1900, true)).toBe(false);
  });
  it("rejects stale readiness after a frame gap", () => {
    const readiness = new ReadinessWindow();
    for (let t = 0; t <= 1500; t += 100) readiness.update(t, true);
    expect(readiness.update(5000, true)).toBe(false);
  });
});

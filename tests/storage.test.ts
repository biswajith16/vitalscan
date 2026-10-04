import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { scanStorage } from "@/lib/storage/scans";
import { record } from "./fixtures";
beforeEach(() => scanStorage.clear());
describe("IndexedDB abstraction", () => {
  it("persists, retrieves, lists, and deletes a validated scan", async () => {
    const scan = record();
    await scanStorage.save(scan);
    expect(await scanStorage.get(scan.id)).toEqual(scan);
    expect(await scanStorage.list()).toEqual([scan]);
    await scanStorage.delete(scan.id);
    expect(await scanStorage.get(scan.id)).toBeUndefined();
  });
  it("lists newest first and clears all sources", async () => {
    const older = record({
      id: crypto.randomUUID(),
      createdAt: "2026-09-01T10:00:00.000Z",
      source: "demo",
    });
    await scanStorage.save(older);
    await scanStorage.save(record());
    expect((await scanStorage.list())[0].id).toBe(record().id);
    await scanStorage.clear();
    expect(await scanStorage.list()).toEqual([]);
  });
  it("rejects invalid and unsupported measurements", async () => {
    await expect(
      scanStorage.save(record({ heartRate: 999 })),
    ).rejects.toThrow();
    expect(await scanStorage.list()).toEqual([]);
  });
});

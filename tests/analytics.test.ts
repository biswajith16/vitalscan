import { describe, expect, it } from "vitest";
import {
  comparison,
  filterScans,
  insights,
  qualityLabel,
  summarize,
} from "@/lib/analytics/insights";
import { record } from "./fixtures";
describe("local trends and insights", () => {
  it("filters by date and excludes demo records", () => {
    const records = [
      record(),
      record({ source: "demo" }),
      record({ createdAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(filterScans(records, 7, Date.parse("2026-10-04"))).toHaveLength(1);
    expect(filterScans(records, null)).toHaveLength(2);
  });
  it("returns honest empty statistics", () => {
    expect(summarize([])).toEqual({
      count: 0,
      average: null,
      min: null,
      max: null,
    });
  });
  it("calculates arithmetic summary", () => {
    expect(
      summarize([
        record({ heartRate: 60 }),
        record({ heartRate: 72 }),
        record({ heartRate: 90 }),
      ]),
    ).toEqual({ count: 3, average: 74, min: 60, max: 90 });
  });
  it("produces deterministic non-diagnostic insights", () => {
    const records = [60, 62, 65].map((heartRate) => record({ heartRate }));
    const result = insights(records, Date.parse("2026-10-04"));
    expect(result[0]).toContain("3 scans");
    expect(result[1]).toContain("relatively consistent");
    expect(result).toEqual(insights(records, Date.parse("2026-10-04")));
  });
  it("offers repeat guidance for a changed reading with enough history", () => {
    const earlier = [1, 2, 3].map((i) =>
      record({
        id: crypto.randomUUID(),
        createdAt: `2026-10-0${i}T08:00:00.000Z`,
      }),
    );
    expect(comparison(record({ heartRate: 100 }), earlier)).toContain(
      "Consider repeating",
    );
  });
  it("labels quality thresholds", () => {
    expect([95, 80, 60, 20].map(qualityLabel)).toEqual([
      "Excellent",
      "Good",
      "Fair",
      "Poor",
    ]);
  });
});

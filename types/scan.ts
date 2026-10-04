import { z } from "zod";
const percentage = z.number().finite().min(0).max(100);
export const scanRecordSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  heartRate: z.number().finite().min(42).max(180),
  heartRateConfidence: percentage,
  signalQuality: percentage,
  scanDurationSeconds: z.number().min(25).max(60),
  lightingQuality: percentage,
  motionQuality: percentage,
  faceTrackingQuality: percentage,
  usablePercentage: percentage,
  spectralSnrDb: z.number().finite(),
  algorithmVersion: z.string(),
  source: z.enum(["real", "demo"]),
});
export type ScanRecord = z.infer<typeof scanRecordSchema>;
export type RGBSample = { t: number; r: number; g: number; b: number };
export type AcquisitionQuality = {
  lighting: number;
  motion: number;
  tracking: number;
  usable: number;
};
export type Measurement = {
  heartRate: number | null;
  confidence: number;
  quality: number;
  snrDb: number;
  reason?: string;
};

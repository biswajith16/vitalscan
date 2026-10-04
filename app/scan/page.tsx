import type { Metadata } from "next";
import { Scanner } from "@/components/scan/scanner";
export const metadata: Metadata = { title: "Face scan" };
export default function ScanPage() {
  return <Scanner />;
}

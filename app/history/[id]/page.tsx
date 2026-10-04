import { RecordPage } from "@/components/results/record-page";
export default async function ScanDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecordPage id={id} />;
}

import { EmptyState } from "@/components/common/ui";
export default function NotFound() {
  return (
    <div className="card">
      <EmptyState
        title="This page took a little detour."
        description="The page you’re looking for doesn’t exist. Head home to start fresh."
        action={false}
      />
      <a href="/" className="button primary">
        Back home
      </a>
    </div>
  );
}

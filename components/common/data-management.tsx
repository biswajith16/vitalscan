"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { scanStorage } from "@/lib/storage/scans";
import { ErrorNotice } from "@/components/common/ui";
export function DataManagement() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const clear = async () => {
    if (
      !window.confirm(
        "Delete all scan data from this browser? Every saved scan will be permanently removed. This can’t be undone.",
      )
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await scanStorage.clear();
      setMessage("All scan data has been deleted from this browser.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t delete local data.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="data-management">
      <button className="button danger-quiet" disabled={busy} onClick={clear}>
        <Trash2 size={18} />
        {busy ? "Deleting…" : "Delete all scan data"}
      </button>
      <p className="small muted">
        This removes saved readings. It won’t change your browser’s camera
        permission.
      </p>
      <p role="status" className="success-message">
        {message}
      </p>
      {error && <ErrorNotice message={error} />}
    </div>
  );
}

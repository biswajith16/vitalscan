"use client";
import { ErrorNotice } from "@/components/common/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="card">
      <h1>Something interrupted this moment.</h1>
      <ErrorNotice
        message="This page couldn’t load. Your saved scans stay in this browser. Try again or return home."
        retry={reset}
      />
      <a className="button secondary" href="/">
        Back home
      </a>
    </div>
  );
}

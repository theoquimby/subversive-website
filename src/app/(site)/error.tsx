"use client";

import { microcopy } from "@content/microcopy";
import { Button } from "@/components/ui/Button";

// Error boundary (spec §5.7): one line from the microcopy set and a retry.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page error-page">
      <h1 className="error-page__title">{microcopy.somethingSpilled}</h1>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

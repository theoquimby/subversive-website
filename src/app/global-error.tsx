"use client";

import { microcopy } from "@content/microcopy";
import "@/styles/globals.css";

// Last-resort boundary: the root layout itself failed, so this brings its own <html>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" data-skin="paper">
      <body>
        <main id="main" className="page error-page">
          <h1 className="error-page__title">{microcopy.somethingSpilled}</h1>
          <button type="button" className="btn btn--primary" onClick={reset}>
            <span className="btn__label">Try again</span>
          </button>
        </main>
      </body>
    </html>
  );
}

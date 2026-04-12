"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

/** Don’t block the home route on a cold/slow `/auth/refresh` (can take 30s+). Redirect when session is ready OR after this deadline; login sends users to dashboard if refresh finishes late. */
const HOME_SESSION_WAIT_MS = 2500;

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [deadlinePassed, setDeadlinePassed] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDeadlinePassed(true), HOME_SESSION_WAIT_MS);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (isLoading && !deadlinePassed) return;
    // #region agent log
    fetch("http://127.0.0.1:7798/ingest/ed65df61-9d62-411d-9ce6-72c29c10e956", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "103bcd",
      },
      body: JSON.stringify({
        sessionId: "103bcd",
        runId: "post-fix",
        hypothesisId: "A",
        location: "page.tsx:redirect",
        message: "home redirect",
        data: {
          isAuthenticated,
          target: isAuthenticated ? "/dashboard" : "/login",
          waitedForSession: !(isLoading && !deadlinePassed),
          usedDeadline: deadlinePassed && isLoading,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isLoading, deadlinePassed, router]);

  return (
    <div className="p-6 text-sm text-muted-foreground">
      {deadlinePassed && isLoading ? "Connecting to server…" : "Redirecting…"}
    </div>
  );
}

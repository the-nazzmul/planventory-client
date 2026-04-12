"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;
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
        data: { isAuthenticated, target: isAuthenticated ? "/dashboard" : "/login" },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isLoading, router]);

  return <div className="p-6 text-sm text-muted-foreground">Redirecting...</div>;
}

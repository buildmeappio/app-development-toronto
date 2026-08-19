"use client";

import { useEffect } from "react";

/** Fire-and-forget profile-view beacon (powers owner analytics). */
export function TrackView({ companyId }: { companyId: string }) {
  useEffect(() => {
    const body = JSON.stringify({ companyId });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track-view",
          new Blob([body], { type: "application/json" }),
        );
      } else {
        void fetch("/api/track-view", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
        });
      }
    } catch {
      /* non-critical */
    }
  }, [companyId]);
  return null;
}

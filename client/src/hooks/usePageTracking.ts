import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Simple page tracking hook.
 * Generates a random visitor ID stored in localStorage,
 * then records each page navigation.
 */
function getVisitorId(): string {
  const key = "alz_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
}

export function usePageTracking() {
  const [location] = useLocation();
  const track = trpc.analytics.track.useMutation();
  const lastTracked = useRef("");

  useEffect(() => {
    if (location === lastTracked.current) return;
    lastTracked.current = location;

    const visitorId = getVisitorId();
    const referrer = document.referrer || undefined;

    track.mutate({ path: location, visitorId, referrer });
  }, [location]);
}

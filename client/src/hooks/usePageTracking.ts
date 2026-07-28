import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Simple page tracking hook.
 * Skips bots and admin users — only tracks real visitors.
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

function isBot(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    "googlebot", "bingbot", "yandexbot", "baiduspider",
    "duckduckbot", "slurp", "facebookexternalhit",
    "twitterbot", "linkedinbot", "mj12bot", "semrushbot",
    "ahrefsbot", "dotbot", "petalbot", "bytespider",
    "crawl", "spider", "bot", "headlesschrome"
  ];
  return botPatterns.some(pattern => ua.includes(pattern));
}

export function usePageTracking() {
  const [location] = useLocation();
  const track = trpc.analytics.track.useMutation();
  const lastTracked = useRef("");
  const { user } = useAuth();

  useEffect(() => {
    // Skip bots
    if (isBot()) return;

    // Skip admin users (site owner)
    if (user?.role === "admin") return;

    if (location === lastTracked.current) return;
    lastTracked.current = location;

    const visitorId = getVisitorId();
    const referrer = document.referrer || undefined;

    track.mutate({ path: location, visitorId, referrer });
  }, [location, user]);
}

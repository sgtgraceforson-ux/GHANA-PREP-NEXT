"use client";
import { useId } from "react";
import "./streak-flame.css";

// Animated fire for the daily streak. It blooms open when it appears (and again whenever the
// streak number changes), then keeps flickering. The fire grows with the streak:
// 0 days = unlit, 1-2 = small, 3-6 = medium, 7+ = big with more glow and sparks.
export function StreakFlame({ days }: { days: number }) {
  const id = useId().replace(/:/g, "");
  const n = Math.max(0, Math.floor(Number(days) || 0));
  const tier = n >= 7 ? 3 : n >= 3 ? 2 : n >= 1 ? 1 : 0;
  return (
    // key: remount when the streak changes so the bloom plays again
    <span key={n} className="gsf" data-tier={tier} aria-hidden="true">
      <span className="gsf-glow" />
      <svg viewBox="0 0 24 24">
        <defs>
          <linearGradient id={`${id}o`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff3d00" />
            <stop offset="0.55" stopColor="#ff8a00" />
            <stop offset="1" stopColor="#ffc93c" />
          </linearGradient>
          <linearGradient id={`${id}i`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ffb300" />
            <stop offset="1" stopColor="#fff3b0" />
          </linearGradient>
        </defs>
        <path className="gsf-outer" fill={`url(#${id}o)`}
          d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        <path className="gsf-inner" fill={`url(#${id}i)`}
          d="M12 21.2a3.6 3.6 0 0 0 3.6-3.6c0-1.5-1-2.5-1.9-3.6-.6-.8-1.1-1.7-1.3-2.9-1.8 1.6-4 3.6-4 6.5a3.6 3.6 0 0 0 3.6 3.6z" />
      </svg>
      <i className="gsf-ember" /><i className="gsf-ember" /><i className="gsf-ember" />
    </span>
  );
}

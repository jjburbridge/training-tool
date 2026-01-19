"use client";

import { PowerDisplay } from "./PowerDisplay";

// This is a simple wrapper that doesn't need workout data
// The actual PowerDisplay will be enhanced by the workout page if needed
export function PowerDisplayWrapper() {
  return <PowerDisplay />;
}

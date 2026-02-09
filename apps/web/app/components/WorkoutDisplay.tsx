"use client";

import { useBluetoothContext } from "../contexts/BluetoothContext";
import { useFTPContext } from "../contexts/FTPContext";
import { getTargetPowerForTime } from "../utils/workout";
import { useState, useEffect, useMemo } from "react";
import { WorkoutProfileGraph } from "./WorkoutProfileGraph";

interface WorkoutSegment {
  segmentType: string;
  duration: {
    value: number;
    unit: string;
  };
  powerTarget?: {
    percentFTP?: number;
    initialPercentFTP?: number;
    finalPercentFTP?: number;
  };
  heartRateTarget?: {
    zone?: string;
    bpm?: number;
  };
  cadenceTarget?: {
    rpm?: number;
    range?: {
      min?: number;
      max?: number;
    };
  };
  repetitions?: number;
  restDuration?: {
    value: number;
    unit: string;
  };
  notes?: string;
}

interface WorkoutDisplayProps {
  workoutTitle: string;
  segments: WorkoutSegment[];
}

function convertToMinutes(duration: { value: number; unit: string }): number {
  switch (duration.unit) {
    case "minutes":
      return duration.value;
    case "seconds":
      return duration.value / 60;
    case "km":
    case "miles":
      return duration.value;
    default:
      return duration.value;
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTimeLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getCurrentSegment(
  segments: WorkoutSegment[],
  elapsedMinutes: number
): { segment: WorkoutSegment; segmentElapsed: number; segmentIndex: number } | null {
  let currentTime = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const durationMinutes = convertToMinutes(segment.duration);
    const repetitions = segment.repetitions || 1;
    const segmentTotalDuration = durationMinutes * repetitions;

    if (
      elapsedMinutes >= currentTime &&
      elapsedMinutes < currentTime + segmentTotalDuration
    ) {
      const segmentElapsed = elapsedMinutes - currentTime;
      return { segment, segmentElapsed, segmentIndex: i };
    }

    currentTime += segmentTotalDuration;
  }

  return null;
}

function getTotalWorkoutDuration(segments: WorkoutSegment[]): number {
  return segments.reduce((total, segment) => {
    const durationMinutes = convertToMinutes(segment.duration);
    const repetitions = segment.repetitions || 1;
    return total + durationMinutes * repetitions;
  }, 0);
}

export function WorkoutDisplay({
  workoutTitle,
  segments,
}: WorkoutDisplayProps) {
  const {
    power,
    cadence,
    heartRate,
    connectedDevice,
    historicalPowerData,
    historicalCadenceData,
    historicalHeartRateData,
    cadenceSource,
    setTrainerTargetPower,
  } = useBluetoothContext();
  const { ftp } = useFTPContext();
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Set start time when device connects and data starts coming in
  useEffect(() => {
    if (
      connectedDevice &&
      historicalPowerData.length === 1 &&
      startTime === null
    ) {
      setStartTime(Date.now());
    }
    if (!connectedDevice) {
      setStartTime(null);
      setPausedTime(0);
      setIsPaused(false);
      setCurrentTime(0);
    }
  }, [connectedDevice, historicalPowerData.length, startTime]);

  // Handle pause/resume
  useEffect(() => {
    if (isPaused && pauseStartTime === null) {
      setPauseStartTime(Date.now());
    } else if (!isPaused && pauseStartTime !== null) {
      const pauseDuration = Date.now() - pauseStartTime;
      setPausedTime((prev) => prev + pauseDuration);
      setPauseStartTime(null);
    }
  }, [isPaused, pauseStartTime]);

  // Update current time every second
  useEffect(() => {
    if (!startTime || isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const baseElapsed = now - startTime - pausedTime;
      const currentPauseElapsed =
        pauseStartTime !== null ? now - pauseStartTime : 0;
      setCurrentTime(Math.max(0, (baseElapsed - currentPauseElapsed) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, pausedTime, pauseStartTime, isPaused]);

  const elapsedTime = currentTime;

  const elapsedMinutes = elapsedTime / 60;
  const targetPower = useMemo(() => {
    // Calculate target power - show initial target even without startTime
    // If no startTime, show target for time 0 (beginning of workout)
    const timeToUse = startTime ? elapsedMinutes : 0;
    return Math.round(getTargetPowerForTime(segments, timeToUse, ftp) ?? 0);
  }, [segments, elapsedMinutes, ftp, startTime]);

  // Update trainer target power when target power changes
  useEffect(() => {
    if (targetPower !== null && connectedDevice) {
      setTrainerTargetPower(targetPower);
    }
  }, [targetPower, connectedDevice, setTrainerTargetPower]);

  const currentSegment = useMemo(() => {
    if (!startTime) return null;
    return getCurrentSegment(segments, elapsedMinutes);
  }, [segments, elapsedMinutes, startTime]);

  const segmentTime = useMemo(() => {
    if (!currentSegment) return 0;
    return currentSegment.segmentElapsed * 60;
  }, [currentSegment]);

  const totalWorkoutDuration = useMemo(
    () => getTotalWorkoutDuration(segments),
    [segments]
  );

  const endTime = useMemo(() => {
    if (!startTime) return null;
    const endTimestamp = startTime + totalWorkoutDuration * 60 * 1000;
    const date = new Date(endTimestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, [startTime, totalWorkoutDuration]);

  // Calculate power bar percentage
  const powerBarPercentage = useMemo(() => {
    if (!targetPower || targetPower === 0) return 50;
    if (!power) return 0;
    const percentage = (power / targetPower) * 100;
    return Math.min(100, Math.max(0, percentage));
  }, [power, targetPower]);

  // Calculate intensity percentage
  const intensityPercentage = useMemo(() => {
    if (!targetPower || !ftp) return 0;
    return (targetPower / ftp) * 100;
  }, [targetPower, ftp]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--sanity-bg)",
        color: "var(--sanity-foreground)",
        padding: "1rem",
        maxWidth: "100%",
      }}
    >
      {/* Workout Header */}
      {!connectedDevice && (
        <div
          style={{
            backgroundColor: "var(--sanity-bg-muted)",
            border: "1px solid var(--sanity-border)",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            textAlign: "center",
            color: "var(--sanity-foreground-muted)",
          }}
        >
          Connect a device to start tracking your workout metrics
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "0 0.5rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            margin: 0,
            color: "var(--sanity-foreground)",
          }}
        >
          {workoutTitle}
        </h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: "none",
              border: "none",
              color: "var(--sanity-foreground)",
              cursor: "pointer",
              fontSize: "1.5rem",
              padding: "0.5rem",
            }}
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* POWER */}
        <div
          style={{
            backgroundColor: "var(--sanity-bg-elevated)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--sanity-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--sanity-foreground-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            POWER
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: "0.75rem",
            }}
          >
            {power !== null ? Math.round(power) : "--"}
          </div>
          {targetPower !== null && (
            <>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "var(--sanity-bg-muted)",
                  borderRadius: "4px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${powerBarPercentage}%`,
                    height: "100%",
                    backgroundColor: powerBarPercentage >= 95 && powerBarPercentage <= 105 ? "var(--sanity-accent)" : powerBarPercentage > 105 ? "var(--sanity-orange)" : "#3b82f6",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "2px",
                    height: "12px",
                    backgroundColor: "var(--sanity-foreground)",
                    borderRadius: "1px",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* INTERVAL TIME */}
        <div
          style={{
            backgroundColor: "var(--sanity-bg-elevated)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--sanity-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--sanity-foreground-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            INTERVAL TIME
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {formatTime(segmentTime)}
          </div>
        </div>

        {/* HEART RATE */}
        <div
          style={{
            backgroundColor: "var(--sanity-bg-elevated)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--sanity-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--sanity-foreground-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            HEART RATE
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {heartRate !== null ? Math.round(heartRate) : "--"}
          </div>
        </div>

        {/* TARGET */}
        <div
          style={{
            backgroundColor: "var(--sanity-bg-elevated)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--sanity-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--sanity-foreground-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            TARGET
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {targetPower !== null ? Math.round(targetPower) : "--"}
          </div>
        </div>

        {/* TOTAL TIME */}
        <div
          style={{
            backgroundColor: "var(--sanity-bg-elevated)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--sanity-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--sanity-foreground-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            TOTAL TIME
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {formatTime(elapsedTime)}
          </div>
        </div>

        {/* CADENCE */}
        <div
          style={{
            backgroundColor: "var(--sanity-bg-elevated)",
            borderRadius: "12px",
            padding: "1rem",
            border: "1px solid var(--sanity-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--sanity-foreground-muted)",
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            CADENCE from {cadenceSource}
          </div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
            }}
          >
            {cadence !== null ? Math.round(cadence) : "--"}
          </div>
        </div>
      </div>

      {/* END TIME */}
      {endTime && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            color: "var(--sanity-foreground-muted)",
          }}
        >
          END TIME: {endTime}
        </div>
      )}

      {/* Workout Graph */}
      <div style={{ marginBottom: "2rem" }}>
        <WorkoutProfileGraph
          segments={segments}
          historicalPowerData={historicalPowerData}
          historicalCadenceData={historicalCadenceData}
          historicalHeartRateData={historicalHeartRateData}
          startTime={startTime}
          ftp={ftp}
          currentTime={elapsedTime}
        />
      </div>

      {/* Bottom Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0.5rem",
          borderTop: "1px solid var(--sanity-border)",
        }}
      >
        <div style={{ fontSize: "0.875rem", color: "var(--sanity-foreground)" }}>
          INTENSITY{" "}
          <span style={{ fontWeight: 600 }}>
            {Math.round(intensityPercentage)}%
          </span>
        </div>
        <div style={{ fontSize: "0.875rem", color: "var(--sanity-accent)" }}>
          DEVICES{" "}
          <span style={{ fontWeight: 600 }}>
            {connectedDevice ? "1 Paired" : "0 Paired"}
          </span>
        </div>
      </div>
    </div>
  );
}

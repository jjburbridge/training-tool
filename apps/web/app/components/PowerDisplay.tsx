"use client";

import { useBluetoothContext } from "../contexts/BluetoothContext";
import { getTargetPowerForTime } from "../utils/workout";
import { useState, useEffect } from "react";

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
  repetitions?: number;
}

interface PowerDisplayProps {
  segments?: WorkoutSegment[];
  startTime?: number | null;
  ftp?: number; // Functional Threshold Power in watts
}

export function PowerDisplay({
  segments,
  startTime,
  ftp = 250,
}: PowerDisplayProps) {
  const { power, connectedDevice } = useBluetoothContext();
  const [targetPower, setTargetPower] = useState<number | null>(null);

  useEffect(() => {
    if (!segments || !startTime || !connectedDevice) {
      setTargetPower(null);
      return;
    }

    const updateTargetPower = () => {
      const now = Date.now();
      const elapsedMinutes = (now - startTime) / 1000 / 60;
      const target = getTargetPowerForTime(segments, elapsedMinutes, ftp);
      setTargetPower(target);
    };

    // Update immediately
    updateTargetPower();

    // Update every second
    const interval = setInterval(updateTargetPower, 1000);

    return () => clearInterval(interval);
  }, [segments, startTime, connectedDevice, ftp]);

  if (!connectedDevice || power === null) {
    return null;
  }

  const powerDiff = targetPower !== null ? power - targetPower : null;
  const isOnTarget = targetPower !== null ? Math.abs(powerDiff!) <= 20 : null; // Within 20W is "on target"

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: "var(--background)",
        borderBottom: "2px solid var(--gray-alpha-200)",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div style={{ display: "flex", gap: "3rem", alignItems: "center" }}>
        <div>
          <div
            style={{
              fontSize: "0.875rem",
              color: "var(--gray-alpha-700)",
              marginBottom: "0.25rem",
            }}
          >
            Current Power
          </div>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1,
            }}
          >
            {power}{" "}
            <span style={{ fontSize: "1.5rem", fontWeight: 400 }}>W</span>
          </div>
        </div>

        {targetPower !== null && (
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--gray-alpha-700)",
                marginBottom: "0.25rem",
              }}
            >
              Target Power
            </div>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "var(--gray-alpha-600)",
                lineHeight: 1,
              }}
            >
              {Math.round(targetPower)}{" "}
              <span style={{ fontSize: "1.5rem", fontWeight: 400 }}>W</span>
            </div>
          </div>
        )}

        {powerDiff !== null && (
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "var(--gray-alpha-700)",
                marginBottom: "0.25rem",
              }}
            >
              Difference
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: isOnTarget
                  ? "#10b981"
                  : powerDiff > 0
                    ? "#f97316"
                    : "#3b82f6",
                lineHeight: 1,
              }}
            >
              {powerDiff > 0 ? "+" : ""}
              {Math.round(powerDiff)}{" "}
              <span style={{ fontSize: "1.25rem", fontWeight: 400 }}>W</span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          backgroundColor: "rgba(0, 255, 0, 0.1)",
          fontSize: "0.875rem",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#10b981",
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        Connected
      </div>
    </div>
  );
}

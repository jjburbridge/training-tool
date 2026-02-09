import React from "react";

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

interface WorkoutProfileGraphProps {
  segments: WorkoutSegment[];
  historicalPowerData?: number[];
  historicalCadenceData?: number[];
  historicalHeartRateData?: number[];
  startTime?: number | null;
  ftp?: number;
  currentTime?: number; // Current elapsed time in seconds
}

function getIntensityColor(intensity: number): string {
  // Color based on FTP percentage zones
  if (intensity < 55) return "#9ca3af"; // Z1 - Grey
  if (intensity < 75) return "#3b82f6"; // Z2 - Blue
  if (intensity < 90) return "#10b981"; // Z3 - Green
  if (intensity < 105) return "#fbbf24"; // Z4 - Yellow
  if (intensity < 120) return "#f97316"; // Z5 - Orange
  return "#ef4444"; // Z6 - Red
}

function getSegmentIntensity(segment: WorkoutSegment): number {
  if (!segment.powerTarget) return 0;

  // For steady segments, use percentFTP
  if (segment.powerTarget.percentFTP) {
    return segment.powerTarget.percentFTP;
  }

  // For ramp segments, use average of initial and final
  if (
    segment.powerTarget.initialPercentFTP &&
    segment.powerTarget.finalPercentFTP
  ) {
    return (
      (segment.powerTarget.initialPercentFTP +
        segment.powerTarget.finalPercentFTP) /
      2
    );
  }

  // For free segments, return 0 (no target)
  if (segment.segmentType === "free") return 0;

  return 0;
}

function convertToMinutes(duration: { value: number; unit: string }): number {
  switch (duration.unit) {
    case "minutes":
      return duration.value;
    case "seconds":
      return duration.value / 60;
    case "km":
    case "miles":
      // For distance-based, estimate as time (you might want to adjust this)
      return duration.value;
    default:
      return duration.value;
  }
}

export function WorkoutProfileGraph({
  segments,
  historicalPowerData = [],
  historicalCadenceData = [],
  historicalHeartRateData = [],
  startTime = null,
  ftp = 250,
  currentTime = 0,
}: WorkoutProfileGraphProps) {
  // Expand segments with repetitions
  const expandedSegments: Array<{
    segment: WorkoutSegment;
    durationMinutes: number;
    intensity: number;
    color: string;
  }> = [];

  segments.forEach((segment) => {
    const durationMinutes = convertToMinutes(segment.duration);
    const intensity = getSegmentIntensity(segment);
    const color = getIntensityColor(intensity);
    const repetitions = segment.repetitions || 1;

    for (let i = 0; i < repetitions; i++) {
      expandedSegments.push({
        segment,
        durationMinutes,
        intensity,
        color,
      });
    }
  });

  const totalDuration = expandedSegments.reduce(
    (sum, s) => sum + s.durationMinutes,
    0
  );

  // Calculate max intensity as percentage of FTP
  // Workout segments are already in % FTP, historical data is in watts
  const maxIntensity = Math.max(
    ...expandedSegments.map((s) => s.intensity),
    ...(historicalPowerData.length > 0
      ? historicalPowerData.map((w) => (w / ftp) * 100)
      : [100]),
    100
  );

  const barHeight = 300;
  const barWidth = 1000;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const graphWidth = barWidth - padding.left - padding.right;
  const graphHeight = barHeight - padding.top - padding.bottom;

  // Calculate max power in watts for Y-axis
  const maxPower = Math.max(
    ...expandedSegments.map((s) => (s.intensity / 100) * ftp),
    ...(historicalPowerData.length > 0 ? historicalPowerData : [ftp * 1.5]),
    ftp * 1.5
  );

  // Calculate current position in workout
  const currentPosition = totalDuration > 0 
    ? Math.min((currentTime / 60) / totalDuration, 1) 
    : 0;
  const currentX = padding.left + currentPosition * graphWidth;

  // Format time for X-axis
  const formatTimeAxis = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes % 1) * 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "8px",
        backgroundColor: "var(--sanity-bg-elevated)",
        border: "1px solid var(--sanity-border)",
      }}
    >
      <svg
        width="100%"
        height={barHeight + 60}
        viewBox={`0 0 ${barWidth} ${barHeight + 60}`}
        style={{ overflow: "visible" }}
      >
          {/* Target power profile - blue shaded area */}
          {expandedSegments.map((expandedSegment, index) => {
            const previousWidth = expandedSegments
              .slice(0, index)
              .reduce((sum, s) => sum + s.durationMinutes, 0);
            const x = padding.left + (previousWidth / totalDuration) * graphWidth;
            const width =
              (expandedSegment.durationMinutes / totalDuration) * graphWidth;
            
            // Calculate power in watts
            const powerWatts = (expandedSegment.intensity / 100) * ftp;
            const height = (powerWatts / maxPower) * graphHeight;
            const y = padding.top + graphHeight - height;

            // For ramp segments, create multiple segments with zone colors
            const isRamp =
              expandedSegment.segment.segmentType === "rampUp" ||
              expandedSegment.segment.segmentType === "rampDown";

            if (isRamp && expandedSegment.segment.powerTarget) {
              const initialIntensity =
                expandedSegment.segment.powerTarget.initialPercentFTP || 0;
              const finalIntensity =
                expandedSegment.segment.powerTarget.finalPercentFTP || 0;
              const initialPower = (initialIntensity / 100) * ftp;
              const finalPower = (finalIntensity / 100) * ftp;
              const initialHeight = (initialPower / maxPower) * graphHeight;
              const finalHeight = (finalPower / maxPower) * graphHeight;

              // Divide the ramp into segments to show zone transitions
              const numSegments = Math.max(20, Math.ceil(width / 5)); // At least 20 segments or one per 5px
              const segments: React.ReactElement[] = [];

              for (let i = 0; i < numSegments; i++) {
                const segmentProgress = i / numSegments;
                const nextProgress = (i + 1) / numSegments;

                // Calculate intensity at this point in the ramp
                const currentIntensity =
                  initialIntensity +
                  (finalIntensity - initialIntensity) * segmentProgress;
                const nextIntensity =
                  initialIntensity +
                  (finalIntensity - initialIntensity) * nextProgress;

                // Get the color for this intensity (zone-based)
                const segmentColor = getIntensityColor(currentIntensity);

                // Calculate heights in watts
                const currentPower = (currentIntensity / 100) * ftp;
                const nextPower = (nextIntensity / 100) * ftp;
                const currentHeight = (currentPower / maxPower) * graphHeight;
                const nextHeight = (nextPower / maxPower) * graphHeight;

                // Calculate positions
                const segmentX = x + segmentProgress * width;
                const segmentWidth = width / numSegments;
                const segmentStartY = padding.top + graphHeight - currentHeight;
                const segmentEndY = padding.top + graphHeight - nextHeight;

                // Create polygon for this segment
                const baseY = padding.top + graphHeight;
                const points = `${segmentX},${baseY} ${segmentX + segmentWidth},${baseY} ${segmentX + segmentWidth},${segmentEndY} ${segmentX},${segmentStartY}`;

                segments.push(
                  <polygon
                    key={`${index}-${i}`}
                    points={points}
                    fill={segmentColor}
                  />
                );
              }

              return <g key={index}>{segments}</g>;
            }

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={width}
                height={height}
                fill="#3b82f6"
                opacity="0.3"
                rx="2"
              />
            );
          })}

          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={padding.left + graphWidth}
            y2={padding.top + graphHeight}
            stroke="var(--gray-alpha-400)"
            strokeWidth="2"
          />

          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + graphHeight}
            stroke="var(--gray-alpha-400)"
            strokeWidth="2"
          />

          {/* Time markers on X-axis */}
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
            const x = padding.left + ratio * graphWidth;
            const timeMinutes = totalDuration * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={x}
                  y1={padding.top + graphHeight}
                  x2={x}
                  y2={padding.top + graphHeight + 5}
                  stroke="var(--gray-alpha-500)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={padding.top + graphHeight + 20}
                  fontSize="11"
                  fill="var(--foreground)"
                  textAnchor="middle"
                >
                  {formatTimeAxis(timeMinutes)}
                </text>
              </g>
            );
          })}

          {/* Power markers on Y-axis */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight - ratio * graphHeight;
            const power = Math.round(maxPower * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left - 5}
                  y2={y}
                  stroke="var(--gray-alpha-500)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fontSize="11"
                  fill="var(--foreground)"
                  textAnchor="end"
                >
                  {power}
                </text>
              </g>
            );
          })}

          {/* Actual power data - yellow vertical spikes */}
          {historicalPowerData.length > 0 && (
            <g>
              {historicalPowerData.map((power, index) => {
                // Calculate time position - assume 1 reading per second
                const timePosition = Math.min(
                  (index / 60) / totalDuration,
                  1
                );
                if (timePosition > 1 || timePosition < 0) return null;

                const x = padding.left + timePosition * graphWidth;
                const height = (power / maxPower) * graphHeight;
                const y = padding.top + graphHeight - height;

                return (
                  <line
                    key={index}
                    x1={x}
                    y1={padding.top + graphHeight}
                    x2={x}
                    y2={y}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                );
              })}
            </g>
          )}

          {/* Heart rate line - red overlay */}
          {historicalHeartRateData.length > 0 && (
            <g>
              {(() => {
                const hrPoints: Array<{ x: number; y: number }> = [];
                const maxHR = Math.max(...historicalHeartRateData, 200);
                const minHR = Math.min(...historicalHeartRateData, 50);

                historicalHeartRateData.forEach((hr, index) => {
                  const timePosition = Math.min(
                    (index / 60) / totalDuration,
                    1
                  );
                  if (timePosition > 1 || timePosition < 0) return;

                  const x = padding.left + timePosition * graphWidth;
                  // Map HR to graph height (using a portion of the graph)
                  const hrNormalized = (hr - minHR) / (maxHR - minHR);
                  const y = padding.top + graphHeight - hrNormalized * graphHeight * 0.6; // Use 60% of graph height for HR
                  hrPoints.push({ x, y });
                });

                if (hrPoints.length === 0) return null;

                const pathData = hrPoints
                  .map(
                    (point, index) =>
                      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                  )
                  .join(" ");

                return (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.7"
                  />
                );
              })()}
            </g>
          )}

          {/* Current progress line - yellow vertical line */}
          {currentTime > 0 && (
            <line
              x1={currentX}
              y1={padding.top}
              x2={currentX}
              y2={padding.top + graphHeight}
              stroke="#fbbf24"
              strokeWidth="3"
              opacity="0.9"
            />
          )}

          {/* FTP label */}
          <text
            x={barWidth - padding.right}
            y={padding.top + graphHeight - (ftp / maxPower) * graphHeight}
            fontSize="11"
            fill="var(--gray-alpha-600)"
            textAnchor="end"
          >
            FTP {ftp}
          </text>
        </svg>
      </div>
  );
}

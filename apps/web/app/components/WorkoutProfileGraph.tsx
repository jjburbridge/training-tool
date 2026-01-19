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

  const barHeight = 200;
  const barWidth = 800;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        Workout Profile
      </h2>
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "8px",
          backgroundColor: "var(--gray-alpha-100)",
          border: "1px solid var(--gray-alpha-200)",
        }}
      >
        <svg
          width="100%"
          height={barHeight + 40}
          viewBox={`0 0 ${barWidth} ${barHeight + 40}`}
          style={{ overflow: "visible" }}
        >
          {expandedSegments.map((expandedSegment, index) => {
            const previousWidth = expandedSegments
              .slice(0, index)
              .reduce((sum, s) => sum + s.durationMinutes, 0);
            const x = (previousWidth / totalDuration) * barWidth;
            const width =
              (expandedSegment.durationMinutes / totalDuration) * barWidth;
            const height =
              (expandedSegment.intensity / maxIntensity) * barHeight;
            const y = barHeight - height;

            // For ramp segments, create multiple segments with zone colors
            const isRamp =
              expandedSegment.segment.segmentType === "rampUp" ||
              expandedSegment.segment.segmentType === "rampDown";

            if (isRamp && expandedSegment.segment.powerTarget) {
              const initialIntensity =
                expandedSegment.segment.powerTarget.initialPercentFTP || 0;
              const finalIntensity =
                expandedSegment.segment.powerTarget.finalPercentFTP || 0;
              const initialHeight =
                (initialIntensity / maxIntensity) * barHeight;
              const finalHeight = (finalIntensity / maxIntensity) * barHeight;

              // Divide the ramp into segments to show zone transitions
              const numSegments = Math.max(20, Math.ceil(width / 5)); // At least 20 segments or one per 5px
              const segments: JSX.Element[] = [];

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

                // Calculate heights
                const currentHeight =
                  (currentIntensity / maxIntensity) * barHeight;
                const nextHeight = (nextIntensity / maxIntensity) * barHeight;

                // Calculate positions
                const segmentX = x + segmentProgress * width;
                const segmentWidth = width / numSegments;
                const segmentStartY = barHeight - currentHeight;
                const segmentEndY = barHeight - nextHeight;

                // Create polygon for this segment
                const points = `${segmentX},${barHeight} ${segmentX + segmentWidth},${barHeight} ${segmentX + segmentWidth},${segmentEndY} ${segmentX},${segmentStartY}`;

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
                fill={expandedSegment.color}
                rx="2"
              />
            );
          })}

          {/* X-axis labels */}
          <line
            x1="0"
            y1={barHeight}
            x2={barWidth}
            y2={barHeight}
            stroke="var(--gray-alpha-300)"
            strokeWidth="2"
          />

          {/* Time markers */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = ratio * barWidth;
            const time = Math.round(totalDuration * ratio);
            return (
              <g key={ratio}>
                <line
                  x1={x}
                  y1={barHeight}
                  x2={x}
                  y2={barHeight + 5}
                  stroke="var(--gray-alpha-400)"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={barHeight + 20}
                  fontSize="12"
                  fill="var(--foreground)"
                  textAnchor="middle"
                >
                  {time}m
                </text>
              </g>
            );
          })}

          {/* Historical data overlay */}
          {historicalPowerData.length > 0 && (
            <g>
              {/* Calculate time scale for historical data */}
              {(() => {
                const dataPoints: Array<{
                  x: number;
                  y: number;
                  power: number;
                }> = [];

                // Calculate elapsed time if we have a start time
                const now = Date.now();
                const elapsedSeconds = startTime
                  ? (now - startTime) / 1000
                  : historicalPowerData.length; // Fallback: assume 1 reading per second
                const elapsedMinutes = elapsedSeconds / 60;

                // Sample data points - show one point every few seconds to avoid clutter
                const sampleInterval = Math.max(
                  1,
                  Math.floor(historicalPowerData.length / 200)
                ); // Max 200 points

                historicalPowerData.forEach((power, index) => {
                  // Only sample every Nth point to avoid too many points
                  if (
                    index % sampleInterval !== 0 &&
                    index !== historicalPowerData.length - 1
                  ) {
                    return;
                  }

                  // Calculate time position based on elapsed time
                  // Each data point represents approximately 1 second of elapsed time
                  const timePosition = startTime
                    ? Math.min(index / 60 / totalDuration, 1)
                    : Math.min(index / 60 / totalDuration, 1);

                  if (timePosition <= 1 && timePosition >= 0) {
                    const x = timePosition * barWidth;
                    // Convert power to percentage of FTP for comparison with workout targets
                    const powerPercent = (power / ftp) * 100;
                    const height = Math.max(
                      0,
                      (powerPercent / maxIntensity) * barHeight
                    );
                    const y = barHeight - height;
                    dataPoints.push({ x, y, power });
                  }
                });

                if (dataPoints.length === 0) return null;

                // Create path for the line
                const pathData =
                  dataPoints.length === 1
                    ? `M ${dataPoints[0].x} ${dataPoints[0].y}`
                    : dataPoints
                        .map(
                          (point, index) =>
                            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                        )
                        .join(" ");

                return (
                  <>
                    {/* Line for historical data - red to show actual vs target */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.8"
                    />
                    {/* Data points - show every 20th point to avoid clutter */}
                    {dataPoints
                      .filter(
                        (_, index) =>
                          index % 20 === 0 || index === dataPoints.length - 1
                      )
                      .map((point, index) => (
                        <circle
                          key={index}
                          cx={point.x}
                          cy={point.y}
                          r="2.5"
                          fill="#ef4444"
                          opacity="0.9"
                        />
                      ))}
                  </>
                );
              })()}
            </g>
          )}
        </svg>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginTop: "1rem",
            flexWrap: "wrap",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#9ca3af",
                borderRadius: "2px",
              }}
            />
            <span>Z1 (&lt;55% FTP)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#3b82f6",
                borderRadius: "2px",
              }}
            />
            <span>Z2 (55-75% FTP)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#10b981",
                borderRadius: "2px",
              }}
            />
            <span>Z3 (75-90% FTP)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#fbbf24",
                borderRadius: "2px",
              }}
            />
            <span>Z4 (90-105% FTP)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#f97316",
                borderRadius: "2px",
              }}
            />
            <span>Z5 (105-120% FTP)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "#ef4444",
                borderRadius: "2px",
              }}
            />
            <span>Z6 (&gt;120% FTP)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

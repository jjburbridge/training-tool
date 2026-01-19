interface LineGraphProps {
  data: number[];
  width?: number;
  height?: number;
}

export function LineGraph({ data, width = 400, height = 200 }: LineGraphProps) {
  if (data.length === 0) return null;

  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1; // Avoid division by zero

  // Calculate points for the line
  const points = data.map((value, index) => {
    const x =
      data.length === 1
        ? padding + graphWidth / 2
        : padding + (index / (data.length - 1)) * graphWidth;
    const y =
      padding + graphHeight - ((value - minValue) / range) * graphHeight;
    return { x, y, value };
  });

  // Create path string for the line
  const pathData =
    data.length === 1
      ? `M ${points[0]!.x} ${points[0]!.y}`
      : points
          .map(
            (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
          )
          .join(" ");

  const gridRatios = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ width: "100%", maxWidth: `${width}px` }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          border: "1px solid var(--gray-alpha-200)",
          borderRadius: "4px",
        }}
      >
        {/* Grid lines */}
        {gridRatios.map((ratio) => {
          const y = padding + graphHeight - ratio * graphHeight;
          const value = minValue + ratio * range;
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="var(--gray-alpha-200)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 10}
                y={y + 4}
                fontSize="10"
                fill="var(--foreground)"
                textAnchor="end"
                opacity={0.7}
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.length > 1 &&
          gridRatios.map((ratio) => {
            const x = padding + ratio * graphWidth;
            const index = Math.round(ratio * (data.length - 1));
            return (
              <text
                key={ratio}
                x={x}
                y={height - padding + 20}
                fontSize="10"
                fill="var(--foreground)"
                textAnchor="middle"
                opacity={0.7}
              >
                {index}
              </text>
            );
          })}

        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="2"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill="var(--foreground)"
          />
        ))}
      </svg>
    </div>
  );
}

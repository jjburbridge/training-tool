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

export function getTargetPowerForTime(
  segments: WorkoutSegment[],
  elapsedMinutes: number,
  ftp: number = 250 // Default FTP, could be made configurable
): number | null {
  let currentTime = 0;

  for (const segment of segments) {
    const durationMinutes = convertToMinutes(segment.duration);
    const repetitions = segment.repetitions || 1;
    const segmentTotalDuration = durationMinutes * repetitions;

    if (
      elapsedMinutes >= currentTime &&
      elapsedMinutes < currentTime + segmentTotalDuration
    ) {
      // We're in this segment
      const segmentElapsed = elapsedMinutes - currentTime;
      const segmentProgress =
        (segmentElapsed % durationMinutes) / durationMinutes;

      if (!segment.powerTarget) {
        return null; // No power target for this segment
      }

      // For steady segments
      if (segment.powerTarget.percentFTP) {
        return (segment.powerTarget.percentFTP / 100) * ftp;
      }

      // For ramp segments
      if (
        segment.powerTarget.initialPercentFTP &&
        segment.powerTarget.finalPercentFTP
      ) {
        const initialPower =
          (segment.powerTarget.initialPercentFTP / 100) * ftp;
        const finalPower = (segment.powerTarget.finalPercentFTP / 100) * ftp;

        // Determine if it's ramp up or ramp down
        const isRampUp = segment.segmentType === "rampUp";
        const startPower = isRampUp ? initialPower : finalPower;
        const endPower = isRampUp ? finalPower : initialPower;

        return startPower + (endPower - startPower) * segmentProgress;
      }

      return null;
    }

    currentTime += segmentTotalDuration;
  }

  // If we've passed all segments, return null
  return null;
}

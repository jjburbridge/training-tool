"use client";

import { WorkoutProfileGraph } from "./WorkoutProfileGraph";
import { useBluetoothContext } from "../contexts/BluetoothContext";
import { useFTPContext } from "../contexts/FTPContext";
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

interface WorkoutGraphWrapperProps {
  segments: WorkoutSegment[];
}

export function WorkoutGraphWrapper({ segments }: WorkoutGraphWrapperProps) {
  const { historicalPowerData, historicalCadenceData, historicalHeartRateData, connectedDevice } = useBluetoothContext();
  const { ftp } = useFTPContext();
  const [startTime, setStartTime] = useState<number | null>(null);

  // Set start time when device connects and data starts coming in
  useEffect(() => {
    if (
      connectedDevice &&
      historicalPowerData.length === 1 &&
      startTime === null
    ) {
      // Set start time when first data point arrives
      setStartTime(Date.now());
    }
    if (!connectedDevice) {
      setStartTime(null);
    }
  }, [connectedDevice, historicalPowerData.length, startTime]);

  return (
    <WorkoutProfileGraph
      segments={segments}
      historicalPowerData={historicalPowerData}
      historicalCadenceData={historicalCadenceData}
      historicalHeartRateData={historicalHeartRateData}
      startTime={startTime}
      ftp={ftp}
    />
  );
}

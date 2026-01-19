"use client";

import { PowerDisplay } from "./PowerDisplay";
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

interface WorkoutPowerDisplayProps {
  segments: WorkoutSegment[];
}

export function WorkoutPowerDisplay({ segments }: WorkoutPowerDisplayProps) {
  const { connectedDevice, historicalPowerData } = useBluetoothContext();
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

  return <PowerDisplay segments={segments} startTime={startTime} ftp={ftp} />;
}

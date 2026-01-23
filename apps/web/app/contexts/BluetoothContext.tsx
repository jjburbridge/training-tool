"use client";

import { createContext, useContext, ReactNode } from "react";
import { useBluetooth } from "../hooks/useBluetooth";
import type { DeviceInfo } from "../types/bluetooth";

interface BluetoothContextType {
  isSupported: boolean | null;
  isScanning: boolean;
  devices: DeviceInfo[];
  connectedDevice: DeviceInfo | null;
  error: string | null;
  deviceInfo: string | null;
  power: number | null;
  cadence: number | null;
  heartRate: number | null;
  historicalPowerData: number[];
  historicalCadenceData: number[];
  historicalHeartRateData: number[];
  cadenceSource: string | null;
  startNotifications: (() => void) | null;
  stopNotifications: (() => void) | null;
  setTrainerTargetPower: (power: number) => Promise<void>;
  checkSupport: () => void;
  scanForDevices: () => Promise<void>;
  connectToDevice: (device: DeviceInfo) => Promise<{
    startNotifications: () => void;
    stopNotifications: () => void;
  }>;
  disconnectDevice: () => void;
}

const BluetoothContext = createContext<BluetoothContextType | undefined>(
  undefined
);

export function BluetoothProvider({ children }: { children: ReactNode }) {
  const bluetooth = useBluetooth();

  return (
    <BluetoothContext.Provider value={bluetooth}>
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetoothContext() {
  const context = useContext(BluetoothContext);
  if (context === undefined) {
    throw new Error(
      "useBluetoothContext must be used within a BluetoothProvider"
    );
  }
  return context;
}

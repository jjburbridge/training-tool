"use client";

import { useBluetooth } from "../hooks/useBluetooth";
import { ErrorMessage } from "./ErrorMessage";
import { ActionButtons } from "./ActionButtons";
import { ConnectedDeviceCard } from "./ConnectedDeviceCard";
import { DeviceList } from "./DeviceList";

export function WorkoutBluetooth() {
  const {
    isSupported,
    isScanning,
    devices,
    connectedDevice,
    error,
    deviceInfo,
    power,
    historicalPowerData,
    historicalCadenceData,
    historicalHeartRateData,
    startNotifications,
    stopNotifications,
    checkSupport,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
  } = useBluetooth();

  if (isSupported === null) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={checkSupport}
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
            border: "none",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          Check Web Bluetooth Support
        </button>
      </div>
    );
  }

  if (isSupported === false) {
    return error ? <ErrorMessage message={error} /> : null;
  }

  return (
    <div
      style={{
        marginTop: "2rem",
        padding: "1.5rem",
        borderRadius: "8px",
        backgroundColor: "var(--gray-alpha-100)",
        border: "1px solid var(--gray-alpha-200)",
      }}
    >
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        Power Meter Connection
      </h2>

      <ActionButtons
        isScanning={isScanning}
        onScan={scanForDevices}
        connectedDevice={connectedDevice}
        onDisconnect={disconnectDevice}
      />

      {error && <ErrorMessage message={error} />}

      {connectedDevice && (
        <ConnectedDeviceCard
          device={connectedDevice}
          deviceInfo={deviceInfo}
          power={power}
          startNotifications={startNotifications}
          stopNotifications={stopNotifications}
        />
      )}

      {devices.length > 0 && !connectedDevice && (
        <DeviceList devices={devices} onConnect={connectToDevice} />
      )}
    </div>
  );
}

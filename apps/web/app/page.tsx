"use client";

import styles from "./page.module.css";
import { useBluetooth } from "./hooks/useBluetooth";
import {
  ErrorMessage,
  ActionButtons,
  ConnectedDeviceCard,
  DeviceList,
  Instructions,
} from "./components";

export default function Home() {
  const {
    isSupported,
    isScanning,
    devices,
    connectedDevice,
    error,
    deviceInfo,
    power,
    cadence,
    heartRate,
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, marginBottom: "1rem" }}>
          Web Bluetooth Device Connection
        </h1>

        {isSupported === null && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={checkSupport}
              className={styles.secondary}
              style={{ marginBottom: "1rem" }}
            >
              Check Web Bluetooth Support
            </button>
          </div>
        )}

        {isSupported === false && error && <ErrorMessage message={error} />}

        {isSupported === true && (
          <>
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

            <Instructions />
          </>
        )}
      </main>
    </div>
  );
}

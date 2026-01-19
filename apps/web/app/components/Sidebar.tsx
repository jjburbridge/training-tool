"use client";

import { useBluetoothContext } from "../contexts/BluetoothContext";
import { useFTPContext } from "../contexts/FTPContext";
import { ErrorMessage } from "./ErrorMessage";
import { ActionButtons } from "./ActionButtons";
import { ConnectedDeviceCard } from "./ConnectedDeviceCard";
import { DeviceList } from "./DeviceList";
import { useState, useEffect } from "react";
import styles from "../page.module.css";

export function Sidebar() {
  const { ftp, setFTP } = useFTPContext();
  const [ftpInput, setFTPInput] = useState(ftp.toString());

  // Sync input when FTP changes from context
  useEffect(() => {
    setFTPInput(ftp.toString());
  }, [ftp]);
  const {
    isSupported,
    isScanning,
    devices,
    connectedDevice,
    error,
    deviceInfo,
    power,
    historicalData,
    startNotifications,
    stopNotifications,
    checkSupport,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
  } = useBluetoothContext();

  return (
    <aside
      style={{
        width: "320px",
        minHeight: "100vh",
        backgroundColor: "var(--gray-alpha-100)",
        borderRight: "1px solid var(--gray-alpha-200)",
        padding: "1.5rem",
        overflowY: "auto",
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
        }}
      >
        Power Meter
      </h2>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "var(--background)",
          border: "1px solid var(--gray-alpha-200)",
        }}
      >
        <label
          htmlFor="ftp-input"
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--foreground)",
          }}
        >
          Functional Threshold Power (FTP)
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            id="ftp-input"
            type="number"
            min="100"
            max="500"
            value={ftpInput}
            onChange={(e) => setFTPInput(e.target.value)}
            onBlur={() => {
              const value = parseInt(ftpInput, 10);
              if (!isNaN(value) && value >= 100 && value <= 500) {
                setFTP(value);
              } else {
                setFTPInput(ftp.toString());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const value = parseInt(ftpInput, 10);
                if (!isNaN(value) && value >= 100 && value <= 500) {
                  setFTP(value);
                  e.currentTarget.blur();
                } else {
                  setFTPInput(ftp.toString());
                }
              }
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--gray-alpha-300)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
              fontSize: "1rem",
            }}
          />
          <span
            style={{
              padding: "0.5rem",
              color: "var(--gray-alpha-700)",
              fontSize: "0.875rem",
            }}
          >
            W
          </span>
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--gray-alpha-600)",
            marginTop: "0.25rem",
            marginBottom: 0,
          }}
        >
          Your FTP is used to calculate target power zones
        </p>
      </div>

      {isSupported === null && (
        <div style={{ textAlign: "center" }}>
          <button
            onClick={checkSupport}
            className={styles.secondary}
            style={{ marginBottom: "1rem", width: "100%" }}
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
            <div style={{ marginTop: "1rem" }}>
              <ConnectedDeviceCard
                device={connectedDevice}
                deviceInfo={deviceInfo}
                power={power}
                startNotifications={startNotifications}
                stopNotifications={stopNotifications}
              />
            </div>
          )}

          {devices.length > 0 && !connectedDevice && (
            <div style={{ marginTop: "1rem" }}>
              <DeviceList devices={devices} onConnect={connectToDevice} />
            </div>
          )}
        </>
      )}
    </aside>
  );
}

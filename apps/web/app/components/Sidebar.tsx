"use client";

import Link from "next/link";
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
  } = useBluetoothContext();

  return (
    <aside
      style={{
        width: "320px",
        minHeight: "100vh",
        backgroundColor: "var(--sanity-bg-elevated)",
        borderRight: "1px solid var(--sanity-border)",
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
          marginBottom: "1rem",
          color: "var(--sanity-foreground)",
        }}
      >
        Training Tool
      </h2>

      <nav
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <Link
          href="/"
          className={styles.navLink}
        >
          Home
        </Link>
        <Link
          href="/workouts"
          className={styles.navLink}
        >
          Workouts
        </Link>
        <Link
          href="/workout-plans"
          className={styles.navLink}
        >
          Workout Plans
        </Link>
      </nav>

      <h3
        style={{
          fontSize: "0.7rem",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: "1rem",
          color: "var(--sanity-accent)",
        }}
      >
        Power Meter
      </h3>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          backgroundColor: "var(--sanity-bg)",
          border: "1px solid var(--sanity-border)",
        }}
      >
        <label
          htmlFor="ftp-input"
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
            color: "var(--sanity-foreground)",
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
              borderRadius: "6px",
              border: "1px solid var(--sanity-border-strong)",
              backgroundColor: "var(--sanity-bg)",
              color: "var(--sanity-foreground)",
              fontSize: "1rem",
            }}
          />
          <span
            style={{
              padding: "0.5rem",
              color: "var(--sanity-foreground-muted)",
              fontSize: "0.875rem",
            }}
          >
            W
          </span>
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--sanity-foreground-muted)",
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

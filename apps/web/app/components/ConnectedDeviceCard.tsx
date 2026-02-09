import styles from "../page.module.css";
import type { DeviceInfo } from "../types/bluetooth";

interface ConnectedDeviceCardProps {
  device: DeviceInfo;
  deviceInfo: string | null;
  power: number | null;
  startNotifications: (() => void) | null;
  stopNotifications: (() => void) | null;
}

export function ConnectedDeviceCard({
  device,
  deviceInfo,
  power,
  startNotifications,
  stopNotifications,
}: ConnectedDeviceCardProps) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "8px",
        backgroundColor: "var(--sanity-bg)",
        border: "1px solid var(--sanity-border)",
        marginBottom: "1rem",
      }}
    >
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
          color: "var(--sanity-foreground)",
        }}
      >
        Connected Device
      </h2>
      <p style={{ margin: "0.25rem 0", color: "var(--sanity-foreground)" }}>
        <strong>Name:</strong> {device.name}
      </p>
      <p style={{ margin: "0.25rem 0" }}>
        <strong>ID:</strong> {device.id}
      </p>
      {deviceInfo && (
        <p style={{ margin: "0.25rem 0" }}>
          <strong>Info:</strong> {deviceInfo}
        </p>
      )}

      <p style={{ margin: "0.25rem 0" }}>
        <strong>Power:</strong> {power} W
      </p>
      <div
        style={{
          display: "inline-block",
          padding: "0.25rem 0.75rem",
          borderRadius: "16px",
          backgroundColor: "var(--sanity-accent-dim)",
          color: "var(--sanity-accent)",
          fontSize: "0.875rem",
          marginTop: "0.5rem",
        }}
      >
        Connected
      </div>

      {(startNotifications || stopNotifications) && (
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "1rem",
          }}
        >
          {startNotifications && (
            <button
              onClick={startNotifications}
              className={styles.secondary}
              style={{
                backgroundColor: "rgba(0, 255, 0, 0.1)",
                borderColor: "rgba(0, 255, 0, 0.3)",
              }}
            >
              Start Notifications
            </button>
          )}
          {stopNotifications && (
            <button
              onClick={stopNotifications}
              className={styles.secondary}
              style={{
                backgroundColor: "rgba(255, 0, 0, 0.1)",
                borderColor: "rgba(255, 0, 0, 0.3)",
              }}
            >
              Stop Notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}

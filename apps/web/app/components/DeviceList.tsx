import { useState } from "react";
import styles from "../page.module.css";
import type { DeviceInfo } from "../types/bluetooth";

interface DeviceListProps {
  devices: DeviceInfo[];
  onConnect: (device: DeviceInfo) => Promise<{
    startNotifications: () => void;
    stopNotifications: () => void;
  }>;
}

export function DeviceList({ devices, onConnect }: DeviceListProps) {
  const [startNotifications, setStartNotifications] = useState<
    (() => void) | null
  >(null);
  const [stopNotifications, setStopNotifications] = useState<
    (() => void) | null
  >(null);
  if (devices.length === 0) return null;

  const connect = async (device: DeviceInfo) => {
    const { startNotifications, stopNotifications } = await onConnect(device);
    setStartNotifications(() => startNotifications);
    setStopNotifications(() => stopNotifications);
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1rem",
        }}
      >
        Available Devices
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {devices.map((device) => (
          <div key={device.id}>
            <button
              key={device.id}
              onClick={() => connect(device)}
              className={styles.secondary}
              style={{
                textAlign: "left",
                justifyContent: "flex-start",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{device.name}</div>
                <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
                  {device.id}
                </div>
              </div>
            </button>
            {startNotifications !== null && (
              <button
                onClick={() => startNotifications()}
                className={styles.secondary}
                style={{
                  textAlign: "left",
                  justifyContent: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
                    {device.id} - start notifications
                  </div>
                </div>
              </button>
            )}
            {stopNotifications !== null && (
              <button
                onClick={() => stopNotifications()}
                className={styles.secondary}
                style={{
                  textAlign: "left",
                  justifyContent: "flex-start",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.875rem", opacity: 0.7 }}>
                    {device.id} - stop notifications
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

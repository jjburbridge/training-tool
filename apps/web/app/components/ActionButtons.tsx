import styles from "../page.module.css";
import type { DeviceInfo } from "../types/bluetooth";

interface ActionButtonsProps {
  isScanning: boolean;
  onScan: () => void;
  connectedDevice: DeviceInfo | null;
  onDisconnect: () => void;
}

export function ActionButtons({
  isScanning,
  onScan,
  connectedDevice,
  onDisconnect,
}: ActionButtonsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        marginBottom: "2rem",
      }}
    >
      <button
        onClick={onScan}
        disabled={isScanning}
        className={styles.secondary}
        style={{
          opacity: isScanning ? 0.6 : 1,
          cursor: isScanning ? "not-allowed" : "pointer",
        }}
      >
        {isScanning ? "Scanning..." : "Scan for Bluetooth Devices"}
      </button>

      {connectedDevice && (
        <button
          onClick={onDisconnect}
          className={styles.btnDanger}
        >
          Disconnect Device
        </button>
      )}
    </div>
  );
}

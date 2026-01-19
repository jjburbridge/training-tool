export const BLUETOOTH_SERVICES = {
  FTM: 0x1826,
  POWER: 0x1818,
  CADENCE: 0x1816,
  HEART_RATE: 0x180d,
  DEVICE_INFO: 0x180a,
} as const;

export const CHARACTERISTICS = {
  CONTROL_POINT: 0x2ad9,
  FEATURE: 0x2acc,
  STATUS: 0x2ada,
  POWER: 0x2a63,
  CSC: 0x2A5B,
} as const;

export function handleBluetoothError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "NotFoundError") {
      return "No device selected.";
    }
    if (error.name === "SecurityError") {
      return "Bluetooth access denied. Please allow Bluetooth access in your browser settings.";
    }
    return `Error: ${error.message}`;
  }
  return "An unknown error occurred.";
}

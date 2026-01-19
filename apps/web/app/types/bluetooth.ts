export interface DeviceInfo {
  id: string;
  name: string;
  device: globalThis.BluetoothDevice;
}

export interface BluetoothState {
  isSupported: boolean | null;
  isScanning: boolean;
  devices: DeviceInfo[];
  connectedDevice: DeviceInfo | null;
  error: string | null;
  deviceInfo: string | null;
  power: number | null;
  historicalData: number[];
  startTimestamp: number | null;
}
